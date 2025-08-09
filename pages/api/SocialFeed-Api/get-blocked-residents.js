import Society from '../../../models/Society';
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

    // Only society can get blocked residents
    const society = await Society.findById(decoded.id)
      .populate('blockedResidents.residentId', 'name email phone userImage flatDetails')
      .populate('blockedResidents.blockedBy', 'societyName');

    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }

    // Format the blocked residents data for frontend
    const blockedResidents = society.blockedResidents.map(blocked => ({
      _id: blocked._id,
      residentId: blocked.residentId._id,
      residentName: blocked.residentId.name,
      residentEmail: blocked.residentId.email,
      residentImage: blocked.residentId.userImage,
      flatDetails: blocked.residentId.flatDetails,
      blockedAt: blocked.blockedAt,
      reason: blocked.reason,
      blockedBy: blocked.blockedBy?.societyName || 'System'
    }));

    res.status(200).json({
      success: true,
      blockedResidents,
      total: blockedResidents.length
    });

  } catch (error) {
    console.error('Error fetching blocked residents:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch blocked residents', 
      error: error.message 
    });
  }
}
