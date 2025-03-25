import Announcement from '../../../models/Announcement';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
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

    const { id } = req.query;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid announcement ID' });
    }

    const {
      title,
      description,
      image,
      date,
      time
    } = req.body;

    // Validate required fields
    if (!title || !description || !date || !time) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Ensure image is always an array
    const imageArray = Array.isArray(image) ? image : image ? [image] : [];

    // Find and update the announcement
    const announcement = await Announcement.findOneAndUpdate(
      {
        _id: id,
        societyId: decoded.id // Ensure society can only update their own announcements
      },
      {
        title,
        description,
        image: imageArray,
        date,
        time,
        updatedAt: Date.now()
      },
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!announcement) {
      return res.status(404).json({ 
        success: false,
        message: 'Announcement not found or you do not have permission to update it' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Announcement updated successfully',
      announcement 
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update announcement', 
      error: error.message 
    });
  }
}