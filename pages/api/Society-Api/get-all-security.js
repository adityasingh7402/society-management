import connectToDatabase from '../../../lib/mongodb';
import Security from '../../../models/Security';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'GET') {
    const { societyId } = req.query;

    if (!societyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Society ID is required' 
      });
    }

    try {
      // Fetch security guards by societyId
      const securityGuards = await Security.find({ societyId: societyId });

      if (!securityGuards || securityGuards.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'No security guards found for this society' 
        });
      }

      return res.status(200).json({
        success: true,
        securityGuards,
        count: securityGuards.length
      });
    } catch (error) {
      console.error('Error fetching security guards by society:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  } else {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }
}