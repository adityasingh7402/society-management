import connectToDatabase from "../../../lib/mongodb";
import ScheduledBill from '../../../models/ScheduledBill';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Verify authentication token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.societyId) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    await connectToDatabase();

    // Create scheduled bill
    const scheduledBill = new ScheduledBill({
      ...req.body,
      societyId: decoded.societyId,
      createdBy: decoded.userId
    });

    // Validate and save
    await scheduledBill.validate();
    await scheduledBill.save();

    res.status(201).json({
      message: 'Scheduled bill created successfully',
      scheduledBill
    });

  } catch (error) {
    console.error('Error creating scheduled bill:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
} 