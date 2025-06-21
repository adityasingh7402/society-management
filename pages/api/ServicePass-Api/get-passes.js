import connectToDatabase from "../../../lib/mongodb";
import ServicePass from "../../../models/ServicePass";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { residentId } = req.query;

    // Validate residentId
    if (!residentId) {
      return res.status(400).json({ message: 'Resident ID is required' });
    }

    // Get all service passes for the resident, sorted by creation date (newest first)
    const passes = await ServicePass.find({ residentId })
      .sort({ createdAt: -1 });

    res.status(200).json(passes);

  } catch (error) {
    console.error('Error fetching service passes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 