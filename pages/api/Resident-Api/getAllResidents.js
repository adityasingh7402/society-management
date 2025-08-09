import connectDB from '../../../lib/mongodb';
import Resident from '../../../models/Resident';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    try {
      // Verify JWT token for Society
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }

      // Get residents for the society
      const residents = await Resident.find({ societyId: decoded.id }).populate('societyId', 'societyName');
      
      const residentsData = residents.map(resident => ({
        ...resident.toObject(),
        _id: resident._id.toString(),
        societyId: resident.societyId ? resident.societyId._id.toString() : null,
        societyName: resident.societyId ? resident.societyId.societyName : 'No Society',
      }));
      
      res.status(200).json({
        success: true,
        residents: residentsData,
        total: residentsData.length
      });
    } catch (error) {
      console.error('Error fetching residents:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}
