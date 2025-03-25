import Announcement from '../../../models/Announcement';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Verify the token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
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
    res.status(201).json({ success: true, announcement: newAnnouncement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Failed to create announcement', error: error.message });
  }
}