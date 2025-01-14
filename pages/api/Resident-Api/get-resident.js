import jwt from 'jsonwebtoken';
import connectToDatabase from '../../../lib/mongodb'; // Import the DB connection helper
import Resident from '../../../models/Resident'; // Import your Resident model

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'POST') {
    const { phoneNumber } = req.body;

    console.log(phoneNumber);
    console.log("number is phoneNumber", phoneNumber)
    try {
      // Fetch the resident by their phone number
      const resident = await Resident.findOne({ phone: phoneNumber });

      if (!resident) {
        return res.status(404).json({ success: false, message: 'Resident not found' });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: resident._id,
          name: resident.name,
          phone: resident.phone,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Optional: set token expiration
      );

      return res.status(200).json({
        success: true,
        resident,
        token,
      });
    } catch (error) {
      console.error('Error fetching resident details:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
