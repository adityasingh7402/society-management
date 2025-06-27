import connectToDatabase from '../../../../lib/mongodb';
import Resident from '../../../../models/Resident';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { residentId } = req.query;
  const updateData = req.body;

  try {
    await connectToDatabase();

    // Get the resident
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Update only allowed fields
    const allowedUpdates = {
      name: updateData.name,
      email: updateData.email,
      phone: updateData.phone,
      address: updateData.address
    };

    // Update resident
    const updatedResident = await Resident.findByIdAndUpdate(
      residentId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedResident);
  } catch (error) {
    console.error('Error updating resident:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 