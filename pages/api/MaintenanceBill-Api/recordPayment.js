import connectToDatabase from "../../../lib/mongodb";
import MaintenanceBill from '../../../models/MaintenanceBill';
import PaymentEntry from '../../../models/PaymentEntry';
import JournalVoucher from '../../../models/JournalVoucher';
import Ledger from '../../../models/Ledger';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await connectToDatabase();

    // Extract payment details from request body
    const {
      billId,
      amount,
      paymentMethod,
      transactionId,
      paymentDate,
      notes,
      societyId,
      residentId
    } = req.body;

    // Validate required fields
    if (!billId || !amount || !paymentMethod || !societyId || !residentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the bill
    const bill = await MaintenanceBill.findById(billId);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Get payment ledger based on payment method
    const paymentLedger = await getPaymentLedger(paymentMethod, societyId);
    if (!paymentLedger) {
      return res.status(400).json({ error: 'Payment ledger not found' });
    }

    // Get receivable ledger
    const receivableLedger = await getReceivableLedger(societyId);
    if (!receivableLedger) {
      return res.status(400).json({ error: 'Receivable ledger not found' });
    }

    // Create payment entry
    const paymentEntry = new PaymentEntry({
      billId,
      amount,
      paymentMode: paymentMethod,
      transactionId,
      paymentDate: paymentDate || new Date(),
      notes,
      status: 'Approved',
      maker: {
        userId: decoded.id,
        name: decoded.name,
        timestamp: new Date(),
        remarks: notes
      },
      approver: {
        userId: decoded.id,
        name: decoded.name,
        timestamp: new Date(),
        remarks: 'Auto-approved'
      }
    });

    // Create journal voucher
    const journalVoucher = new JournalVoucher({
      societyId,
      voucherType: 'Journal',
      voucherDate: new Date(),
      referenceType: 'Payment',
      referenceId: paymentEntry._id,
      referenceNumber: transactionId,
      category: 'Maintenance',
      subCategory: 'Payment',
      narration: `Payment received for bill ${bill.billNumber}`,
      entries: [
        {
          ledgerId: paymentLedger._id,
          type: 'debit',
          amount,
          description: `Payment received via ${paymentMethod}`
        },
        {
          ledgerId: receivableLedger._id,
          type: 'credit',
          amount,
          description: `Payment received for bill ${bill.billNumber}`
        }
      ],
      status: 'Active',
      approvalStatus: 'Approved',
      approvalWorkflow: [{
        action: 'Created',
        userId: decoded.id,
        remarks: 'Auto-approved on payment',
        timestamp: new Date()
      }],
      createdBy: decoded.id,
      tags: ['Maintenance', 'Payment'],
      approvedBy: {
        adminId: decoded.id,
        adminName: decoded.name,
        approvedAt: new Date()
      }
    });

    // Generate voucher number
    journalVoucher.voucherNumber = await JournalVoucher.generateVoucherNumber(
      societyId,
      'PMT',
      new Date()
    );

    // Save journal voucher
    await journalVoucher.save();

    // Update payment entry with journal voucher reference
    paymentEntry.journalVoucherId = journalVoucher._id;
    await paymentEntry.save();

    // Update bill
    bill.paidAmount = (bill.paidAmount || 0) + amount;
    bill.remainingAmount = bill.totalAmount - bill.paidAmount;
    bill.status = bill.paidAmount >= bill.totalAmount ? 'Paid' : 'Partially Paid';
    bill.paymentHistory.push({
      amount,
      paymentDate: paymentDate || new Date(),
      paymentMethod,
      transactionId,
      notes,
      recordedBy: decoded.id,
      makerName: decoded.name,
      makerContact: decoded.phone || '',
      makerEmail: decoded.email || ''
    });
    bill.journalEntries.push({
      voucherId: journalVoucher._id,
      type: 'Payment',
      amount,
      date: new Date()
    });

    await bill.save();

    // Update ledger balances
    await paymentLedger.updateBalance(amount, 'debit');
    await receivableLedger.updateBalance(amount, 'credit');

    res.status(200).json({
      message: 'Payment recorded successfully',
      data: {
        paymentEntry,
        journalVoucher,
        bill
      }
    });

  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: error.message || 'Failed to record payment' });
  }
}

// Helper function to get payment ledger
async function getPaymentLedger(paymentMethod, societyId) {
  let ledgerType;
  switch (paymentMethod.toLowerCase()) {
    case 'cash':
      ledgerType = 'Cash';
      break;
    case 'bank transfer':
    case 'neft':
    case 'rtgs':
    case 'upi':
    case 'card':
      ledgerType = 'Bank';
      break;
    case 'cheque':
      ledgerType = 'Bank';
      break;
    default:
      ledgerType = 'Bank';
  }

  return await Ledger.findOne({
    societyId,
    type: 'Asset',
    subCategory: ledgerType
  });
}

// Helper function to get receivable ledger
async function getReceivableLedger(societyId) {
  return await Ledger.findOne({
    societyId,
    type: 'Asset',
    subCategory: 'Receivable',
    category: 'Maintenance'
  });
}