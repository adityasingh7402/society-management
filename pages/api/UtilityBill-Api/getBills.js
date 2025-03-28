import UtilityBill from '../../../models/UtilityBill';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Get all bills
    const bills = await UtilityBill.find().sort({ createdAt: -1 });

    // Update penalty amounts for overdue bills
    const updatedBills = await Promise.all(bills.map(async (bill) => {
      // Check if bill is overdue but not paid
      if (bill.status !== 'Paid' && new Date(bill.dueDate) < new Date()) {
        // Calculate penalty
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

    // Calculate summary
    const summary = updatedBills.reduce((acc, bill) => {
      acc.totalBills += 1;

      // Use baseAmount instead of totalAmount
      const baseAmount = Number(bill.baseAmount) || 0;
      acc.totalAmount += baseAmount;

      if (bill.status === 'Paid') {
        acc.totalPaidAmount += baseAmount;
      } else {
        // Use remainingAmount for due amount
        const remainingAmount = Number(bill.remainingAmount) || 0;
        acc.totalDueAmount += remainingAmount;
      }

      // Use penaltyAmount for total penalty
      const penaltyAmount = Number(bill.penaltyAmount) || 0;
      acc.totalPenalty += penaltyAmount;

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
      bills: updatedBills,
      summary,
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Failed to fetch bills', error: error.message });
  }
}