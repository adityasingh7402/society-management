import connectToDatabase from '../../../lib/mongodb';
import MaintenanceBill from '../../../models/MaintenanceBill';
import BillHead from '../../../models/BillHead';
import JournalVoucher from '../../../models/JournalVoucher';
import Ledger from '../../../models/Ledger';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify token
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await connectToDatabase();

    const {
      societyId,
      flatId,
      flatNumber,
      blockName,
      floorNumber,
      residentId,
      ownerName,
      ownerMobile,
      ownerEmail,
      billHeadId,
      billHeadDetails,
      description,
      baseAmount,
      additionalCharges,
      gstDetails,
      issueDate,
      dueDate,
      finePerDay,
      totalAmount
    } = req.body;

    // Validate bill head exists and get category
    const billHead = await BillHead.findById(billHeadId);
    if (!billHead) {
      return res.status(400).json({ message: 'Invalid bill head' });
    }

    // Get category-specific ledgers
    const incomeLedger = await Ledger.findOne({
      societyId,
      category: billHead.category,
      type: 'Income'
    });

    const receivableLedger = await Ledger.findOne({
      societyId,
      category: billHead.category,
      type: 'Asset',
      subCategory: 'Receivable'
    });

    if (!incomeLedger || !receivableLedger) {
      return res.status(400).json({ 
        message: `Category-specific ledgers not found for ${billHead.category}. Please create them first.`
      });
    }

    // Create maintenance bill
    const bill = await MaintenanceBill.create({
      societyId,
      flatId,
      flatNumber,
      blockName,
      floorNumber,
      residentId,
      ownerName,
      ownerMobile,
      ownerEmail,
      billHeadId,
      billHeadDetails,
      description,
      baseAmount,
      additionalCharges,
      gstDetails: {
        cgst: gstDetails?.cgst || 0,
        sgst: gstDetails?.sgst || 0,
        igst: gstDetails?.igst || 0,
        totalGst: gstDetails?.totalGst || 0
      },
      issueDate,
      dueDate,
      finePerDay,
      totalAmount,
      status: 'Pending',
      generatedBy: decoded.Id,
      generatedAt: new Date()
    });

    // Create journal voucher entries
    const journalVoucher = await JournalVoucher.create({
      societyId,
      voucherNumber: 'JV/' + bill.billNumber,
      voucherDate: new Date(),
      voucherType: 'Journal',
      referenceType: 'Bill',
      referenceId: bill._id,
      referenceNumber: bill.billNumber,
      narration: `${billHead.category} bill generated for ${flatNumber}`,
      entries: [
        // Debit entry (Receivable)
        {
          ledgerId: receivableLedger._id,
          type: 'debit',
          amount: totalAmount,
          description: `Bill for ${billHeadDetails.name}`
        },
        // Credit entry (Income)
        {
          ledgerId: incomeLedger._id,
          type: 'credit',
          amount: baseAmount,
          description: `Bill for ${billHeadDetails.name}`
        }
      ],
      status: 'Posted',
      createdBy: decoded.Id
    });

    // Add GST entries if applicable
    if (gstDetails?.totalGst > 0) {
      // Find GST ledger
      const gstLedger = await Ledger.findOne({
        societyId,
        type: 'Liability',
        subCategory: 'GST'
      });

      if (!gstLedger) {
        return res.status(400).json({ message: 'GST ledger not found. Please create it first.' });
      }

      if (gstDetails.cgst > 0) {
        journalVoucher.entries.push({
          ledgerId: gstLedger._id,
          type: 'credit',
          amount: gstDetails.cgst,
          description: 'CGST on maintenance bill'
        });
      }
      if (gstDetails.sgst > 0) {
        journalVoucher.entries.push({
          ledgerId: gstLedger._id,
          type: 'credit',
          amount: gstDetails.sgst,
          description: 'SGST on maintenance bill'
        });
      }
      if (gstDetails.igst > 0) {
        journalVoucher.entries.push({
          ledgerId: gstLedger._id,
          type: 'credit',
          amount: gstDetails.igst,
          description: 'IGST on maintenance bill'
        });
      }
    }

    // Add additional charges entries
    if (additionalCharges?.length > 0) {
      for (const charge of additionalCharges) {
        journalVoucher.entries.push({
          ledgerId: incomeLedger._id,
          type: 'credit',
          amount: charge.amount,
          description: charge.description
        });
      }
    }

    await journalVoucher.save();

    // Add journal entry reference to bill
    bill.journalEntries.push({
      voucherId: journalVoucher._id,
      type: 'Bill',
      amount: totalAmount,
      date: new Date()
    });
    await bill.save();

    res.status(201).json({ 
      message: 'Bill generated successfully',
      bill,
      journalVoucher
    });

  } catch (error) {
    console.error('Error generating bill:', error);
    res.status(500).json({ message: 'Failed to generate bill', error: error.message });
  }
}