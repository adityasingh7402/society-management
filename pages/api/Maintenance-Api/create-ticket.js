import connectDB from '../../../lib/mongodb';
import MaintenanceTicket from '../../../models/MaintenanceTicket';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let ticketData = {};
  let hasAuthToken = false;

  try {
    await connectDB();

    const authHeader = req.headers.authorization;
    hasAuthToken = !!authHeader;

    const { title, description, category, priority, images, flatNumber, societyId, residentId } = req.body;

    ticketData = {
      title: title || '',
      category: category || '',
      priority: priority || 'Medium',
      flatNumber: flatNumber || '',
      societyId: societyId || '',
      residentId: residentId || '',
      hasImages: !!(images && images.length > 0),
      imageCount: images?.length || 0,
      hasAuthToken
    };

    if (!title || !description || !category || !flatNumber || !societyId) {
      const missingFields = [];
      if (!title) missingFields.push('title');
      if (!description) missingFields.push('description');
      if (!category) missingFields.push('category');
      if (!flatNumber) missingFields.push('flatNumber');
      if (!societyId) missingFields.push('societyId');

      await logFailure('CREATE_MAINTENANCE_TICKET', req, 'Validation failed - missing required fields', {
        ...ticketData,
        missingFields,
        errorType: 'VALIDATION_ERROR'
      });

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

    // Log successful creation
    await logSuccess('CREATE_MAINTENANCE_TICKET', req, {
      ticketId: newTicket._id.toString(),
      title: newTicket.title,
      category: newTicket.category,
      priority: newTicket.priority,
      status: 'Pending',
      flatNumber: newTicket.flatNumber,
      societyId: newTicket.societyId,
      residentId: newTicket.residentId,
      imageCount: newTicket.images?.length || 0,
      hasImages: !!(newTicket.images && newTicket.images.length > 0),
      hasAuthToken
    });

    return res.status(201).json({
      success: true,
      message: 'Maintenance ticket created successfully',
      data: newTicket
    });
  } catch (error) {
    console.error('Error creating maintenance ticket:', error);
    
    // Log failure with context
    await logFailure('CREATE_MAINTENANCE_TICKET', req, 'Failed to create maintenance ticket', {
      ...ticketData,
      errorMessage: error.message,
      errorType: error.name || 'UNKNOWN_ERROR'
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to create maintenance ticket',
      error: error.message
    });
  }
}
