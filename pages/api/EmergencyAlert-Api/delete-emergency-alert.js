import connectToDatabase from '../../../lib/mongodb';
import EmergencyAlert from '../../../models/EmergencyAlert';
import { verifyToken } from '../../../utils/auth';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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
      await logFailure('DELETE_EMERGENCY_ALERT', req, 'Authentication failed - missing or invalid token', {
        hasAuthToken,
        errorType: 'AUTHENTICATION_ERROR'
      });
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      await logFailure('DELETE_EMERGENCY_ALERT', req, 'Authentication failed - invalid token', {
        hasAuthToken,
        errorType: 'INVALID_TOKEN'
      });
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Get alert ID from query parameters
    alertId = req.query.alertId;

    if (!alertId) {
      await logFailure('DELETE_EMERGENCY_ALERT', req, 'Alert ID is required', {
        hasAuthToken,
        errorType: 'MISSING_ALERT_ID'
      });
      return res.status(400).json({ success: false, message: 'Alert ID is required' });
    }

    // Check if alert exists
    const existingAlert = await EmergencyAlert.findById(alertId);
    
    if (!existingAlert) {
      await logFailure('DELETE_EMERGENCY_ALERT', req, 'Emergency alert not found', {
        alertId,
        hasAuthToken,
        errorType: 'ALERT_NOT_FOUND'
      });
      return res.status(404).json({ success: false, message: 'Emergency alert not found' });
    }

    // Prepare alert data for logging
    alertData = {
      alertId: existingAlert._id.toString(),
      title: existingAlert.title || '',
      alertType: existingAlert.alertType || '',
      category: existingAlert.category || '',
      priorityLevel: existingAlert.priorityLevel || '',
      societyId: existingAlert.societyId || '',
      status: existingAlert.status || '',
      hasAttachments: !!(existingAlert.attachments && existingAlert.attachments.length > 0),
      attachmentCount: existingAlert.attachments?.length || 0,
      targetAudience: existingAlert.targetAudience || '',
      createdBy: existingAlert.createdBy?.name || 'Unknown',
      createdAt: existingAlert.createdAt,
      hasAuthToken
    };

    // Check deletion type from query parameter
    const hardDelete = req.query.hardDelete === 'true';

    let deletedAlert;
    
    if (hardDelete) {
      // Permanently delete the alert
      deletedAlert = await EmergencyAlert.findByIdAndDelete(alertId);
      
      // Log successful hard deletion
      await logSuccess('DELETE_EMERGENCY_ALERT', req, {
        ...alertData,
        deletionType: 'HARD_DELETE',
        deletedBy: decoded.name || 'Unknown',
        deletedByRole: decoded.role || 'unknown',
        deletedById: decoded.id
      });

    } else {
      // Soft delete - mark as deleted
      deletedAlert = await EmergencyAlert.findByIdAndUpdate(
        alertId,
        { 
          status: 'deleted',
          deletedAt: new Date(),
          deletedBy: {
            userId: decoded.id,
            name: decoded.name || 'Unknown',
            role: decoded.role || 'user'
          }
        },
        { new: true }
      );

      // Log successful soft deletion
      await logSuccess('DELETE_EMERGENCY_ALERT', req, {
        ...alertData,
        deletionType: 'SOFT_DELETE',
        deletedBy: decoded.name || 'Unknown',
        deletedByRole: decoded.role || 'unknown',
        deletedById: decoded.id,
        newStatus: 'deleted'
      });
    }

    res.status(200).json({
      success: true,
      message: hardDelete 
        ? 'Emergency alert permanently deleted successfully'
        : 'Emergency alert deleted successfully',
      data: {
        alertId: alertId,
        deletionType: hardDelete ? 'permanent' : 'soft',
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error deleting emergency alert:', error);

    // Log failure with context
    await logFailure('DELETE_EMERGENCY_ALERT', req, 'Failed to delete emergency alert', {
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
