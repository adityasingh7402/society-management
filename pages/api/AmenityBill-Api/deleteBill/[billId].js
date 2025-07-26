import AmenityBill from '../../../../models/AmenityBill';
import connectToDatabase from '../../../../lib/mongodb';

export default async function handler(req, res) {
  const { billId } = req.query;
  
  if (req.method !== 'DELETE') {
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
    
    await AmenityBill.findByIdAndDelete(billId);
    
    res.status(200).json({ success: true, message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ message: 'Failed to delete bill', error: error.message });
  }
} 