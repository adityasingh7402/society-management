import connectToDatabase from '../../../lib/mongodb';
import Resident from '../../../models/Resident';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    const { societyId, phoneNumber } = req.body;

    console.log(societyId, phoneNumber)
    if (!societyId || !phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Society ID and phone number are required' 
      });
    }

    // Find all residents in the specified society
    const residents = await Resident.find({ 
      societyId: societyId
    });

    if (!residents || residents.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No residents found in this society'
      });
    }

    // Check all residents in the society
    for (const resident of residents) {
      // Check if it's the main resident's phone
      if (resident.phone === phoneNumber) {
        return res.status(200).json({
          success: true,
          message: 'Phone number verified for main resident',
          userType: 'main_resident'
        });
      }

      // Check if it's a member's phone in this resident's members array
      const member = resident.members.find(m => m.phone === phoneNumber);
      if (member) {
        if (member.status === 'inactive') {
          return res.status(403).json({
            success: false,
            message: 'Member account is inactive. Please contact the resident.'
          });
        }

        return res.status(200).json({
          success: true,
          message: `Phone number verified for ${member.role}`,
          userType: 'member',
          memberRole: member.role
        });
      }
    }

    // Phone number not found in any resident or member
    return res.status(403).json({
      success: false,
      message: 'Phone number is not associated with any resident or member in this society'
    });

  } catch (error) {
    console.error('Error in verify-phone:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
