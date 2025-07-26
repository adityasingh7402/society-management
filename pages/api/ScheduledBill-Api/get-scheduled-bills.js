import connectToDatabase from "../../../lib/mongodb";
import ScheduledBill from '../../../models/ScheduledBill';
import BillHead from '../../../models/BillHead';  // Import BillHead model
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const query = { societyId: req.query.societyId };
    console.log("query", query);

    // Add filters if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.frequency) {
      query.frequency = req.query.frequency;
    }
    if (req.query.billHeadId) {
      query.billHeadId = req.query.billHeadId;
    }

    // Fetch scheduled bills with populated bill head
    const scheduledBills = await ScheduledBill.find(query)
      .populate('billHeadId', 'name code category subCategory')
      .sort({ nextGenerationDate: 1 });
    console.log("scheduledBills", scheduledBills);

    // Calculate summary
    const summary = {
      total: scheduledBills.length,
      active: scheduledBills.filter(b => b.status === 'Active').length,
      paused: scheduledBills.filter(b => b.status === 'Paused').length,
      completed: scheduledBills.filter(b => b.status === 'Completed').length,
      cancelled: scheduledBills.filter(b => b.status === 'Cancelled').length,
      byFrequency: {},
      byCategory: {}
    };

    // Calculate frequency summary
    scheduledBills.forEach(bill => {
      // Frequency summary
      if (!summary.byFrequency[bill.frequency]) {
        summary.byFrequency[bill.frequency] = 0;
      }
      summary.byFrequency[bill.frequency]++;

      // Category summary
      const category = bill.billHeadId?.category || 'Unknown';
      if (!summary.byCategory[category]) {
        summary.byCategory[category] = 0;
      }
      summary.byCategory[category]++;
    });

    // Get upcoming bills (next 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingBills = scheduledBills.filter(bill => {
      const nextGen = new Date(bill.nextGenerationDate);
      return bill.status === 'Active' && nextGen >= now && nextGen <= sevenDaysFromNow;
    }).map(bill => ({
      _id: bill._id,
      title: bill.title,
      nextGenerationDate: bill.nextGenerationDate,
      billHead: bill.billHeadDetails
    }));

    return res.status(200).json({
      scheduledBills,
      summary,
      upcomingBills
    });

  } catch (error) {
    console.error('Error in get-scheduled-bills:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 