import UtilityBill from '../../../models/UtilityBill';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Extract filter parameters from query
    const { 
      blockName, 
      floorNumber, 
      flatNumber, 
      utilityType, 
      status,
      startDate,
      endDate,
      residentId
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (blockName) filter.blockName = blockName;
    if (floorNumber) filter.floorNumber = parseInt(floorNumber);
    if (flatNumber) filter.flatNumber = flatNumber;
    if (utilityType) filter.utilityType = utilityType;
    if (status) filter.status = status;
    if (residentId) filter.residentId = residentId;
    
    // Date range filters
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }
    
    // Get filtered bills
    const bills = await UtilityBill.find(filter).sort({ createdAt: -1 });
    
    // Calculate summary for filtered bills
    const summary = bills.reduce((acc, bill) => {
      acc.totalBills += 1;
      acc.totalAmount += bill.totalAmount;
      
      if (bill.status === 'Paid') {
        acc.totalPaidAmount += bill.totalAmount;
      } else {
        acc.totalDueAmount += bill.remainingAmount;
      }
      
      acc.totalPenalty += bill.penaltyAmount;
      
      return acc;
    }, {
      totalBills: 0,
      totalAmount: 0,
      totalPaidAmount: 0,
      totalDueAmount: 0,
      totalPenalty: 0
    });
    
    res.status(200).json({ 
      success: true, 
      bills, 
      summary 
    });
  } catch (error) {
    console.error('Error filtering bills:', error);
    res.status(500).json({ message: 'Failed to filter bills', error: error.message });
  }
}