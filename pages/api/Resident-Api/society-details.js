import connectToDatabase from '../../../lib/mongodb';
import Society from '../../../models/Society';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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
    
    // Get the societyCode from request body
    const { societyCode } = req.body;
    
    if (!societyCode) {
      return res.status(400).json({ success: false, message: 'Society Code is required' });
    }
    
    // Find society by societyId matching the societyCode
    const society = await Society.findOne({ 
      societyId: societyCode 
    });

    if (!society) {
      return res.status(404).json({ 
        success: false, 
        message: 'Society not found' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      society: society 
    });
  } catch (error) {
    console.error('Error fetching society details:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
} 