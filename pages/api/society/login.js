import connectToDatabase from '../../../lib/mongodb';
import Society from '../../../models/Society';
import jwt from 'jsonwebtoken';

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

    let userData = null;

    // Check if it's the manager's phone
    if (society.managerPhone === phoneNumber) {
      userData = {
        id: society._id,
        name: society.managerName,
        email: society.managerEmail,
        phone: society.managerPhone,
        role: 'manager',
        permissions: ['full_access'], // Manager has full access
        societyName: society.name,
        societyId: society.societyId,
        societyPin: society._id
      };
    } else {
      // Check if it's a member's phone
      const member = society.members.find(m => m.phone === phoneNumber);
      if (member) {
        if (member.status === 'inactive') {
          return res.status(403).json({
            success: false,
            message: 'Your account is inactive. Please contact the society manager.'
          });
        }
        userData = {
          id: member._id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role || 'member',
          permissions: member.permissions || [],
          societyName: society.name,
          societyId: society.societyId,
          societyPin: society._id
        };
      }
    }

    if (!userData) {
      return res.status(403).json({
        success: false,
        message: 'Phone number not associated with this society'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      userData,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: userData
    });

  } catch (error) {
    console.error('Error in society login:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
} 