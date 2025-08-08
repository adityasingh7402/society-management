import connectToDatabase from "../../../lib/mongodb";
import ScheduledBill from '../../../models/ScheduledBill';
import jwt from 'jsonwebtoken';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    
    // Get user ID from token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      await logFailure('SCHEDULED_BILL_DELETE', req, 'No authorization token provided', { scheduledBillId: req.query?.id });
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      await logFailure('SCHEDULED_BILL_DELETE', req, 'Invalid authorization token', { scheduledBillId: req.query?.id });
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id } = req.query;
    if (!id) {
      await logFailure('SCHEDULED_BILL_DELETE', req, 'Bill ID is required');
      return res.status(400).json({ error: 'Bill ID is required' });
    }

    // Find the scheduled bill
    const scheduledBill = await ScheduledBill.findOne({
      _id: id,
      societyId: req.query.societyId
    });

    if (!scheduledBill) {
      await logFailure('SCHEDULED_BILL_DELETE', req, 'Scheduled bill not found or permission denied', {
        scheduledBillId: id,
        societyId: req.query.societyId
      });
      return res.status(404).json({ error: 'Scheduled bill not found' });
    }

    // Check if bill has any generation history
    if (scheduledBill.generationHistory && scheduledBill.generationHistory.length > 0) {
      // Instead of deleting, mark as cancelled
      await ScheduledBill.findOneAndUpdate(
        { _id: id, societyId: req.query.societyId },
        { 
          status: 'Cancelled',
          updatedBy: decoded.id 
        }
      );

      // Log successful cancellation
      await logSuccess('SCHEDULED_BILL_CANCEL', req, {
        scheduledBillId: id,
        title: scheduledBill.title,
        frequency: scheduledBill.frequency,
        totalAmount: scheduledBill.totalAmount,
        generationHistoryCount: scheduledBill.generationHistory?.length || 0,
        reason: 'Has generation history - cancelled instead of deleted'
      }, id, 'ScheduledBill');

      return res.status(200).json({
        message: 'Scheduled bill cancelled successfully'
      });
    }

    // If no generation history, delete the bill
    await ScheduledBill.findOneAndDelete({
      _id: id,
      societyId: req.query.societyId
    });

    // Log successful deletion
    await logSuccess('SCHEDULED_BILL_DELETE', req, {
      scheduledBillId: id,
      title: scheduledBill.title,
      frequency: scheduledBill.frequency,
      totalAmount: scheduledBill.totalAmount,
      reason: 'No generation history - permanently deleted'
    }, id, 'ScheduledBill');

    return res.status(200).json({
      message: 'Scheduled bill deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete-scheduled-bill:', error);
    
    // Log the failure
    await logFailure('SCHEDULED_BILL_DELETE', req, error.message, {
      scheduledBillId: req.query?.id,
      societyId: req.query?.societyId,
      errorType: error.name
    });
    
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 