import connectToDatabase from '../../../../lib/mongodb';
import Resident from '../../../../models/Resident';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const { residentId, action } = req.query;

    await connectToDatabase();

    try {
      // Update the resident's status
      const resident = await Resident.findByIdAndUpdate(
        residentId,
        { societyVerification: action },
        { new: true }
      );

      if (!resident) {
        return res.status(404).json({ message: 'Resident not found' });
      }

      res.status(200).json({ message: `Resident ${action} successfully!` });
    } catch (error) {
      console.error('Error updating resident status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}