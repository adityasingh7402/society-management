import Announcement from '../../../models/Announcement';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import cloudinary from 'cloudinary';

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
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }

    const { id } = req.query;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
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

    res.status(200).json({ 
      success: true, 
      message: 'Announcement and associated images deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete announcement', 
      error: error.message 
    });
  }
}