import AmenityBill from '../../../models/AmenityBill';
import BillHead from '../../../models/BillHead';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Extract resident ID from query parameters
    const { residentId } = req.query;
    
    if (!residentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'residentId is required' 
      });
    }
    
    // Find all bills by residentId and populate BillHead data
    const bills = await AmenityBill.find({ residentId })
      .populate('billHeadId', 'name category subCategory')
      .sort({ issueDate: -1 });
    
    // Calculate summary data
    const totalAmount = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    const totalAdditionalCharges = bills.reduce((sum, bill) => {
      return sum + (bill.additionalCharges?.reduce((chargeSum, charge) => chargeSum + (charge.amount || 0), 0) || 0);
    }, 0);
    const totalPaidAmount = bills.reduce((sum, bill) => sum + (bill.paidAmount || 0), 0);
    const totalDueAmount = bills.reduce((sum, bill) => {
      if (bill.status === 'Paid') return sum;
      return sum + (bill.remainingAmount || bill.totalAmount - (bill.paidAmount || 0));
    }, 0);
    const totalPenalty = bills.reduce((sum, bill) => sum + (bill.penaltyAmount || 0), 0);
    
    const summary = {
      totalBills: bills.length,
      totalAmount,
      totalAdditionalCharges,
      totalPaidAmount,
      totalDueAmount,
      totalPenalty
    };
    
    res.status(200).json({ success: true, bills, summary });
  } catch (error) {
    console.error('Error fetching amenity bills:', error);
    res.status(500).json({ message: 'Failed to fetch amenity bills', error: error.message });
  }
}
