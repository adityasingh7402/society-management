import MaintenanceBill from '../../../models/MaintenanceBill';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Query parameters for filtering
    const { societyId, blockName, floorNumber, flatNumber, flatId, status } = req.query;
    
    // Build filter object
    const filter = {};
    if (societyId) filter.societyId = societyId;
    if (blockName) filter.blockName = blockName;
    if (floorNumber) filter.floorNumber = floorNumber;
    if (flatNumber) filter.flatNumber = flatNumber;
    if (flatId) filter.flatId = flatId;
    if (status) filter.status = status;
    
    const bills = await MaintenanceBill.find(filter).sort({ issueDate: -1 });
    
    // Calculate summary data
    const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const totalAdditionalCharges = bills.reduce((sum, bill) => {
      return sum + bill.additionalCharges.reduce((chargeSum, charge) => chargeSum + charge.amount, 0);
    }, 0);
    const totalPaidAmount = bills.reduce((sum, bill) => sum + bill.amountPaid, 0);
    const totalDueAmount = bills.reduce((sum, bill) => {
      const extraCharges = bill.additionalCharges.reduce((chargeSum, charge) => chargeSum + charge.amount, 0);
      return sum + (bill.amount + extraCharges + bill.penaltyAmount + bill.currentPenalty - bill.amountPaid);
    }, 0);
    const totalPenalty = bills.reduce((sum, bill) => sum + bill.currentPenalty, 0);
    
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
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Failed to fetch bills', error: error.message });
  }
}