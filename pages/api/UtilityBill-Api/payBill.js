import UtilityBill from '../../../models/UtilityBill';
import BillHead from '../../../models/BillHead';
import JournalVoucher from '../../../models/JournalVoucher';
import Wallet from '../../../models/Wallet';
import WalletTransaction from '../../../models/WalletTransaction';
import connectDB from '../../../lib/mongodb';
import { verifyToken } from '../../../utils/auth';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('PayBill API called with body:', JSON.stringify(req.body, null, 2));
    await connectDB();
    
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
    const bill = await UtilityBill.findById(billId)
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

    console.log('Bill found:', { billId: bill._id, status: bill.status, remainingAmount: bill.remainingAmount });
    
    // Calculate late fee if applicable
    let lateFee = 0;
    try {
      lateFee = bill.calculateLateFee ? bill.calculateLateFee() : 0;
    } catch (error) {
      console.warn('Error calculating late fee:', error.message);
      lateFee = 0;
    }
    console.log('Late fee calculated:', lateFee);
    
    const totalDue = bill.remainingAmount + lateFee;
    console.log('Total due amount:', totalDue, 'Payment amount:', amount);

    if (amount > totalDue) {
      return res.status(400).json({ message: 'Payment amount exceeds due amount' });
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(bill.societyId);

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
      voucherNumber: receiptNumber,
      voucherDate: new Date(),
      voucherType: 'Receipt',
      referenceType: 'Payment',
      referenceId: bill._id,
      referenceNumber: bill.billNumber,
      narration: `Payment received for bill ${bill.billNumber}`,
      entries: [
        // Debit entry (Bank/Cash)
        {
          ledgerId: await getLedgerIdForPaymentMethod(bill.societyId, paymentMethod),
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
      status: 'Active',
      createdBy: decoded.id
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

    // Update wallet when paymentMethod is Wallet
    if (paymentMethod === 'Wallet') {
      console.log('Processing wallet payment for resident:', bill.residentId);
      const wallet = await Wallet.findOne({ residentId: bill.residentId });
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      console.log('Wallet found. Current balance:', wallet.currentBalance, 'Payment amount:', amount);
      
      // Ensure wallet has sufficient balance
      if (wallet.currentBalance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Store balance before deduction for transaction record
      const balanceBefore = wallet.currentBalance;
      
      // Debit wallet
      wallet.updateBalance(amount, 'debit');
      console.log('Wallet balance after deduction:', wallet.currentBalance);
      
      // Create wallet transaction with correct balance values
      const walletTransaction = new WalletTransaction({
        walletId: wallet._id,
        residentId: bill.residentId,
        societyId: bill.societyId,
        transactionFlow: 'DEBIT',
        amount,
        balanceBefore: balanceBefore,
        balanceAfter: wallet.currentBalance,
        type: 'UTILITY_PAYMENT',
        description: `Utility bill payment for bill ${bill.billNumber}`,
        billDetails: {
          billId: bill._id,
          billType: 'UtilityBill',
          billNumber: bill.billNumber,
          dueDate: bill.dueDate
        },
        createdBy: decoded.id
      });

      console.log('Saving wallet and transaction...');
      await wallet.save();
      await walletTransaction.save();
      console.log('Wallet and transaction saved successfully');
    }

    // Save all changes
    await bill.save();
    await journalVoucher.save();

    // Add journal entry reference to bill
    bill.journalEntries.push({
      voucherId: journalVoucher._id,
      type: 'Payment',
      amount: amount,
      date: new Date()
    });
    await bill.save();

    res.status(200).json({
      message: 'Payment recorded successfully',
      data: {
        bill,
        payment,
        journalVoucher
      }
    });

  } catch (error) {
    console.error('Error recording payment:', error);
    
    // Return 400 for business logic errors
    if (error.message.includes('Wallet not found') || 
        error.message.includes('Insufficient wallet balance') ||
        error.message.includes('Ledger not found')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Failed to record payment', error: error.message });
  }
}

// Helper function to generate receipt number
async function generateReceiptNumber(societyId) {
  const date = new Date();
  const prefix = 'RCP/' + date.getFullYear().toString().substr(-2) + 
    ('0' + (date.getMonth() + 1)).slice(-2) + '/';
  
  const lastVoucher = await JournalVoucher.findOne({
    societyId,
    voucherNumber: new RegExp('^' + prefix)
  }).sort({ voucherNumber: -1 });
  
  let nextNumber = 1;
  if (lastVoucher) {
    const lastNumber = parseInt(lastVoucher.voucherNumber.split('/').pop());
    nextNumber = lastNumber + 1;
  }
  
  return prefix + ('000' + nextNumber).slice(-4);
}

// Helper function to get ledger id based on payment method
async function getLedgerIdForPaymentMethod(societyId, paymentMethod) {
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
    case 'Wallet':
      query.category = 'Bank';
      break;
    default:
      query.category = 'Bank';
  }
  
  const ledger = await Ledger.findOne(query);
  if (!ledger) {
    throw new Error(`Ledger not found for payment method: ${paymentMethod}`);
  }
  
  return ledger._id;
}