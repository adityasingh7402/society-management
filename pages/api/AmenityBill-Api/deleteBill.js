import AmenityBill from '../../../models/AmenityBill';
import JournalVoucher from '../../../models/JournalVoucher';
import connectDB from '../../../lib/mongodb';
import { verifyToken } from '../../../utils/auth';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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

    const { billId } = req.query;

    if (!billId) {
      return res.status(400).json({ message: 'Bill ID is required' });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the bill
      const bill = await AmenityBill.findById(billId).session(session);

      if (!bill) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      // Check if bill can be deleted
      if (bill.status === 'Paid' || bill.status === 'Partially Paid') {
        return res.status(400).json({ message: 'Cannot delete a bill that has payments' });
      }

      // Delete associated journal vouchers
      if (bill.journalEntries && bill.journalEntries.length > 0) {
        for (const entry of bill.journalEntries) {
          await JournalVoucher.findByIdAndDelete(entry.voucherId).session(session);
        }
      }

      // Delete the bill
      await AmenityBill.findByIdAndDelete(billId).session(session);

      // Commit transaction
      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: 'Bill deleted successfully'
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error deleting bill:', error);
    return res.status(500).json({ message: 'Failed to delete bill', error: error.message });
  }
} 