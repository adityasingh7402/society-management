import jwt from 'jsonwebtoken';
import connectToDatabase from '../../../lib/mongodb'; // Import the DB connection helper
import Tenant from '../../../models/Tenant'; // Import your Tenant model

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'POST') {
    const { phoneNumber } = req.body;

    console.log(phoneNumber);
    console.log("number is phoneNumber", phoneNumber);

    try {
      // Fetch the tenant by their phone number
      const tenant = await Tenant.findOne({ phone: phoneNumber });

      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: tenant._id,
          name: tenant.name,
          phone: tenant.phone,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Optional: set token expiration
      );

      return res.status(200).json({
        success: true,
        tenant, // Return tenant details
        token,
      });
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
