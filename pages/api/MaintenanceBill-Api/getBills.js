import connectToDatabase from '../../../lib/mongodb';
import MaintenanceBill from '../../../models/MaintenanceBill';
import { verifyToken } from '../../../utils/auth';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify token
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    console.log('Token verified for user:', decoded);

    await connectToDatabase();
    console.log('Connected to database');

    const { societyId, status, billHeadId, fromDate, toDate } = req.query;
    console.log('Received query params:', { societyId, status, billHeadId, fromDate, toDate });

    // Build query with both string and ObjectId possibilities for societyId
    const query = {
      $or: [
        { societyId: societyId }, // Try as string
        { societyId: new mongoose.Types.ObjectId(societyId) } // Try as ObjectId
      ]
    };
    
    if (status) query.status = status;
    if (billHeadId) query.billHeadId = billHeadId;
    if (fromDate && toDate) {
      query.issueDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    console.log('Query being executed:', JSON.stringify(query, null, 2));

    // Get all bills first to check collection
    const allBills = await MaintenanceBill.find({}).lean();
    console.log('Database check:', {
      totalBillsFound: allBills.length,
      uniqueSocietyIds: [...new Set(allBills.map(bill => bill.societyId))],
      sampleBill: allBills[0]
    });

    // Get bills with the query
    const bills = await MaintenanceBill.find(query)
      .sort({ issueDate: -1 })
      .lean();

    console.log('Query results:', {
      billsFound: bills.length,
      sampleQueryBill: bills[0]
    });

    // Calculate summary
    const summary = {
      totalBills: bills.length,
      totalAmount: bills.reduce((sum, bill) => sum + (bill.amount || 0), 0),
      totalPaid: bills.filter(bill => bill.status === 'Paid')
        .reduce((sum, bill) => sum + (bill.amount || 0), 0),
      totalPending: bills.filter(bill => bill.status === 'Pending')
        .reduce((sum, bill) => sum + (bill.amount || 0), 0),
      totalOverdue: bills.filter(bill => bill.status === 'Overdue')
        .reduce((sum, bill) => sum + (bill.amount || 0), 0),
      totalGstCollected: bills.reduce((sum, bill) => sum + (bill.gstAmount || 0), 0),
      byBillHead: {},
      byStatus: {
        Paid: bills.filter(bill => bill.status === 'Paid').length,
        Pending: bills.filter(bill => bill.status === 'Pending').length,
        Overdue: bills.filter(bill => bill.status === 'Overdue').length
      }
    };

    console.log('Calculated summary:', summary);

    return res.status(200).json({
      bills,
      summary,
      filters: {
        status: ['Paid', 'Pending', 'Overdue'],
        billHeads: [...new Set(bills.map(bill => bill.billHeadId))]
      }
    });

  } catch (error) {
    console.error('Error in getBills:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}