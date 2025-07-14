import connectToDatabase from '../../../lib/mongodb';
import Resident from '../../../models/Resident';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Verify token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    await connectToDatabase();
    
    // Get the societyId from query params
    const { societyId } = req.query;
    
    if (!societyId) {
      return res.status(400).json({ success: false, message: 'Society ID is required' });
    }
    
    // Find all residents in the same society
    const residents = await Resident.find({ 
      societyCode: societyId
    })
    
    return res.status(200).json({ 
      success: true, 
      residents: residents 
    });
  } catch (error) {
    console.error('Error fetching society residents:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}