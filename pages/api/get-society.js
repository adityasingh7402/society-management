import jwt from 'jsonwebtoken';
import connectToDatabase from '../../lib/mongodb'; // Import the DB connection helper
import Society from '../../models/Society'; // Import your Society model

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'POST') {
    const { phoneNumber } = req.body;

    console.log(phoneNumber)
    try {
      // Fetch the society by manager's phone number
      const society = await Society.findOne({ managerPhone: phoneNumber });

      if (!society) {
        return res.status(404).json({ success: false, message: 'Society not found' });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: society._id,
          societyId: society.societyId,
          phone: society.managerPhone,
        },
        process.env.JWT_SECRET
      );

      return res.status(200).json({
        success: true,
        society,
        token,
      });
    } catch (error) {
      console.error('Error fetching society details:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
