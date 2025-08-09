import Announcement from '../../../models/Announcement';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Verify the resident token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get the societyId from query params (passed by the frontend)
    const { societyId } = req.query;
    if (!societyId) {
      return res.status(400).json({ message: 'Society ID is required' });
    }

    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Announcement.countDocuments({ societyId });

    // Get announcements with pagination, sorted by newest first
    const announcements = await Announcement.find({ societyId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      announcements,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch announcements', 
      error: error.message 
    });
  }
}
