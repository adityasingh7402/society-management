import connectToDatabase from "../../../lib/mongodb";
import AmenityBill from '../../../models/AmenityBill';
import BillHead from '../../../models/BillHead';
import Ledger from '../../../models/Ledger';
import JournalVoucher from '../../../models/JournalVoucher';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { logAction, logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let session;
  let retryCount = 0;
  const MAX_RETRIES = 3;

  async function attemptBillGeneration() {
    try {
      // Start a new session for each attempt
      if (session) {
        await session.endSession();
      }
      session = await mongoose.startSession();
      session.startTransaction();

      await connectToDatabase();

      // Verify token
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        await logFailure('TOKEN_VALIDATION', req, 'No token provided');
        return res.status(401).json({ error: 'No token provided' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
          throw new Error('Invalid token payload');
        }
      } catch (tokenError) {
        await logFailure('TOKEN_VALIDATION', req, tokenError.message);
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Extract admin details from token
      const adminId = decoded.id;
      const adminName = decoded.name || 'Admin';

      const {
        societyId,
        billHeadId,
        flatNumber,
        blockName,
        floorNumber,
        residentId,
        ownerName,
        ownerMobile,
        ownerEmail,
        unitUsage,
        issueDate,
        dueDate,
        periodType
      } = req.body;

      // Validate required fields
      if (!societyId || !billHeadId || !flatNumber || !blockName || !floorNumber || !residentId || !periodType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get bill head details
      const billHead = await BillHead.findById(billHeadId).session(session);
      if (!billHead) {
        return res.status(404).json({ error: 'Bill head not found' });
      }

      // Get required ledgers
      const incomeLedger = await Ledger.findById(billHead.accountingConfig.incomeLedgerId).session(session);
      if (!incomeLedger) {
        return res.status(400).json({ message: 'Income ledger not found' });
      }

      const receivableLedger = await Ledger.findById(billHead.accountingConfig.receivableLedgerId).session(session);
      if (!receivableLedger) {
        return res.status(400).json({ message: 'Receivable ledger not found' });
      }

      // Calculate base amount based on calculation type
      let baseAmount = 0;
      switch (billHead.calculationType) {
        case 'Fixed':
          baseAmount = billHead.fixedAmount;
          break;
        case 'PerUnit':
          baseAmount = unitUsage * billHead.perUnitRate;
          break;
        case 'Formula':
          // Implement formula calculation if needed
          break;
        default:
          return res.status(400).json({ message: 'Invalid calculation type' });
      }

      // Calculate GST if applicable
      const gstDetails = {
        isGSTApplicable: billHead.gstConfig.isGSTApplicable,
        cgstPercentage: billHead.gstConfig.cgstPercentage,
        sgstPercentage: billHead.gstConfig.sgstPercentage,
        igstPercentage: billHead.gstConfig.igstPercentage,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0
      };

      let gstLedger;
      if (gstDetails.isGSTApplicable) {
        gstDetails.cgstAmount = (baseAmount * gstDetails.cgstPercentage) / 100;
        gstDetails.sgstAmount = (baseAmount * gstDetails.sgstPercentage) / 100;
        gstDetails.igstAmount = (baseAmount * gstDetails.igstPercentage) / 100;

        // Get GST ledger from bill head configuration
        gstLedger = await Ledger.findById(billHead.accountingConfig.gstLedgerId).session(session);
        if (!gstLedger) {
          return res.status(400).json({ message: 'GST ledger not found. Please configure it in bill head settings.' });
        }
      }

      const totalAmount = baseAmount + gstDetails.cgstAmount + gstDetails.sgstAmount + gstDetails.igstAmount;

      // Create amenity bill
      const amenityBill = new AmenityBill({
        societyId,
        billHeadId,
        flatNumber,
        blockName,
        floorNumber,
        residentId,
        ownerName,
        ownerMobile,
        ownerEmail,
        baseAmount,
        unitUsage,
        perUnitRate: billHead.perUnitRate,
        formula: billHead.formula,
        gstDetails,
        latePaymentDetails: billHead.latePaymentConfig,
        totalAmount,
        additionalCharges: req.body.additionalCharges || [],
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        periodType,
        status: 'Pending',
        createdBy: decoded.id,
        approvedBy: {
          adminId: adminId,
          adminName: adminName,
          approvedAt: new Date()
        }
      });

      // Generate bill number
      amenityBill.billNumber = await amenityBill.generateBillNumber(session);

      // Create journal voucher
      const journalVoucher = new JournalVoucher({
        societyId,
        voucherType: 'Journal',
        voucherDate: new Date(),
        referenceType: 'Bill',
        referenceId: amenityBill._id,
        referenceNumber: amenityBill.billNumber,
        category: 'Amenity',
        subCategory: billHead.subCategory,
        narration: `Bill generated for ${billHead.name} - ${amenityBill.billNumber}`,
        entries: [],
        gstDetails: {
          isGSTApplicable: billHead.gstConfig.isGSTApplicable,
          gstType: 'Regular',
          gstMonth: new Date(),
          gstEntries: []
        },
        status: 'Active',
        approvalStatus: 'Approved',
        approvalWorkflow: [{
          action: 'Created',
          userId: decoded.id,
          remarks: 'Auto-approved on bill generation',
          timestamp: new Date()
        }],
        createdBy: decoded.id,
        tags: [`${billHead.category}`, `${billHead.subCategory}`],
        approvedBy: {
          adminId: adminId,
          adminName: adminName,
          approvedAt: new Date()
        }
      });

      // Add main bill entries
      journalVoucher.entries.push({
        ledgerId: receivableLedger._id,
        type: 'debit',
        amount: totalAmount,
        description: `Bill for ${billHead.name}`
      });

      journalVoucher.entries.push({
        ledgerId: incomeLedger._id,
        type: 'credit',
        amount: baseAmount,
        description: `Bill for ${billHead.name}`
      });

      // Add GST entries if applicable
      if (gstDetails.isGSTApplicable) {
        const gstAmount = gstDetails.cgstAmount + gstDetails.sgstAmount + gstDetails.igstAmount;
        if (gstAmount > 0) {
          journalVoucher.entries.push({
            ledgerId: gstLedger._id,
            type: 'credit',
            amount: gstAmount,
            description: 'GST on bill'
          });
        }
      }

      // Generate voucher number
      journalVoucher.voucherNumber = await JournalVoucher.generateVoucherNumber(
        societyId,
        billHead.code,
        new Date()
      );

      // Save the journal voucher
      await journalVoucher.save({ session });

      // Post entries to ledgers
      for (const entry of journalVoucher.entries) {
        const ledger = await Ledger.findById(entry.ledgerId).session(session);
        if (!ledger) {
          throw new Error(`Ledger not found: ${entry.ledgerId}`);
        }
        
        // Use the updateBalance method instead of directly modifying the balance
        await ledger.updateBalance(entry.amount, entry.type, session);
      }

      // Add journal entry reference to amenity bill
      amenityBill.journalEntries = [{
        voucherId: journalVoucher._id,
        type: 'Bill',
        amount: totalAmount,
        date: new Date()
      }];

      // Save the bill
      await amenityBill.save({ session });

      // Log successful bill creation
      await logSuccess(
        'AMENITY_BILL_CREATE',
        req,
        {
          billId: amenityBill._id,
          billNumber: amenityBill.billNumber,
          societyId: societyId,
          residentId: residentId,
          totalAmount: totalAmount
        },
        amenityBill._id.toString(),
        'amenity_bill'
      );

      await session.commitTransaction();
      return { success: true, data: amenityBill };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }

  try {
    const result = await attemptBillGeneration();
    res.status(201).json({
      message: 'Amenity bill generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in generateBill:', error);
    
    // Log the error
    await logFailure(
      'AMENITY_BILL_CREATE',
      req,
      error.message,
      {
        societyId: req.body?.societyId,
        billHeadId: req.body?.billHeadId,
        residentId: req.body?.residentId,
        errorStack: error.stack
      },
      error.code,
      error.stack
    );
    
    res.status(500).json({ error: error.message || 'Internal server error' });
  } finally {
    if (session) {
      session.endSession();
    }
  }
} 