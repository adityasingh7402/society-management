import connectToDatabase from '../../../lib/mongodb';
import Society from '../../../models/Society';
import Resident from '../../../models/Resident';
import SecurityGuard from '../../../models/Security';
import { logSuccess, logFailure } from '../../../services/loggingService';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify token and authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    await logFailure('UPDATE_SOCIETY_PROFILE', req, 'Unauthorized: Token missing');
    return res.status(401).json({ error: 'Unauthorized: Token missing' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    await logFailure('UPDATE_SOCIETY_PROFILE', req, 'Unauthorized: Invalid token');
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  try {
    // Token validation is optional - logging service will handle token parsing

    const {
      societyId,
      societyName,
      societyType,
      societyStructureType,
      customStructureTypeName,
      managerName,
      managerPhone,
      managerEmail,
      street,
      city,
      state,
      pinCode,
      description,
    } = req.body;

    if (!societyId) {
      await logFailure('UPDATE_SOCIETY_PROFILE', req, 'Society ID is required', {
        errorType: 'VALIDATION_ERROR'
      });
      return res.status(400).json({ error: 'Society ID is required.' });
    }

    // Find the society by ID and update its information
    const updatedSociety = await Society.findOneAndUpdate(
      { societyId }, // Find by societyId
      {
        societyName,
        societyType,
        societyStructureType,
        customStructureTypeName,
        managerName,
        managerPhone: managerPhone.startsWith('+91') ? managerPhone : `+91${managerPhone}`, // Add prefix only if not already present
        managerEmail,
        street,
        city,
        state,
        pinCode,
        description,
      },
      { new: true } // Return the updated document
    );

    if (!updatedSociety) {
      await logFailure('UPDATE_SOCIETY_PROFILE', req, 'Society not found', {
        societyId,
        errorType: 'SOCIETY_NOT_FOUND'
      });
      return res.status(404).json({ error: 'Society not found.' });
    }

    // Update all residents' addresses that belong to this society
    await Resident.updateMany(
      { societyId: updatedSociety._id },
      {
        $set: {
          societyName: societyName,
          'address.societyName': societyName,
          'address.street': street,
          'address.city': city,
          'address.state': state,
          'address.pinCode': pinCode
        }
      }
    );

    // Update society information in members array (only for residents who have members)
    await Resident.updateMany(
      { 
        societyId: updatedSociety._id,
        members: { $exists: true, $ne: [] }
      },
      {
        $set: {
          'members.$[].societyName': societyName,
          'members.$[].flatDetails.structureType': societyStructureType
        }
      }
    );

    // Update all security guards' addresses that belong to this society
    await SecurityGuard.updateMany(
      { societyId: updatedSociety._id },
      {
        $set: {
          societyName: societyName,
          'address.societyName': societyName,
          'address.street': street,
          'address.city': city,
          'address.state': state,
          'address.pinCode': pinCode
        }
      }
    );

    // Log successful society profile update
    await logSuccess('UPDATE_SOCIETY_PROFILE', req, {
      societyId: updatedSociety.societyId,
      societyName: updatedSociety.societyName,
      managerName: updatedSociety.managerName,
      managerPhone: updatedSociety.managerPhone,
      managerEmail: updatedSociety.managerEmail,
      city: updatedSociety.city,
      state: updatedSociety.state
    }, updatedSociety._id, 'society');

    return res.status(200).json({
      success: true,
      message: 'Society profile and all associated addresses updated successfully!',
      data: updatedSociety,
    });
  } catch (error) {
    console.error('Error updating society profile:', error);
    
    // Log the failure
    await logFailure('UPDATE_SOCIETY_PROFILE', req, error.message, {
      societyId: req.body?.societyId,
      errorType: error.name
    });
    
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}