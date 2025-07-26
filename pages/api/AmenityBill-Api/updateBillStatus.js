import AmenityBill from '../../../models/AmenityBill';
import connectDB from '../../../lib/mongodb';
import { verifyToken } from '../../../utils/auth';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
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
    const { status } = req.body;

    if (!billId) {
      return res.status(400).json({ message: 'Bill ID is required' });
    }

    if (!status || !['Pending', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
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

      // Update status
      if (status === 'Paid') {
        // If marking as paid, update payment date and paid amount
        bill.status = 'Paid';
        bill.paymentDate = new Date();
        bill.paidAmount = bill.totalAmount;
        bill.remainingAmount = 0;
      } else if (status === 'Cancelled') {
        // If cancelling, check if bill has any payments
        if (bill.paidAmount > 0) {
          return res.status(400).json({ message: 'Cannot cancel a bill that has payments' });
        }
        bill.status = 'Cancelled';
      } else {
        bill.status = status;
      }

      // Add status change to history
      bill.statusHistory = bill.statusHistory || [];
      bill.statusHistory.push({
        status,
        changedBy: decoded.id,
        changedAt: new Date(),
        remarks: req.body.remarks || `Status changed to ${status}`
      });

      // Save changes
      await bill.save({ session });

      // Commit transaction
      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: 'Bill status updated successfully',
        data: bill
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error updating bill status:', error);
    return res.status(500).json({ message: 'Failed to update bill status', error: error.message });
  }
} 