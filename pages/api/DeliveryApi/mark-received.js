import connectToDatabase from '../../../lib/mongodb';
import Delivery from '../../../models/Delivery';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { deliveryId } = req.body;

    if (!deliveryId) {
      return res.status(400).json({ success: false, error: 'Delivery ID is required' });
    }

    await connectToDatabase();

    // Find and update the delivery
    const delivery = await Delivery.findByIdAndUpdate(
      deliveryId,
      {
        status: 'Collected',
        collectedTime: new Date()
      },
      { new: true }
    );

    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery marked as received successfully',
      data: delivery
    });

  } catch (error) {
    console.error('Error marking delivery as received:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
