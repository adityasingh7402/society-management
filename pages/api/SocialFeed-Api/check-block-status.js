import Society from '../../../models/Society';
import Resident from '../../../models/Resident';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const userType = req.headers['x-user-type']; // Should be 'resident'

    if (userType !== 'resident') {
      return res.status(400).json({ message: 'This endpoint is for residents only' });
    }

    // Check if resident exists and is approved
    const resident = await Resident.findById(decoded.id);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    if (resident.societyVerification !== 'Approved') {
      return res.status(200).json({
        success: true,
        isBlocked: true,
        reason: 'not_approved',
        message: 'Only approved residents can post in community board'
      });
    }

    // Check if resident is blocked from posting
    const society = await Society.findById(resident.societyId);
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }

    const blockedResident = society.blockedResidents?.find(
      blocked => blocked.residentId.toString() === resident._id.toString()
    );

    const isBlocked = !!blockedResident;

    const response = {
      success: true,
      isBlocked,
      reason: isBlocked ? 'blocked_by_society' : null,
      message: isBlocked 
        ? 'You are blocked from posting. Please contact your society manager.' 
        : 'You can post in the community board'
    };

    if (isBlocked) {
      response.blockInfo = {
        blockedAt: blockedResident.blockedAt,
        blockedBy: blockedResident.blockedBy,
        reason: blockedResident.reason || 'Community guidelines violation'
      };
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Error checking block status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check block status', 
      error: error.message 
    });
  }
}
