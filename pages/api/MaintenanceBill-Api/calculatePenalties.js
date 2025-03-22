import MaintenanceBill from '../../../models/MaintenanceBill';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Find all bills that are overdue
    const today = new Date();
    const overdueBills = await MaintenanceBill.find({
      dueDate: { $lt: today },
      status: { $in: ['Pending', 'Partially Paid'] }
    });
    
    const updatedBills = [];
    
    // Update each bill's penalty
    for (const bill of overdueBills) {
      const dueDate = new Date(bill.dueDate);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      
      // Calculate penalty based on days overdue and fine per day
      const newPenalty = daysOverdue * bill.finePerDay;
      
      // Only update if penalty has changed
      if (newPenalty > bill.currentPenalty) {
        bill.currentPenalty = newPenalty;
        bill.status = 'Overdue';
        await bill.save();
        updatedBills.push(bill);
      }
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Updated penalties for ${updatedBills.length} bills`,
      updatedBills 
    });
  } catch (error) {
    console.error('Error calculating penalties:', error);
    res.status(500).json({ message: 'Failed to calculate penalties', error: error.message });
  }
}