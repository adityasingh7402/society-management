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
      // Convert floorNumber to integer if it exists
      if (floorNumber) query.floorNumber = parseInt(floorNumber, 10);
      
      // Extract just the numeric part from flatNumber (e.g., "B-101" to "101")
      if (flatNumber) {
        // Use regex to match only numbers in the flatNumber
        const numericPart = flatNumber.match(/\d+/g);
        if (numericPart && numericPart.length > 0) {
          query.flatNumber = numericPart[0]; // Use the first matched number
        } else {
          query.flatNumber = flatNumber; // Fallback to original if no numbers found
        }
      }

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