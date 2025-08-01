import connectToDatabase from '../../../lib/mongodb';
import UtilityBill from '../../../models/UtilityBill';
import BillHead from '../../../models/BillHead';
import JournalVoucher from '../../../models/JournalVoucher';
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
    // console.log('Token verified for user:', decoded);

    await connectToDatabase();
    // console.log('Connected to database');

    const {
      societyId,
      status,
      billHeadId,
      fromDate,
      toDate,
      subCategory,
      periodType
    } = req.query;
    // console.log('Received query params:', { societyId, status, billHeadId, fromDate, toDate });

    // Build query
    const query = { societyId };
    if (status) query.status = status;
    if (billHeadId) query.billHeadId = billHeadId;
    if (subCategory) query.subCategory = subCategory;
    if (periodType) query.periodType = periodType;

    // Add date range if provided
    if (fromDate || toDate) {
      query.issueDate = {};
      if (fromDate) query.issueDate.$gte = new Date(fromDate);
      if (toDate) query.issueDate.$lte = new Date(toDate);
    }

    // console.log('Query being executed:', JSON.stringify(query, null, 2));

    // Fetch bills with populated references
    const bills = await UtilityBill.find(query)
      .populate('billHeadId', 'name code category subCategory')
      .populate('residentId', 'name phone email')
      .populate('journalEntries.voucherId')
      .sort({ createdAt: -1 });

    // console.log("bills",bills);
    // console.log('Query results:', {
    //   billsFound: bills.length,
    //   sampleQueryBill: bills[0]
    // });

    // Calculate summary
    const summary = {
      totalBills: bills.length,
      totalAmount: 0,
      pendingAmount: 0,
      paidAmount: 0,
      overdueAmount: 0,
      totalGstCollected: 0,
      byPeriodType: {}
    };

    bills.forEach(bill => {
      summary.totalAmount += bill.totalAmount;
      summary.paidAmount += bill.paidAmount;
      summary.pendingAmount += bill.remainingAmount;

      // Calculate GST totals
      if (bill.gstDetails?.isGSTApplicable) {
        summary.totalGstCollected += (bill.gstDetails.cgstAmount || 0) +
                                   (bill.gstDetails.sgstAmount || 0) +
                                   (bill.gstDetails.igstAmount || 0);
      }

      // Calculate overdue amount
      if (bill.status === 'Overdue') {
        summary.overdueAmount += bill.remainingAmount;
      }

      // Group by period type
      if (!summary.byPeriodType[bill.periodType]) {
        summary.byPeriodType[bill.periodType] = {
          count: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0
        };
      }
      summary.byPeriodType[bill.periodType].count++;
      summary.byPeriodType[bill.periodType].totalAmount += bill.totalAmount;
      summary.byPeriodType[bill.periodType].paidAmount += bill.paidAmount;
      summary.byPeriodType[bill.periodType].pendingAmount += bill.remainingAmount;
    });

    // console.log('Calculated summary:', summary);

    return res.status(200).json({
      bills,
      summary
    });

  } catch (error) {
    console.error('Error in getBills:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}