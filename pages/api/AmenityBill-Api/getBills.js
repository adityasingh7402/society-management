import connectToDatabase from '../../../lib/mongodb';
import AmenityBill from '../../../models/AmenityBill';
import BillHead from '../../../models/BillHead';
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

    await connectToDatabase();

    const { 
      societyId, 
      status, 
      billHeadId, 
      fromDate, 
      toDate, 
      amenityType,
      membershipType 
    } = req.query;

    // Build query
    const query = {
      societyId: new mongoose.Types.ObjectId(societyId)
    };
    
    if (status) query.status = status;
    if (billHeadId) query.billHeadId = new mongoose.Types.ObjectId(billHeadId);
    if (amenityType) query.amenityType = amenityType;
    if (membershipType) query.membershipType = membershipType;
    if (fromDate && toDate) {
      query.issueDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    // Get bills with populated bill head details
    const bills = await AmenityBill.find(query)
      .populate('billHeadId', 'name code')
      .sort({ issueDate: -1 })
      .lean();

    // Calculate summary
    const summary = {
      totalBills: bills.length,
      totalAmount: bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0),
      totalPaid: bills.reduce((sum, bill) => sum + (bill.paidAmount || 0), 0),
      totalPending: bills.reduce((sum, bill) => sum + (bill.remainingAmount || 0), 0),
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
      },
      byAmenityType: Object.fromEntries(
        ['Gym', 'Swimming Pool', 'Club House', 'Sports', 'Park', 'Community Hall', 'Other']
          .map(type => [
            type,
            {
              count: bills.filter(bill => bill.amenityType === type).length,
              amount: bills.filter(bill => bill.amenityType === type)
                .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0)
            }
          ])
      ),
      byMembershipType: Object.fromEntries(
        ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'HalfYearly', 'Yearly']
          .map(type => [
            type,
            {
              count: bills.filter(bill => bill.membershipType === type).length,
              amount: bills.filter(bill => bill.membershipType === type)
                .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0)
            }
          ])
      )
    };

    return res.status(200).json({
      bills,
      summary,
      filters: {
        status: ['Paid', 'Pending', 'Partially Paid', 'Overdue'],
        amenityTypes: ['Gym', 'Swimming Pool', 'Club House', 'Sports', 'Park', 'Community Hall', 'Other'],
        membershipTypes: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'HalfYearly', 'Yearly'],
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