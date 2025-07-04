import connectToDatabase from "../../../lib/mongodb";
import BillHead from '../../../models/BillHead';

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

    // Build query
    const query = { societyId };
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
    res.status(500).json({ message: 'Internal server error' });
  }
} 