import connectToDatabase from '../../lib/mongodb';
import Society from '../../models/Society';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    const { pinCode } = req.query;

    if (!pinCode || pinCode.length !== 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid 6-digit PIN code is required' 
      });
    }

    // Find societies by PIN code
    const societies = await Society.find(
      { pinCode },
      {
        _id: 1,
        societyName: 1,
        street: 1,
        pinCode: 1,
        city: 1,
        state: 1
      }
    );

    return res.status(200).json({
      success: true,
      societies
    });

  } catch (error) {
    console.error('Error fetching societies:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
