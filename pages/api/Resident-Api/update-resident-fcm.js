import connectToDatabase from '../../../lib/mongodb';
import Resident from '../../../models/Resident';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Token missing.' });
    }

    const { residentId, fcmToken } = req.body;

    if (!residentId || !fcmToken) {
      return res.status(400).json({ error: 'Resident ID and FCM token are required.' });
    }

    // Find the resident and update their FCM tokens array
    const updatedResident = await Resident.findOneAndUpdate(
      { residentId },
      { $pull: { fcmTokens: fcmToken } }, // Remove the specific token from the array
      { new: true }
    );

    if (!updatedResident) {
      return res.status(404).json({ error: 'Resident not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'FCM token removed successfully!',
      data: updatedResident,
    });
  } catch (error) {
    console.error('Error updating resident FCM token:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
} 