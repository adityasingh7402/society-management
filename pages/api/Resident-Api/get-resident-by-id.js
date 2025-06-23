import connectToDatabase from '../../../lib/mongodb';
import Resident from '../../../models/Resident';

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

    await connectToDatabase();
    
    // Get the residentId from query params
    const { residentId } = req.query;
    
    if (!residentId) {
      return res.status(400).json({ success: false, message: 'Resident ID is required' });
    }

    // Validate that residentId is a valid ObjectId
    if (!residentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid Resident ID format' });
    }
    
    // Find resident by ID
    const resident = await Resident.findById(residentId).select('_id name userImage');
    
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }
    
    return res.status(200).json({ 
      success: true, 
      resident: resident 
    });
  } catch (error) {
    console.error('Error fetching resident details:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
} 