import MaintenanceBill from '../../../models/MaintenanceBill';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Verify token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      await logFailure('MAINTENANCE_BILL_UPDATE', req, 'No authorization token provided', { billId: req.query?.billId });
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      await logFailure('MAINTENANCE_BILL_UPDATE', req, 'Invalid authorization token', { billId: req.query?.billId });
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    const { billId } = req.query;
    const updateData = req.body;
    
    if (!billId) {
      await logFailure('MAINTENANCE_BILL_UPDATE', req, 'Bill ID is required');
      return res.status(400).json({ message: 'Bill ID is required' });
    }
    
    // Get original bill for logging
    const originalBill = await MaintenanceBill.findById(billId);
    if (!originalBill) {
      await logFailure('MAINTENANCE_BILL_UPDATE', req, 'Bill not found', { billId });
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Find and update the bill
    const updatedBill = await MaintenanceBill.findByIdAndUpdate(
      billId,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Log successful update
    await logSuccess('MAINTENANCE_BILL_UPDATE', req, {
      billId: updatedBill._id,
      billNumber: updatedBill.billNumber,
      flatNumber: updatedBill.flatNumber,
      blockName: updatedBill.blockName,
      updatedFields: Object.keys(updateData),
      originalStatus: originalBill.status,
      newStatus: updatedBill.status,
      originalAmount: originalBill.totalAmount,
      newAmount: updatedBill.totalAmount
    }, updatedBill._id, 'MaintenanceBill');
    
    res.status(200).json({ success: true, bill: updatedBill });
  } catch (error) {
    console.error('Error updating bill:', error);
    
    // Log the failure
    await logFailure('MAINTENANCE_BILL_UPDATE', req, error.message, {
      billId: req.query?.billId,
      updateFields: req.body ? Object.keys(req.body) : [],
      errorType: error.name
    });
    
    res.status(500).json({ message: 'Failed to update bill', error: error.message });
  }
}
