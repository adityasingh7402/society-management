import jwt from 'jsonwebtoken';
import connectToDatabase from '../../../lib/mongodb'; // Import the DB connection helper
import Security from '../../../models/Security'; // Import your Security model

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'POST') {
    const { phoneNumber } = req.body;

    console.log(phoneNumber);
    console.log("number is phoneNumber", phoneNumber);

    try {
      // Fetch the security guard by their phone number
      const securityGuard = await Security.findOne({ guardPhone: phoneNumber });

      if (!securityGuard) {
        return res.status(404).json({ success: false, message: 'Security guard not found' });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: securityGuard._id,
          guardName: securityGuard.guardName,
          guardPhone: securityGuard.guardPhone,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Optional: set token expiration
      );

      return res.status(200).json({
        success: true,
        securityGuard, // Return security guard details
        token,
      });
    } catch (error) {
      console.error('Error fetching security guard details:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
