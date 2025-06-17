import connectToDatabase from '../../../lib/mongodb';
import Society from '../../../models/Society';
import Resident from '../../../models/Resident';
import SecurityGuard from '../../../models/Security';

export default async function handler(req, res) {
  await connectToDatabase(); // Ensure the database connection is established

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Token missing.' });
    }

    // Assume you have token verification logic here
    // const user = verifyToken(token); // Replace with your token verification logic
    // if (!user) {
    //   return res.status(403).json({ error: 'Forbidden: Invalid token.' });
    // }

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

    return res.status(200).json({
      success: true,
      message: 'Society profile and all associated addresses updated successfully!',
      data: updatedSociety,
    });
  } catch (error) {
    console.error('Error updating society profile:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}