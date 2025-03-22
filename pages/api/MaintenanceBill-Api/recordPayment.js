import MaintenanceBill from '../../../models/MaintenanceBill';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { 
      billId, 
      amount, 
      paymentMethod, 
      transactionId 
    } = req.body;
    
    // Find the bill
    const bill = await MaintenanceBill.findById(billId);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Create payment record
    const paymentRecord = {
      amount,
      paymentDate: new Date(),
      paymentMethod,
      transactionId
    };
    
    // Update bill with payment
    bill.paymentHistory.push(paymentRecord);
    bill.amountPaid += amount;
    
    // Calculate remaining amount
    const totalCharges = bill.amount + 
      bill.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0) + 
      bill.penaltyAmount + 
      bill.currentPenalty;
    
    bill.remainingAmount = totalCharges - bill.amountPaid;
    
    // Update status
    if (bill.remainingAmount <= 0) {
      bill.status = 'Paid';
    } else if (bill.amountPaid > 0) {
      bill.status = 'Partially Paid';
    }
    
    await bill.save();
    
    res.status(200).json({ success: true, bill });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Failed to record payment', error: error.message });
  }
}