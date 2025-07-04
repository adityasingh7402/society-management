import connectToDatabase from "../../../lib/mongodb";
import ScheduledBill from '../../../models/ScheduledBill';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
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

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: 'Scheduled bill ID is required' });
    }

    // Find existing scheduled bill
    const existingBill = await ScheduledBill.findOne({
      _id: id,
      societyId: decoded.societyId
    });

    if (!existingBill) {
      return res.status(404).json({ message: 'Scheduled bill not found' });
    }

    // Update fields
    const updateData = {
      ...req.body,
      modifiedBy: decoded.userId,
      modifiedAt: new Date()
    };

    // Remove fields that shouldn't be updated
    delete updateData.societyId;
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData._id;

    // Special handling for status changes
    if (updateData.status && updateData.status !== existingBill.status) {
      switch (updateData.status) {
        case 'Paused':
          // Store the current next generation date to resume from later
          updateData.lastGeneratedDate = existingBill.nextGenerationDate;
          updateData.nextGenerationDate = null;
          break;
        case 'Active':
          if (existingBill.status === 'Paused') {
            // Resume from the stored next generation date
            updateData.nextGenerationDate = existingBill.lastGeneratedDate;
          }
          break;
        case 'Cancelled':
          updateData.nextGenerationDate = null;
          break;
      }
    }

    // Update the scheduled bill
    const updatedBill = await ScheduledBill.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    ).populate('billHeadId', 'name code');

    res.status(200).json({
      message: 'Scheduled bill updated successfully',
      scheduledBill: updatedBill
    });

  } catch (error) {
    console.error('Error updating scheduled bill:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
} 