import connectToDatabase from '../../../lib/mongodb';
import MaintenanceBill from '../../../models/MaintenanceBill';
import { verifyToken } from '../../../utils/auth';

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

    await connectToDatabase();

    const { societyId, status, billHeadId, fromDate, toDate } = req.query;

    // Build query
    const query = { societyId };
    if (status) query.status = status;
    if (billHeadId) query.billHeadId = billHeadId;
    if (fromDate && toDate) {
      query.issueDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    // Get bills with populated bill head details
    const bills = await MaintenanceBill.find(query)
      .sort({ issueDate: -1 });

    // Calculate summary
    const summary = {
      totalBills: bills.length,
      totalAmount: bills.reduce((sum, bill) => sum + bill.totalAmount, 0),
      totalPaid: bills.filter(bill => bill.status === 'Paid').reduce((sum, bill) => sum + bill.totalAmount, 0),
      totalPending: bills.filter(bill => bill.status === 'Pending').reduce((sum, bill) => sum + bill.totalAmount, 0),
      totalOverdue: bills.filter(bill => bill.status === 'Overdue').reduce((sum, bill) => sum + bill.totalAmount, 0),
      totalGstCollected: bills.reduce((sum, bill) => sum + (bill.gstDetails?.totalGst || 0), 0),
      byBillHead: {},
      byStatus: {
        Paid: bills.filter(bill => bill.status === 'Paid').length,
        Pending: bills.filter(bill => bill.status === 'Pending').length,
        Overdue: bills.filter(bill => bill.status === 'Overdue').length
      }
    };

    // Group by bill head
    bills.forEach(bill => {
      const headName = bill.billHeadDetails?.name || 'Other';
      if (!summary.byBillHead[headName]) {
        summary.byBillHead[headName] = {
          count: 0,
          amount: 0,
          gst: 0
        };
      }
      summary.byBillHead[headName].count++;
      summary.byBillHead[headName].amount += bill.baseAmount;
      summary.byBillHead[headName].gst += bill.gstDetails?.totalGst || 0;
    });

    res.status(200).json({
      bills,
      summary,
      filters: {
        fromDate,
        toDate,
        status,
        billHeadId
      }
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Error fetching bills', error: error.message });
  }
}