import Announcement from '../../../models/Announcement';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Verify the token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      await logFailure('ANNOUNCEMENT_CREATE', req, 'No authorization token provided');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      await logFailure('ANNOUNCEMENT_CREATE', req, 'Invalid authorization token');
      return res.status(401).json({ message: 'Invalid token' });
    }

    const {
      title,
      description,
      image,
      date,
      time
    } = req.body;

    // Ensure image is always an array
    const imageArray = Array.isArray(image) ? image : image ? [image] : [];

    const newAnnouncement = new Announcement({
      title,
      description,
      image: imageArray, // Pass the processed image array
      date,
      time,
      societyId: decoded.id
    });

    await newAnnouncement.save();
    
    // Log successful creation
    await logSuccess('ANNOUNCEMENT_CREATE', req, {
      announcementId: newAnnouncement._id,
      title: newAnnouncement.title,
      hasImages: newAnnouncement.image && newAnnouncement.image.length > 0,
      imageCount: newAnnouncement.image ? newAnnouncement.image.length : 0,
      date: newAnnouncement.date,
      time: newAnnouncement.time
    }, newAnnouncement._id, 'Announcement');
    
    res.status(201).json({ success: true, announcement: newAnnouncement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    
    // Log the failure
    await logFailure('ANNOUNCEMENT_CREATE', req, error.message, {
      title: req.body?.title,
      errorType: error.name
    });
    
    res.status(500).json({ message: 'Failed to create announcement', error: error.message });
  }
}