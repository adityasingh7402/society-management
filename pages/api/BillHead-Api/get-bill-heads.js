import connectToDatabase from "../../../lib/mongodb";
import BillHead from '../../../models/BillHead';
import Society from '../../../models/Society';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { societyId, status } = req.query;

    // Validate required fields
    if (!societyId) {
      return res.status(400).json({ message: 'Society ID is required' });
    }

    // First find the society with the given societyId (which is a string)
    const society = await Society.findOne({ societyId: societyId });
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }

    // Build query using society's _id
    const query = { societyId: society._id };
    if (status) {
      query.status = status;
    }

    // Fetch bill heads
    const billHeads = await BillHead.find(query).sort({ createdAt: -1 });

    // Calculate summary
    const summary = {
      total: billHeads.length,
      active: billHeads.filter(bh => bh.status === 'Active').length,
      inactive: billHeads.filter(bh => bh.status === 'Inactive').length,
      taxable: billHeads.filter(bh => bh.isTaxable).length
    };

    res.status(200).json({
      message: 'Bill heads fetched successfully',
      data: billHeads,
      summary
    });

  } catch (error) {
    console.error('Error fetching bill heads:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
} 