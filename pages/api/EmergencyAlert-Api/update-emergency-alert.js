import connectToDatabase from '../../../lib/mongodb';
import EmergencyAlert from '../../../models/EmergencyAlert';
import { verifyToken } from '../../../utils/auth';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let alertData = {};
  let hasAuthToken = false;
  let alertId = '';

  try {
    await connectToDatabase();

    // Check authentication
    const authHeader = req.headers.authorization;
    hasAuthToken = !!authHeader;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await logFailure('UPDATE_EMERGENCY_ALERT', req, 'Authentication failed - missing or invalid token', {
        hasAuthToken,
        errorType: 'AUTHENTICATION_ERROR'
      });
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      await logFailure('UPDATE_EMERGENCY_ALERT', req, 'Authentication failed - invalid token', {
        hasAuthToken,
        errorType: 'INVALID_TOKEN'
      });
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Get alert ID from query parameters
    alertId = req.query.alertId;

    if (!alertId) {
      await logFailure('UPDATE_EMERGENCY_ALERT', req, 'Alert ID is required', {
        hasAuthToken,
        errorType: 'MISSING_ALERT_ID'
      });
      return res.status(400).json({ success: false, message: 'Alert ID is required' });
    }

    const {
      title,
      description,
      alertType,
      category,
      priorityLevel,
      attachments,
      sendEmail,
      sendPush,
      sendSMS,
      targetAudience,
      status,
      updatedBy
    } = req.body;

    alertData = {
      alertId,
      title: title || '',
      description: description || '',
      alertType: alertType || '',
      category: category || '',
      priorityLevel: priorityLevel || '',
      hasAttachments: !!(attachments && attachments.length > 0),
      sendEmail: !!sendEmail,
      sendPush: !!sendPush,
      sendSMS: !!sendSMS,
      targetAudience: targetAudience || '',
      status: status || '',
      hasAuthToken
    };

    // Check if alert exists
    const existingAlert = await EmergencyAlert.findById(alertId);
    
    if (!existingAlert) {
      await logFailure('UPDATE_EMERGENCY_ALERT', req, 'Emergency alert not found', {
        ...alertData,
        errorType: 'ALERT_NOT_FOUND'
      });
      return res.status(404).json({ success: false, message: 'Emergency alert not found' });
    }

    // Validate required fields if provided
    const missingFields = [];
    if (title !== undefined && !title) missingFields.push('title');
    if (description !== undefined && !description) missingFields.push('description');
    if (alertType !== undefined && !alertType) missingFields.push('alertType');
    if (category !== undefined && !category) missingFields.push('category');
    if (priorityLevel !== undefined && !priorityLevel) missingFields.push('priorityLevel');

    if (missingFields.length > 0) {
      await logFailure('UPDATE_EMERGENCY_ALERT', req, 'Validation failed - empty required fields', {
        ...alertData,
        missingFields,
        errorType: 'VALIDATION_ERROR'
      });

      return res.status(400).json({
        success: false,
        message: `Required fields cannot be empty: ${missingFields.join(', ')}`
      });
    }

    // Check for duplicate title if title is being updated
    if (title && title !== existingAlert.title) {
      const duplicateAlert = await EmergencyAlert.findOne({
        title,
        societyId: existingAlert.societyId,
        _id: { $ne: alertId },
        status: { $ne: 'deleted' }
      });

      if (duplicateAlert) {
        await logFailure('UPDATE_EMERGENCY_ALERT', req, 'Emergency alert with this title already exists', {
          ...alertData,
          existingTitle: existingAlert.title,
          duplicateAlertId: duplicateAlert._id.toString(),
          errorType: 'DUPLICATE_ALERT'
        });

        return res.status(400).json({
          success: false,
          message: 'An emergency alert with this title already exists'
        });
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (alertType !== undefined) updateData.alertType = alertType;
    if (category !== undefined) updateData.category = category;
    if (priorityLevel !== undefined) updateData.priorityLevel = priorityLevel;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
    if (status !== undefined) updateData.status = status;

    if (sendEmail !== undefined || sendPush !== undefined || sendSMS !== undefined) {
      updateData.notificationSettings = {
        ...existingAlert.notificationSettings,
        ...(sendEmail !== undefined && { sendEmail }),
        ...(sendPush !== undefined && { sendPush }),
        ...(sendSMS !== undefined && { sendSMS })
      };
    }

    if (updatedBy !== undefined) {
      updateData.updatedBy = updatedBy;
    } else {
      updateData.updatedBy = {
        userId: decoded.id,
        name: decoded.name || 'Unknown',
        role: decoded.role || 'user'
      };
    }

    // Update the alert
    const updatedAlert = await EmergencyAlert.findByIdAndUpdate(
      alertId,
      updateData,
      { new: true, runValidators: true }
    );

    // Log successful update
    await logSuccess('UPDATE_EMERGENCY_ALERT', req, {
      alertId: updatedAlert._id.toString(),
      title: updatedAlert.title,
      alertType: updatedAlert.alertType,
      category: updatedAlert.category,
      priorityLevel: updatedAlert.priorityLevel,
      societyId: updatedAlert.societyId,
      updatedBy: updatedAlert.updatedBy?.name || 'Unknown',
      updatedByRole: updatedAlert.updatedBy?.role || 'unknown',
      attachmentCount: updatedAlert.attachments?.length || 0,
      notificationMethods: {
        email: updatedAlert.notificationSettings?.sendEmail || false,
        push: updatedAlert.notificationSettings?.sendPush || false,
        sms: updatedAlert.notificationSettings?.sendSMS || false
      },
      targetAudience: updatedAlert.targetAudience,
      status: updatedAlert.status,
      previousTitle: existingAlert.title,
      previousPriorityLevel: existingAlert.priorityLevel,
      previousStatus: existingAlert.status,
      hasAuthToken
    });

    res.status(200).json({
      success: true,
      message: 'Emergency alert updated successfully',
      data: updatedAlert
    });

  } catch (error) {
    console.error('Error updating emergency alert:', error);

    // Log failure with context
    await logFailure('UPDATE_EMERGENCY_ALERT', req, 'Failed to update emergency alert', {
      ...alertData,
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
