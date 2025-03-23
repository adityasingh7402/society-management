import connectToDatabase from '../../../lib/mongodb';
import Visitor from '../../../models/Visitor';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { societyId, blockName, floorNumber, flatNumber } = req.query;

    if (!societyId) {
      return res.status(400).json({ error: 'Society ID is required' });
    }

    try {
      await connectToDatabase();

      const query = { societyId };
      if (blockName) query.blockName = blockName;
      if (floorNumber) query.floorNumber = floorNumber;
      if (flatNumber) query.flatNumber = flatNumber;

      const visitors = await Visitor.find(query).sort({ entryTime: -1 });

      res.status(200).json({ success: 'Visitors fetched successfully', data: visitors });
    } catch (error) {
      console.error('Error fetching visitors:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}