import connectToDatabase from '../../../lib/mongodb'; // Import the DB connection helper
import Resident from '../../../models/Resident'; // Import your Resident model

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
      residentId, // Required to identify the resident
      name,
      phone,
      email,
      address,
      unitNumber,
    } = req.body;

    if (!residentId) {
      return res.status(400).json({ error: 'Resident ID is required.' });
    }

    // Find the resident by ID and update their editable fields
    const updatedResident = await Resident.findOneAndUpdate(
      { residentId }, // Find by residentId
      {
        ...(name && { name }), // Only update if the value exists
        ...(phone && { phone: phone.startsWith('+91') ? phone : `+91${phone}` }), // Ensure proper phone format
        ...(email && { email }),
        ...(address && { address }),
        ...(unitNumber && { unitNumber }),
      },
      { new: true } // Return the updated document
    );

    if (!updatedResident) {
      return res.status(404).json({ error: 'Resident not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Resident profile updated successfully!',
      data: updatedResident,
    });
  } catch (error) {
    console.error('Error updating resident profile:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
