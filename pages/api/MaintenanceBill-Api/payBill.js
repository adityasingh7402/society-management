import MaintenanceBill from '../../../models/MaintenanceBill';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { billId, paymentDetails } = req.body;

    // Validate required fields
    if (!billId || !paymentDetails) {
      return res.status(400).json({ message: 'billId and paymentDetails are required' });
    }

    // Find the bill by ID
    const bill = await MaintenanceBill.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Update the bill status and payment details
    bill.status = 'Paid';
    bill.paidOn = new Date().toISOString().split('T')[0];
    bill.paymentDetails = paymentDetails;

    // Save the updated bill
    const updatedBill = await bill.save();

    res.status(200).json({ success: true, bill: updatedBill });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Failed to process payment', error: error.message });
  }
}