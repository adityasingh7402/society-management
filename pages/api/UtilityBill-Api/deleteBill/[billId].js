import UtilityBill from '../../../../models/UtilityBill';
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
    await logFailure('UTILITY_BILL_DELETE', req, 'Bill ID is required');
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
      await logFailure('UTILITY_BILL_DELETE', req, 'No authorization token provided', { billId });
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      await logFailure('UTILITY_BILL_DELETE', req, 'Invalid authorization token', { billId });
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(billId)) {
      await logFailure('UTILITY_BILL_DELETE', req, 'Invalid bill ID', { billId });
      return res.status(400).json({ 
        success: false,
        message: 'Invalid bill ID' 
      });
    }
    
    // Find the bill first to get details for logging
    const bill = await UtilityBill.findById(billId);
    
    if (!bill) {
      await logFailure('UTILITY_BILL_DELETE', req, 'Bill not found', { billId });
      return res.status(404).json({ 
        success: false,
        message: 'Bill not found' 
      });
    }
    
    // Delete the bill
    await UtilityBill.findByIdAndDelete(billId);
    
    // Log successful deletion
    await logSuccess('UTILITY_BILL_DELETE', req, {
      billId: billId,
      billNumber: bill.billNumber,
      flatNumber: bill.flatNumber,
      blockName: bill.blockName,
      ownerName: bill.ownerName,
      unitUsage: bill.unitUsage,
      totalAmount: bill.totalAmount,
      status: bill.status
    }, billId, 'UtilityBill');
    
    res.status(200).json({ 
      success: true, 
      message: 'Utility bill deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting utility bill:', error);
    
    // Log the failure
    await logFailure('UTILITY_BILL_DELETE', req, error.message, {
      billId: req.query?.billId,
      errorType: error.name
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete utility bill', 
      error: error.message 
    });
  }
}
