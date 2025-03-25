import connectDB from '../../../lib/mongodb';
import MaintenanceTicket from '../../../models/MaintenanceTicket';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { residentId } = req.query;
    await connectDB();
    const tickets = await MaintenanceTicket.find({ residentId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: tickets
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
}