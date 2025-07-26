import AmenityBill from '../../../../models/AmenityBill';
import connectToDatabase from '../../../../lib/mongodb';

export default async function handler(req, res) {
  const { billId } = req.query;
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  if (!billId) {
    return res.status(400).json({ message: 'Bill ID is required' });
  }

  try {
    await connectToDatabase();
    
    const bill = await AmenityBill.findById(billId);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    const { status } = req.body;
    
    if (status === 'Paid') {
      // If marking as paid, update payment date and paid amount
      bill.status = 'Paid';
      bill.paymentDate = new Date();
      bill.paidAmount = bill.totalAmount;
      bill.remainingAmount = 0;
    } else {
      bill.status = status;
    }
    
    await bill.save();
    
    res.status(200).json({ success: true, bill });
  } catch (error) {
    console.error('Error updating bill status:', error);
    res.status(500).json({ message: 'Failed to update bill status', error: error.message });
  }
} 