import UtilityBill from '../../../../models/UtilityBill';
import connectDB from '../../../../lib/mongodb';

export default async function handler(req, res) {
  const { billId } = req.query;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  if (!billId) {
    return res.status(400).json({ message: 'Bill ID is required' });
  }

  try {
    await connectDB();
    
    const bill = await UtilityBill.findById(billId);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Check if bill is overdue and update penalty if needed
    if (bill.status !== 'Paid' && new Date(bill.dueDate) < new Date()) {
      const penalty = bill.calculatePenalty();
      
      if (penalty !== bill.penaltyAmount) {
        bill.penaltyAmount = penalty;
        bill.status = 'Overdue';
        await bill.save();
      }
    }
    
    res.status(200).json({ success: true, bill });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ message: 'Failed to fetch bill', error: error.message });
  }
}