import Announcement from '../../../models/Announcement';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { id } = req.query;
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      await logFailure('ANNOUNCEMENT_UPDATE', req, 'No authorization token provided', { announcementId: id });
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      await logFailure('ANNOUNCEMENT_UPDATE', req, 'Invalid authorization token', { announcementId: id });
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      await logFailure('ANNOUNCEMENT_UPDATE', req, 'Invalid announcement ID', { announcementId: id });
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
      await logFailure('ANNOUNCEMENT_UPDATE', req, 'Missing required fields', { announcementId: id });
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
      await logFailure('ANNOUNCEMENT_UPDATE', req, 'Announcement not found or permission denied', { announcementId: id });
      return res.status(404).json({ 
        success: false,
        message: 'Announcement not found or you do not have permission to update it' 
      });
    }

    // Log successful update
    await logSuccess('ANNOUNCEMENT_UPDATE', req, {
      announcementId: announcement._id,
      title: announcement.title,
      hasImages: announcement.image && announcement.image.length > 0,
      imageCount: announcement.image ? announcement.image.length : 0,
      date: announcement.date,
      time: announcement.time
    }, announcement._id, 'Announcement');
    
    res.status(200).json({ 
      success: true, 
      message: 'Announcement updated successfully',
      announcement 
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    
    // Log the failure
    await logFailure('ANNOUNCEMENT_UPDATE', req, error.message, {
      announcementId: req.query?.id,
      title: req.body?.title,
      errorType: error.name
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to update announcement', 
      error: error.message 
    });
  }
}