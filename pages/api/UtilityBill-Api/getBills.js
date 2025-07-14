import connectToDatabase from '../../../lib/mongodb';
import UtilityBill from '../../../models/UtilityBill';
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

    // Build query
    const query = {
      societyId: new mongoose.Types.ObjectId(societyId)
    };
    
    if (status) query.status = status;
    if (billHeadId) query.billHeadId = new mongoose.Types.ObjectId(billHeadId);
    if (fromDate && toDate) {
      query.issueDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    console.log('Query being executed:', JSON.stringify(query, null, 2));

    // Get bills with populated bill head details
    const bills = await UtilityBill.find(query)
      .populate('billHeadId', 'name code')
      .sort({ issueDate: -1 })
      .lean();

    console.log("bills",bills);
    console.log('Query results:', {
      billsFound: bills.length,
      sampleQueryBill: bills[0]
    });

    // Calculate summary
    const summary = {
      totalBills: bills.length,
      totalAmount: bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0),
      totalPaid: bills.filter(bill => bill.status === 'Paid')
        .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0),
      totalPending: bills.filter(bill => bill.status === 'Pending')
        .reduce((sum, bill) => sum + (bill.remainingAmount || 0), 0),
      totalOverdue: bills.filter(bill => bill.status === 'Overdue')
        .reduce((sum, bill) => sum + (bill.remainingAmount || 0), 0),
      totalGstCollected: bills.reduce((sum, bill) => {
        if (!bill.gstDetails?.isGSTApplicable) return sum;
        return sum + (
          (bill.gstDetails.cgstAmount || 0) +
          (bill.gstDetails.sgstAmount || 0) +
          (bill.gstDetails.igstAmount || 0)
        );
      }, 0),
      byStatus: {
        Paid: bills.filter(bill => bill.status === 'Paid').length,
        Pending: bills.filter(bill => bill.status === 'Pending').length,
        'Partially Paid': bills.filter(bill => bill.status === 'Partially Paid').length,
        Overdue: bills.filter(bill => bill.status === 'Overdue').length
      }
    };

    console.log('Calculated summary:', summary);

    return res.status(200).json({
      bills,
      summary,
      filters: {
        status: ['Paid', 'Pending', 'Partially Paid', 'Overdue'],
        billHeads: [...new Set(bills.map(bill => ({
          id: bill.billHeadId._id,
          name: bill.billHeadId.name,
          code: bill.billHeadId.code
        })))]
      }
    });

  } catch (error) {
    console.error('Error in getBills:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}