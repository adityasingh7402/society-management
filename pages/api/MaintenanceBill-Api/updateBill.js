import MaintenanceBill from '../../../models/MaintenanceBill';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { billId } = req.query;
    const updateData = req.body;
    
    // Find and update the bill
    const updatedBill = await MaintenanceBill.findByIdAndUpdate(
      billId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedBill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    res.status(200).json({ success: true, bill: updatedBill });
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ message: 'Failed to update bill', error: error.message });
  }
}