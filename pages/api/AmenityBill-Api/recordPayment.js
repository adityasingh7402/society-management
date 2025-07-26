import AmenityBill from '../../../models/AmenityBill';
import BillHead from '../../../models/BillHead';
import JournalVoucher from '../../../models/JournalVoucher';
import connectToDatabase from '../../../lib/mongodb';
import { verifyToken } from '../../../utils/auth';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    
    // Verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const {
      billId,
      amount,
      paymentMethod,
      transactionId,
      bankDetails,
      notes
    } = req.body;

    // Validate required fields
    if (!billId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['billId', 'amount', 'paymentMethod']
      });
    }

    // Find bill and populate bill head
    const bill = await AmenityBill.findById(billId)
      .populate({
        path: 'billHeadId',
        populate: [
          { path: 'accountingConfig.incomeLedgerId' },
          { path: 'accountingConfig.receivableLedgerId' }
        ]
      });

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.status === 'Paid') {
      return res.status(400).json({ message: 'Bill is already paid' });
    }

    if (bill.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot pay cancelled bill' });
    }

    // Calculate late fee if applicable
    const lateFee = bill.calculateLateFee();
    const totalDue = bill.remainingAmount + lateFee;

    if (amount > totalDue) {
      return res.status(400).json({ message: 'Payment amount exceeds due amount' });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Generate receipt number
      const receiptNumber = await generateReceiptNumber(bill.societyId, session);

      // Create payment record
      const payment = {
        amount,
        paymentDate: new Date(),
        paymentMethod,
        transactionId,
        receiptNumber,
        notes,
        recordedBy: decoded.id
      };

      if (bankDetails) {
        payment.bankDetails = bankDetails;
      }

      // Update bill
      bill.paidAmount += amount;
      bill.paymentHistory.push(payment);
      
      // Update status
      if (bill.paidAmount >= bill.totalAmount + lateFee) {
        bill.status = 'Paid';
        bill.paymentDate = new Date();
      } else if (bill.paidAmount > 0) {
        bill.status = 'Partially Paid';
      }

      // Create journal voucher for payment
      const journalVoucher = new JournalVoucher({
        societyId: bill.societyId,
        voucherNumber: 'RCP/' + receiptNumber,
        voucherDate: new Date(),
        voucherType: 'Receipt',
        referenceType: 'Payment',
        referenceId: bill._id,
        referenceNumber: bill.billNumber,
        category: 'Amenity',
        subCategory: bill.amenityType,
        narration: `Payment received for bill ${bill.billNumber}`,
        entries: [
          // Debit entry (Bank/Cash)
          {
            ledgerId: await getLedgerIdForPaymentMethod(bill.societyId, paymentMethod, session),
            type: 'debit',
            amount: amount,
            description: `Payment for bill ${bill.billNumber}`
          },
          // Credit entry (Receivable)
          {
            ledgerId: bill.billHeadId.accountingConfig.receivableLedgerId,
            type: 'credit',
            amount: amount,
            description: `Payment for bill ${bill.billNumber}`
          }
        ],
        status: 'Posted',
        createdBy: decoded.id,
        approvedBy: {
          adminId: decoded.id,
          adminName: decoded.name || 'Admin',
          approvedAt: new Date()
        }
      });

      // Add late fee entries if applicable
      if (lateFee > 0) {
        const lateFeeAmount = Math.min(lateFee, amount - bill.remainingAmount);
        if (lateFeeAmount > 0) {
          journalVoucher.entries.push({
            ledgerId: bill.billHeadId.accountingConfig.lateFeeIncomeLedgerId,
            type: 'credit',
            amount: lateFeeAmount,
            description: 'Late payment fee'
          });
        }
      }

      // Save journal voucher
      await journalVoucher.save({ session });

      // Add journal entry reference to bill
      bill.journalEntries.push({
        voucherId: journalVoucher._id,
        type: 'Payment',
        amount: amount,
        date: new Date()
      });

      // Save bill
      await bill.save({ session });

      // Commit transaction
      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: 'Payment recorded successfully',
        data: {
          bill,
          payment,
          journalVoucher
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error recording payment:', error);
    return res.status(500).json({ message: 'Failed to record payment', error: error.message });
  }
}

// Helper function to generate receipt number
async function generateReceiptNumber(societyId, session) {
  const date = new Date();
  const prefix = 'RCP/' + date.getFullYear().toString().substr(-2) + 
    ('0' + (date.getMonth() + 1)).slice(-2) + '/';
  
  const lastVoucher = await JournalVoucher.findOne({
    societyId,
    voucherNumber: new RegExp('^' + prefix)
  }).sort({ voucherNumber: -1 }).session(session);
  
  let nextNumber = 1;
  if (lastVoucher) {
    const lastNumber = parseInt(lastVoucher.voucherNumber.split('/').pop());
    nextNumber = lastNumber + 1;
  }
  
  return prefix + ('000' + nextNumber).slice(-4);
}

// Helper function to get ledger ID for payment method
async function getLedgerIdForPaymentMethod(societyId, paymentMethod, session) {
  const Ledger = mongoose.model('Ledger');
  let query = {
    societyId,
    status: 'Active'
  };
  
  switch (paymentMethod) {
    case 'Cash':
      query.category = 'Cash';
      break;
    case 'Cheque':
    case 'Bank Transfer':
    case 'UPI':
    case 'NEFT':
    case 'RTGS':
      query.category = 'Bank';
      break;
    default:
      query.category = 'Bank';
  }
  
  const ledger = await Ledger.findOne(query).session(session);
  if (!ledger) {
    throw new Error(`Ledger not found for payment method: ${paymentMethod}`);
  }
  
  return ledger._id;
} 