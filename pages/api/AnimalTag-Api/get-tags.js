import connectToDatabase from "../../../lib/mongodb";
import AnimalTag from "../../../models/AnimalTag";
import Society from "../../../models/Society";
import Resident from "../../../models/Resident";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { societyId, status, residentId } = req.query;
    const query = {};

    // Add filters to query
    if (societyId) query.societyId = societyId;
    if (status) query.status = status;
    if (residentId) query.residentId = residentId;

    const animalTags = await AnimalTag.find(query)
      .populate({
        path: 'residentId',
        model: Resident,
        select: 'name phone flatDetails'
      })
      .populate({
        path: 'societyId',
        model: Society,
        select: 'societyName'
      })
      .sort({ createdAt: -1 });

    res.status(200).json(animalTags);

  } catch (error) {
    console.error('Error fetching animal tags:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 