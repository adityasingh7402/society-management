import connectToDatabase from '../../../lib/mongodb';
import GatePass from '../../../models/GatePass';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { residentId, status, hasVehicle, startDate, endDate } = req.query;

    // Build query object
    const query = {};
    
    // Add filters if provided
    if (residentId) {
      query.residentId = residentId;
    }

    if (status) {
      query.status = status;
    }

    if (hasVehicle === 'true' || hasVehicle === 'false') {
      query.hasVehicle = hasVehicle === 'true';
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query['duration.startDate'] = {};
      if (startDate) {
        query['duration.startDate'].$gte = new Date(startDate);
      }
      if (endDate) {
        query['duration.startDate'].$lte = new Date(endDate);
      }
    }

    // Check for expired passes and update their status
    const now = new Date();
    await GatePass.updateMany(
      {
        'duration.endDate': { $lt: now },
        status: { $ne: 'Expired' }
      },
      { $set: { status: 'Expired' } }
    );

    // Fetch gate passes
    const gatePasses = await GatePass.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json(gatePasses);

  } catch (error) {
    console.error('Error fetching gate passes:', error);
    res.status(500).json({ message: 'Error fetching gate passes', error: error.message });
  }
} 