import mongoose from 'mongoose';
import AmenityBill from '../../../models/AmenityBill';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Use verifyToken helper instead of direct jwt verification
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Connect to MongoDB if not connected
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { billId } = req.query;

    if (!billId) {
      return res.status(400).json({ error: 'Bill ID is required' });
    }

    // Get the bill with populated bill head and journal voucher details
    const bill = await AmenityBill.findById(billId)
      .populate('billHeadId')
      .populate({
        path: 'journalEntries.voucherId',
        model: 'JournalVoucher',
        populate: {
          path: 'entries.ledgerId',
          model: 'Ledger'
        }
      })
      .lean();

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Calculate remaining amount and late fee if applicable
    bill.remainingAmount = bill.totalAmount - (bill.paidAmount || 0);
    if (bill.status !== 'Paid' && new Date(bill.dueDate) < new Date()) {
      const lateFee = await AmenityBill.findById(billId).then(doc => doc.calculateLateFee());
      bill.currentLateFee = lateFee;
    }

    return res.status(200).json({
      success: true,
      data: bill
    });

  } catch (error) {
    console.error('Error in getBill:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get bill'
    });
  }
} 