import connectToDatabase from "../../../lib/mongodb";
import MaintenanceBill from '../../../models/MaintenanceBill';
import BillHead from '../../../models/BillHead';
import Ledger from '../../../models/Ledger';
import JournalVoucher from '../../../models/JournalVoucher';
import Society from '../../../models/Society';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { logSuccess, logFailure } from '../../../services/loggingService';

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
        await logFailure('MAINTENANCE_BILL_CREATE', req, 'No authorization token provided');
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        await logFailure('MAINTENANCE_BILL_CREATE', req, 'Invalid authorization token');
        return res.status(401).json({ error: 'Invalid token' });
      }

      console.log('Additional:', req.body.additionalCharges);
      // Extract admin details from token
      const adminId = decoded.id;
      const adminName = decoded.name || 'Admin'; // Fallback if name is not in token

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
        dueDate
      } = req.body;

      // Validate required fields
      if (!societyId || !billHeadId || !flatNumber || !blockName || !floorNumber || !residentId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Find society by code
      const society = await Society.findOne({ societyId: societyId }).session(session);
      if (!society) {
        return res.status(404).json({ error: 'Society not found' });
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

      // Create maintenance bill
      const maintenanceBill = new MaintenanceBill({
        societyId: society._id, // Use society's MongoDB _id
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
        periodType: req.body.periodType || 'Monthly', // Add period type with default
        gstDetails,
        latePaymentDetails: billHead.latePaymentConfig,
        totalAmount,
        additionalCharges: req.body.additionalCharges || [],
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        status: 'Pending',
        createdBy: decoded.id,
        approvedBy: {
          adminId: adminId,
          adminName: adminName,
          approvedAt: new Date()
        }
      });

      // Generate bill number
      maintenanceBill.billNumber = await maintenanceBill.generateBillNumber(session);

      // Create journal voucher
      const journalVoucher = new JournalVoucher({
        societyId: society._id, // Use society's MongoDB _id
        voucherType: 'Journal',
        voucherDate: new Date(),
        referenceType: 'Bill',
        referenceId: maintenanceBill._id,
        referenceNumber: maintenanceBill.billNumber,
        category: 'Maintenance',
        subCategory: billHead.subCategory,
        narration: `Bill generated for ${billHead.name} - ${maintenanceBill.billNumber}`,
        entries: [],  // Initialize empty entries array
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

      // Calculate total amount including all charges
      let totalBillAmount = baseAmount;
      
      // Add main bill entries
      journalVoucher.entries.push({
        ledgerId: receivableLedger._id,
        type: 'debit',
        amount: totalAmount, // This will be updated after all calculations
        description: `Bill for ${billHead.name}`
      });

      journalVoucher.entries.push({
        ledgerId: incomeLedger._id,
        type: 'credit',
        amount: baseAmount,
        description: `Bill for ${billHead.name}`
      });

      // Add GST entries if applicable
      if (billHead.gstConfig.isGSTApplicable) {
        if (!gstLedger) {
          throw new Error('GST ledger not found');
        }

        // Add CGST entry
        if (gstDetails.cgstAmount > 0) {
          journalVoucher.entries.push({
            ledgerId: gstLedger._id,
            type: 'credit',
            amount: gstDetails.cgstAmount,
            description: `CGST (${gstDetails.cgstPercentage}%) for ${billHead.name}`
          });
          totalBillAmount += gstDetails.cgstAmount;
        }

        // Add SGST entry
        if (gstDetails.sgstAmount > 0) {
          journalVoucher.entries.push({
            ledgerId: gstLedger._id,
            type: 'credit',
            amount: gstDetails.sgstAmount,
            description: `SGST (${gstDetails.sgstPercentage}%) for ${billHead.name}`
          });
          totalBillAmount += gstDetails.sgstAmount;
        }

        // Add IGST entry
        if (gstDetails.igstAmount > 0) {
          journalVoucher.entries.push({
            ledgerId: gstLedger._id,
            type: 'credit',
            amount: gstDetails.igstAmount,
            description: `IGST (${gstDetails.igstPercentage}%) for ${billHead.name}`
          });
          totalBillAmount += gstDetails.igstAmount;
        }
      }

      // Add additional charges entries and update total amount
      if (maintenanceBill.additionalCharges && maintenanceBill.additionalCharges.length > 0) {
        for (const charge of maintenanceBill.additionalCharges) {
          // Verify income ledger exists
          const chargeLedger = await Ledger.findById(charge.ledgerId).session(session);
          if (!chargeLedger) {
            throw new Error(`Ledger not found for additional charge: ${charge.chargeType}`);
          }
          // Try to find a receivable ledger for this additional charge
          let receivableLedger = null;
          if (charge.billHeadId) {
            const chargeBillHead = await BillHead.findById(charge.billHeadId).session(session);
            if (chargeBillHead && chargeBillHead.accountingConfig && chargeBillHead.accountingConfig.receivableLedgerId) {
              receivableLedger = await Ledger.findById(chargeBillHead.accountingConfig.receivableLedgerId).session(session);
            }
          }
          // Add debit entry to receivable ledger if available
          if (receivableLedger) {
            journalVoucher.entries.push({
              ledgerId: receivableLedger._id,
              type: 'debit',
              amount: charge.amount,
              description: `Receivable for Additional Charge: ${charge.chargeType}`
            });
          }
          // Add credit entry for additional charge (income ledger)
          journalVoucher.entries.push({
            ledgerId: charge.ledgerId,
            type: 'credit',
            amount: charge.amount,
            description: `Additional Charge: ${charge.chargeType}`
          });
        }
      }

      // Calculate total credit (total amount)
      const totalCredit = journalVoucher.entries
        .filter(e => e.type === 'credit')
        .reduce((sum, e) => sum + e.amount, 0);

      journalVoucher.entries[0].amount = totalCredit;
      maintenanceBill.totalAmount = totalCredit;

      console.log('Final maintenanceBill.totalAmount:', maintenanceBill.totalAmount);

      // Generate voucher number BEFORE saving
      journalVoucher.voucherNumber = await JournalVoucher.generateVoucherNumber(
        society._id, // Use society's MongoDB _id
        billHead.code,
        new Date()
      );

      // Now save the journal voucher
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

      // Add journal entry reference to maintenance bill
      maintenanceBill.journalEntries = [{
        voucherId: journalVoucher._id,
        type: 'Bill',
        amount: totalCredit,
        date: new Date()
      }];

      await maintenanceBill.save({ session });

      await session.commitTransaction();
      
      // Log successful creation
      await logSuccess('MAINTENANCE_BILL_CREATE', req, {
        billId: maintenanceBill._id,
        billNumber: maintenanceBill.billNumber,
        billHeadName: billHead.name,
        residentName: ownerName,
        flatNumber: flatNumber,
        blockName: blockName,
        baseAmount: maintenanceBill.baseAmount,
        totalAmount: maintenanceBill.totalAmount,
        periodType: maintenanceBill.periodType,
        hasAdditionalCharges: (req.body.additionalCharges || []).length > 0
      }, maintenanceBill._id, 'MaintenanceBill');
      
      return { success: true, data: maintenanceBill };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }

  try {
    const result = await attemptBillGeneration();
    res.status(201).json({
      message: 'Maintenance bill generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in generateBill:', error);
    
    // Log the failure
    await logFailure('MAINTENANCE_BILL_CREATE', req, error.message, {
      billHeadId: req.body?.billHeadId,
      flatNumber: req.body?.flatNumber,
      blockName: req.body?.blockName,
      residentId: req.body?.residentId,
      errorType: error.name
    });
    
    res.status(500).json({ error: error.message || 'Internal server error' });
  } finally {
    if (session) {
      session.endSession();
    }
  }
}