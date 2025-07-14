import connectToDatabase from '../../../lib/mongodb';
import Society from '../../../models/Society';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    const { societyId, phoneNumber } = req.body;

    if (!societyId || !phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Society ID and phone number are required' 
      });
    }

    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(404).json({ 
        success: false, 
        message: 'Society not found' 
      });
    }

    // Check if it's the manager's phone
    if (society.managerPhone === phoneNumber) {
      return res.status(200).json({
        success: true,
        message: 'Phone number verified as society manager'
      });
    }

    // Check if it's a member's phone
    const member = society.members.find(m => m.phone === phoneNumber);
    if (member) {
      if (member.status === 'inactive') {
        return res.status(403).json({
          success: false,
          message: 'Your account is inactive. Please contact the society manager.'
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Phone number verified as society member'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Phone number not associated with this society'
    });

  } catch (error) {
    console.error('Error in verify-phone:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
} 