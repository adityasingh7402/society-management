import MaintenanceBill from '../../../../models/MaintenanceBill';
import connectDB from '../../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { logSuccess, logFailure } from '../../../../services/loggingService';

export default async function handler(req, res) {
  const { billId } = req.query;
  
  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }
  
  if (!billId) {
    await logFailure('MAINTENANCE_BILL_DELETE', req, 'Bill ID is required');
    return res.status(400).json({ 
      success: false,
      message: 'Bill ID is required' 
    });
  }

  try {
    await connectDB();
    
    // Verify token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      await logFailure('MAINTENANCE_BILL_DELETE', req, 'No authorization token provided', { billId });
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      await logFailure('MAINTENANCE_BILL_DELETE', req, 'Invalid authorization token', { billId });
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(billId)) {
      await logFailure('MAINTENANCE_BILL_DELETE', req, 'Invalid bill ID', { billId });
      return res.status(400).json({ 
        success: false,
        message: 'Invalid bill ID' 
      });
    }
    
    // Find the bill first to get details for logging
    const bill = await MaintenanceBill.findById(billId);
    
    if (!bill) {
      await logFailure('MAINTENANCE_BILL_DELETE', req, 'Bill not found', { billId });
      return res.status(404).json({ 
        success: false,
        message: 'Bill not found' 
      });
    }
    
    // Delete the bill
    await MaintenanceBill.findByIdAndDelete(billId);
    
    // Log successful deletion
    await logSuccess('MAINTENANCE_BILL_DELETE', req, {
      billId: billId,
      billNumber: bill.billNumber,
      flatNumber: bill.flatNumber,
      blockName: bill.blockName,
      ownerName: bill.ownerName,
      totalAmount: bill.totalAmount,
      status: bill.status
    }, billId, 'MaintenanceBill');
    
    res.status(200).json({ 
      success: true, 
      message: 'Maintenance bill deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting maintenance bill:', error);
    
    // Log the failure
    await logFailure('MAINTENANCE_BILL_DELETE', req, error.message, {
      billId: req.query?.billId,
      errorType: error.name
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete maintenance bill', 
      error: error.message 
    });
  }
}
