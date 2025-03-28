import MaintenanceBill from '../../../models/MaintenanceBill';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const bills = await MaintenanceBill.find().sort({ issueDate: -1 });
    
    // Calculate and update penalties in database
    const updatedBills = await Promise.all(bills.map(async bill => {
      const plainBill = bill.toObject();
      
      // Skip penalty calculation for paid bills
      if (plainBill.status === 'Paid') {
        return plainBill;
      }
      
      // Calculate days overdue
      const today = new Date();
      const dueDate = new Date(plainBill.dueDate);
      
      if (today > dueDate) {
        const diffTime = Math.abs(today - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const currentPenalty = diffDays * (plainBill.finePerDay || 50);
        
        // Update bill in database with new penalty and status
        await MaintenanceBill.findByIdAndUpdate(bill._id, {
          penaltyAmount: currentPenalty,
          status: 'Overdue'
        });

        plainBill.penaltyAmount = currentPenalty;
        plainBill.status = 'Overdue';
      }
      
      return plainBill;
    }));

    // Calculate summary with updated penalties
    const summary = {
      totalBills: bills.length,
      totalAmount: updatedBills.reduce((sum, bill) => sum + bill.amount + 
        (bill.additionalCharges?.reduce((acc, charge) => acc + charge.amount, 0) || 0), 0),
      totalPaidAmount: updatedBills.filter(bill => bill.status === 'Paid')
        .reduce((sum, bill) => sum + bill.amount + 
          (bill.additionalCharges?.reduce((acc, charge) => acc + charge.amount, 0) || 0), 0),
      totalDueAmount: updatedBills.filter(bill => bill.status !== 'Paid')
        .reduce((sum, bill) => sum + bill.amount + 
          (bill.additionalCharges?.reduce((acc, charge) => acc + charge.amount, 0) || 0) +
          (bill.penaltyAmount || 0), 0),
      totalPenalty: updatedBills.reduce((sum, bill) => sum + (bill.penaltyAmount || 0), 0)
    };

    res.status(200).json({ bills: updatedBills, summary });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Failed to fetch bills', error: error.message });
  }
}