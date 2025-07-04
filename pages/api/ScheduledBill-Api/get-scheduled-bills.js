import connectToDatabase from "../../../lib/mongodb";
import ScheduledBill from '../../../models/ScheduledBill';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Verify authentication token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.societyId) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    await connectToDatabase();

    // Build query
    const { status, frequency, billHeadId } = req.query;
    const query = { societyId: decoded.societyId };

    if (status) query.status = status;
    if (frequency) query.frequency = frequency;
    if (billHeadId) query.billHeadId = billHeadId;

    // Fetch scheduled bills
    const scheduledBills = await ScheduledBill.find(query)
      .populate('billHeadId', 'name code')
      .sort({ nextGenerationDate: 1, createdAt: -1 });

    // Calculate summary
    const summary = {
      total: scheduledBills.length,
      active: scheduledBills.filter(bill => bill.status === 'Active').length,
      paused: scheduledBills.filter(bill => bill.status === 'Paused').length,
      completed: scheduledBills.filter(bill => bill.status === 'Completed').length,
      cancelled: scheduledBills.filter(bill => bill.status === 'Cancelled').length,
      byFrequency: {},
      byCalculationType: {}
    };

    // Group by frequency and calculation type
    scheduledBills.forEach(bill => {
      if (!summary.byFrequency[bill.frequency]) {
        summary.byFrequency[bill.frequency] = 0;
      }
      summary.byFrequency[bill.frequency]++;

      if (!summary.byCalculationType[bill.calculationType]) {
        summary.byCalculationType[bill.calculationType] = 0;
      }
      summary.byCalculationType[bill.calculationType]++;
    });

    // Get upcoming bills
    const upcomingBills = scheduledBills
      .filter(bill => bill.status === 'Active' && bill.nextGenerationDate)
      .sort((a, b) => a.nextGenerationDate - b.nextGenerationDate)
      .slice(0, 5);

    res.status(200).json({
      message: 'Scheduled bills fetched successfully',
      scheduledBills,
      summary,
      upcomingBills
    });

  } catch (error) {
    console.error('Error fetching scheduled bills:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 