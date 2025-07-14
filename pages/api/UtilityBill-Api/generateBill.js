import connectToDatabase from "../../../lib/mongodb";
import UtilityBill from '../../../models/UtilityBill';
import BillHead from '../../../models/BillHead';
import Ledger from '../../../models/Ledger';
import JournalVoucher from '../../../models/JournalVoucher';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

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
        return res.status(401).json({ error: 'No token provided' });
    }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
        return res.status(401).json({ error: 'Invalid token' });
    }

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

    // Create utility bill
    const utilityBill = new UtilityBill({
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
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      status: 'Pending',
      createdBy: decoded.id
    });

    // Generate bill number
    utilityBill.billNumber = await utilityBill.generateBillNumber();

      // Create journal voucher
    const journalVoucher = new JournalVoucher({
      societyId,
      voucherDate: new Date(),
      voucherType: 'Journal',
      referenceType: 'Bill',
      referenceId: utilityBill._id,
      referenceNumber: utilityBill.billNumber,
      category: billHead.category,
      subCategory: billHead.subCategory,
      narration: `Bill generated for ${billHead.name} - ${utilityBill.billNumber}`,
      entries: [
        // Debit entry (Receivable)
        {
          ledgerId: receivableLedger._id,
          type: 'debit',
          amount: totalAmount, // Total amount including GST
          description: `Bill for ${billHead.name}`
        },
        // Credit entry (Income)
        {
          ledgerId: incomeLedger._id,
          type: 'credit',
          amount: baseAmount, // Base amount without GST
          description: `Bill for ${billHead.name}`
        }
      ],
      gstDetails: {
        isGSTApplicable: billHead.gstConfig.isGSTApplicable,
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
      tags: [`${billHead.category}`, `${billHead.subCategory}`]
    });

    // Add GST entries if applicable
    if (billHead.gstConfig.isGSTApplicable) {
      // Get GST ledger - use the one we found earlier
      if (!gstLedger) {
        throw new Error('GST ledger not found');
      }

      // Add CGST entry
      if (gstDetails.cgstAmount > 0) {
        const cgstEntry = {
          ledgerId: gstLedger._id,
          type: 'credit',
          amount: gstDetails.cgstAmount,
          description: `CGST (${gstDetails.cgstPercentage}%) for ${billHead.name}`
        };
        journalVoucher.entries.push(cgstEntry);
        journalVoucher.gstDetails.gstEntries.push({
          type: 'CGST',
          percentage: gstDetails.cgstPercentage,
          amount: gstDetails.cgstAmount,
          ledgerId: gstLedger._id
        });
      }

      // Add SGST entry
      if (gstDetails.sgstAmount > 0) {
        const sgstEntry = {
          ledgerId: gstLedger._id,
          type: 'credit',
          amount: gstDetails.sgstAmount,
          description: `SGST (${gstDetails.sgstPercentage}%) for ${billHead.name}`
        };
        journalVoucher.entries.push(sgstEntry);
        journalVoucher.gstDetails.gstEntries.push({
          type: 'SGST',
          percentage: gstDetails.sgstPercentage,
          amount: gstDetails.sgstAmount,
          ledgerId: gstLedger._id
        });
      }

      // Add IGST entry
      if (gstDetails.igstAmount > 0) {
        const igstEntry = {
          ledgerId: gstLedger._id,
          type: 'credit',
          amount: gstDetails.igstAmount,
          description: `IGST (${gstDetails.igstPercentage}%) for ${billHead.name}`
        };
        journalVoucher.entries.push(igstEntry);
        journalVoucher.gstDetails.gstEntries.push({
          type: 'IGST',
          percentage: gstDetails.igstPercentage,
          amount: gstDetails.igstAmount,
          ledgerId: gstLedger._id
        });
      }
    }

      // Validate that total debit equals total credit
      const totalDebit = journalVoucher.entries
        .filter(e => e.type === 'debit')
        .reduce((sum, e) => sum + e.amount, 0);
      
      const totalCredit = journalVoucher.entries
        .filter(e => e.type === 'credit')
        .reduce((sum, e) => sum + e.amount, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Debit (${totalDebit}) and credit (${totalCredit}) amounts do not match`);
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
      await journalVoucher.postToLedgers(session);

      // Add journal entry reference to utility bill
      utilityBill.journalVoucherId = journalVoucher._id;
      await utilityBill.save({ session });

      await session.commitTransaction();
      res.status(200).json({ success: true, data: utilityBill });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }

  try {
    const result = await attemptBillGeneration();
    res.status(201).json({
      message: 'Utility bill generated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error in generateBill:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
    } finally {
    if (session) {
      session.endSession();
    }
  }
}