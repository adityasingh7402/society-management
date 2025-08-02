import connectToDatabase from '../../../lib/mongodb';
import Resident from '../../../models/Resident';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    const { societyId, phoneNumber, fcmToken } = req.body;

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
      return res.status(404).json({ 
        success: false, 
        message: 'No residents found in this society' 
      });
    }

    let userData = null;
    let updateQuery = {};
    let targetResident = null;

    // Check all residents in the society
    for (const resident of residents) {
      // Check if it's the main resident's phone
      if (resident.phone === phoneNumber) {
        userData = {
          id: resident._id,
          name: resident.name,
          email: resident.email,
          phone: resident.phone,
          role: 'resident',
          residentId: resident.residentId,
          societyName: resident.societyName,
          societyId: resident.societyId,
          flatDetails: resident.flatDetails,
          userType: 'main_resident'
        };

        targetResident = resident;
        // Update FCM token for main resident
        if (fcmToken) {
          updateQuery = {
            $addToSet: { fcmTokens: fcmToken },
            lastTokenUpdate: new Date()
          };
        }
        break;
      }

      // Check if it's a member's phone
      const memberIndex = resident.members.findIndex(m => m.phone === phoneNumber);
      
      if (memberIndex !== -1) {
        const member = resident.members[memberIndex];
        
        if (member.status === 'inactive') {
          return res.status(403).json({
            success: false,
            message: 'Your account is inactive. Please contact the resident.'
          });
        }

        userData = {
          id: member._id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role || 'member',
          residentId: resident._id,
          societyName: member.societyName || resident.societyName,
          societyId: member.societyId || resident.societyId,
          flatDetails: member.flatDetails || resident.flatDetails,
          userType: 'member'
        };

        targetResident = resident;
        // Update FCM token for member
        if (fcmToken) {
          updateQuery = {
            $addToSet: { [`members.${memberIndex}.fcmTokens`]: fcmToken },
            [`members.${memberIndex}.lastTokenUpdate`]: new Date()
          };
        }
        break;
      }
    }

    if (!userData) {
      return res.status(403).json({
        success: false,
        message: 'Phone number not associated with any resident in this society'
      });
    }

    // Update FCM token if provided
    if (fcmToken && Object.keys(updateQuery).length > 0 && targetResident) {
      await Resident.findByIdAndUpdate(targetResident._id, updateQuery);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: userData.id,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        residentId: userData.residentId,
        societyId: userData.societyId,
        userType: userData.userType
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        societyName: userData.societyName,
        societyId: userData.societyId,
        societyPin: targetResident ? targetResident.societyCode : userData.societyId,
        userType: userData.userType
      }
    });

  } catch (error) {
    console.error('Error in resident login:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
