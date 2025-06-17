import connectToDatabase from '../../../lib/mongodb';
import Resident from '../../../models/Resident';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const { societyId } = req.query;

      // If societyId is provided, filter residents by societyCode
      const query = societyId ? { societyCode: societyId } : {};

      const residents = await Resident.find(query).populate('societyId', 'societyName');
      const residentsData = residents.map(resident => ({
        ...resident.toObject(),
        _id: resident._id.toString(),
        societyId: resident.societyId ? resident.societyId._id.toString() : null,
        societyName: resident.societyId ? resident.societyId.societyName : 'No Society',
      }));
      res.status(200).json(residentsData);
    } catch (error) {
      console.error('Error fetching residents:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}