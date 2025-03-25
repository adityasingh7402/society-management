import connectDB from '../../../lib/mongodb';
import MaintenanceTicket from '../../../models/MaintenanceTicket';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { title, description, category, priority, images, flatNumber, societyId, residentId } = req.body;
    console.log(req.body.images[0]);

    if (!title || !description || !category || !flatNumber || !societyId) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const newTicket = new MaintenanceTicket({
      title,
      description,
      category,
      priority: priority || 'Medium',
      images: images || [],
      residentId: residentId,
      societyId,
      flatNumber,
      statusHistory: [{
        status: 'Pending',
        changedBy: residentId
      }]
    });

    await newTicket.save();

    return res.status(201).json({
      success: true,
      message: 'Maintenance ticket created successfully',
      data: newTicket
    });
  } catch (error) {
    console.error('Error creating maintenance ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create maintenance ticket',
      error: error.message
    });
  }
}