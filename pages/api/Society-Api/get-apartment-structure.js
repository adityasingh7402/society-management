import connectToDatabase from '../../../lib/mongodb'; // Import the DB connection helper
import Society from '../../../models/Society'; // Import your Society model

export default async function handler(req, res) {
  await connectToDatabase(); // Ensure the database connection is established

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { societyId } = req.query;

    if (!societyId) {
      return res.status(400).json({ error: 'Society ID is required.' });
    }

    // Find the society by ID
    console.log(societyId)
    const society = await Society.findOne({ societyId });

    if (!society) {
      return res.status(404).json({ error: 'Society not found.' });
    }

    // If apartmentStructure does not exist, return an empty array
    const apartmentStructure = society.apartmentStructure || [];

    return res.status(200).json({
      success: true,
      data: apartmentStructure,
    });
  } catch (error) {
    console.error('Error fetching apartment structure:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}