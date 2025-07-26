import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import BillHead from '../../../models/BillHead';
import UtilityBill from '../../../models/UtilityBill';
import MaintenanceBill from '../../../models/MaintenanceBill';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if MongoDB is connected, if not connect
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { billHeadId } = req.query;
    if (!billHeadId) {
      return res.status(400).json({ error: 'Bill head ID is required' });
    }

    // Check if bill head exists
    const billHead = await BillHead.findById(billHeadId);
    if (!billHead) {
      return res.status(404).json({ error: 'Bill head not found' });
    }

    // Check if there are any existing bills using this bill head
    const [utilityBillsCount, maintenanceBillsCount] = await Promise.all([
      UtilityBill.countDocuments({ billHeadId }),
      MaintenanceBill.countDocuments({ billHeadId })
    ]);

    if (utilityBillsCount > 0 || maintenanceBillsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete bill head as it is being used in existing bills' 
      });
    }

    // Completely delete the bill head
    await BillHead.findByIdAndDelete(billHeadId);

    res.status(200).json({ message: 'Bill head deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill head:', error);
    res.status(500).json({ error: error.message || 'Failed to delete bill head' });
  }
} 