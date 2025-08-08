import connectToDatabase from '../../../lib/mongodb';
import EmergencyAlert from '../../../models/EmergencyAlert';
import { verifyToken } from '../../../utils/auth';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let emergencyAlertData = {};
  let hasAuthToken = false;

  try {
    await connectToDatabase();

    // Check authentication
    const authHeader = req.headers.authorization;
    hasAuthToken = !!authHeader;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await logFailure('CREATE_EMERGENCY_ALERT', req, 'Authentication failed - missing or invalid token', {
        hasAuthToken,
        errorType: 'AUTHENTICATION_ERROR'
      });
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      await logFailure('CREATE_EMERGENCY_ALERT', req, 'Authentication failed - invalid token', {
        hasAuthToken,
        errorType: 'INVALID_TOKEN'
      });
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const {
      title,
      description,
      alertType,
      category,
      priorityLevel,
      societyId,
      createdBy,
      attachments,
      sendEmail,
      sendPush,
      sendSMS,
      targetAudience
    } = req.body;

    emergencyAlertData = {
      title: title || '',
      description: description || '',
      alertType: alertType || '',
      category: category || '',
      priorityLevel: priorityLevel || '',
      societyId: societyId || '',
      hasAttachments: !!(attachments && attachments.length > 0),
      sendEmail: !!sendEmail,
      sendPush: !!sendPush,
      sendSMS: !!sendSMS,
      targetAudience: targetAudience || '',
      hasAuthToken
    };

    // Validate required fields
    if (!title || !description || !alertType || !category || !priorityLevel || !societyId) {
      const missingFields = [];
      if (!title) missingFields.push('title');
      if (!description) missingFields.push('description');
      if (!alertType) missingFields.push('alertType');
      if (!category) missingFields.push('category');
      if (!priorityLevel) missingFields.push('priorityLevel');
      if (!societyId) missingFields.push('societyId');

      await logFailure('CREATE_EMERGENCY_ALERT', req, 'Validation failed - missing required fields', {
        ...emergencyAlertData,
        missingFields,
        errorType: 'VALIDATION_ERROR'
      });

      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check for duplicate title in the same society
    const existingAlert = await EmergencyAlert.findOne({
      title,
      societyId,
      status: { $ne: 'deleted' }
    });

    if (existingAlert) {
      await logFailure('CREATE_EMERGENCY_ALERT', req, 'Emergency alert with this title already exists', {
        ...emergencyAlertData,
        existingAlertId: existingAlert._id.toString(),
        errorType: 'DUPLICATE_ALERT'
      });

      return res.status(400).json({
        success: false,
        message: 'An emergency alert with this title already exists'
      });
    }

    // Create new emergency alert
    const newAlert = new EmergencyAlert({
      title,
      description,
      alertType,
      category,
      priorityLevel,
      societyId,
      createdBy: createdBy || {
        userId: decoded.id,
        name: decoded.name || 'Unknown',
        role: decoded.role || 'user'
      },
      attachments: attachments || [],
      notificationSettings: {
        sendEmail: sendEmail || false,
        sendPush: sendPush || false,
        sendSMS: sendSMS || false
      },
      targetAudience: targetAudience || 'all',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedAlert = await newAlert.save();

    // Log successful creation
    await logSuccess('CREATE_EMERGENCY_ALERT', req, {
      alertId: savedAlert._id.toString(),
      title: savedAlert.title,
      alertType: savedAlert.alertType,
      category: savedAlert.category,
      priorityLevel: savedAlert.priorityLevel,
      societyId: savedAlert.societyId,
      createdBy: savedAlert.createdBy?.name || 'Unknown',
      createdByRole: savedAlert.createdBy?.role || 'unknown',
      attachmentCount: savedAlert.attachments?.length || 0,
      notificationMethods: {
        email: savedAlert.notificationSettings?.sendEmail || false,
        push: savedAlert.notificationSettings?.sendPush || false,
        sms: savedAlert.notificationSettings?.sendSMS || false
      },
      targetAudience: savedAlert.targetAudience,
      status: savedAlert.status,
      hasAuthToken
    });

    res.status(201).json({
      success: true,
      message: 'Emergency alert created successfully',
      data: savedAlert
    });

  } catch (error) {
    console.error('Error creating emergency alert:', error);

    // Log failure with context
    await logFailure('CREATE_EMERGENCY_ALERT', req, 'Failed to create emergency alert', {
      ...emergencyAlertData,
      errorMessage: error.message,
      errorType: error.name || 'UNKNOWN_ERROR',
      hasAuthToken
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
