import UtilityBill from '../../../models/UtilityBill';
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
    const bills = await UtilityBill.find({ residentId })
      .populate('billHeadId', 'name category subCategory')
      .sort({ issueDate: -1 });
    
    // Update penalty amounts for overdue bills
    const updatedBills = await Promise.all(bills.map(async (bill) => {
      // Check if bill is overdue but not paid
      if (bill.status !== 'Paid' && new Date(bill.dueDate) < new Date()) {
        // Calculate penalty using the model's method
        const penalty = bill.calculatePenalty();
        
        // If penalty has changed, update the bill
        if (penalty !== bill.penaltyAmount) {
          bill.penaltyAmount = penalty;
          bill.status = 'Overdue';
          await bill.save();
        }
      }
      return bill;
    }));
    
    // Calculate summary data with updated values
    const totalAmount = updatedBills.reduce((sum, bill) => sum + (bill.baseAmount || 0), 0);
    const totalAdditionalCharges = updatedBills.reduce((sum, bill) => {
      return sum + (bill.additionalCharges?.reduce((chargeSum, charge) => chargeSum + (charge.amount || 0), 0) || 0);
    }, 0);
    const totalPaidAmount = updatedBills.reduce((sum, bill) => {
      return bill.status === 'Paid' ? sum + (bill.baseAmount || 0) : sum;
    }, 0);
    const totalDueAmount = updatedBills.reduce((sum, bill) => {
      if (bill.status === 'Paid') return sum;
      return sum + (bill.remainingAmount || 0);
    }, 0);
    const totalPenalty = updatedBills.reduce((sum, bill) => sum + (bill.penaltyAmount || 0), 0);
    
    const summary = {
      totalBills: updatedBills.length,
      totalAmount,
      totalAdditionalCharges,
      totalPaidAmount,
      totalDueAmount,
      totalPenalty
    };
    
    res.status(200).json({ success: true, bills: updatedBills, summary });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Failed to fetch bills', error: error.message });
  }
}