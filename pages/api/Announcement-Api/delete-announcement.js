import Announcement from '../../../models/Announcement';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import cloudinary from 'cloudinary';
import { logSuccess, logFailure } from '../../../services/loggingService';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    await connectDB();
    
    const { id } = req.query;
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      await logFailure('ANNOUNCEMENT_DELETE', req, 'No authorization token provided', { announcementId: id });
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      await logFailure('ANNOUNCEMENT_DELETE', req, 'Invalid authorization token', { announcementId: id });
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      await logFailure('ANNOUNCEMENT_DELETE', req, 'Invalid announcement ID', { announcementId: id });
      return res.status(400).json({ 
        success: false,
        message: 'Invalid announcement ID' 
      });
    }

    // Find the announcement first to get image URLs
    const announcement = await Announcement.findOne({
      _id: id,
      societyId: decoded.id
    });

    if (!announcement) {
      await logFailure('ANNOUNCEMENT_DELETE', req, 'Announcement not found or permission denied', { announcementId: id });
      return res.status(404).json({ 
        success: false,
        message: 'Announcement not found or you do not have permission to delete it' 
      });
    }

    // Delete images from Cloudinary if they exist
    if (announcement.image && announcement.image.length > 0) {
      try {
        const deletePromises = announcement.image.map(imageUrl => {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          return cloudinary.uploader.destroy(`society_announcements/${publicId}`);
        });
        await Promise.all(deletePromises);
      } catch (cloudinaryError) {
        console.error('Error deleting images from Cloudinary:', cloudinaryError);
        // Continue with announcement deletion even if image deletion fails
      }
    }

    // Delete the announcement
    await Announcement.findByIdAndDelete(id);

    // Log successful deletion
    await logSuccess('ANNOUNCEMENT_DELETE', req, {
      announcementId: id,
      title: announcement.title,
      hadImages: announcement.image && announcement.image.length > 0,
      imageCount: announcement.image ? announcement.image.length : 0
    }, id, 'Announcement');

    res.status(200).json({ 
      success: true, 
      message: 'Announcement and associated images deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    
    // Log the failure
    await logFailure('ANNOUNCEMENT_DELETE', req, error.message, {
      announcementId: req.query?.id,
      errorType: error.name
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete announcement', 
      error: error.message 
    });
  }
}