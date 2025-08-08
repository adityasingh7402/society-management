import connectToDatabase from '../lib/mongodb';
import ActivityLog from '../models/ActivityLog';
import jwt from 'jsonwebtoken';

/**
 * Main logging function to record user actions
 * @param {Object} params - Logging parameters
 * @param {string} params.actionType - Type of action being performed
 * @param {string} params.status - Status of the action (success, failed, attempted)
 * @param {Object} params.req - Express request object (optional)
 * @param {string} params.userId - User ID (if req not provided)
 * @param {string} params.userType - Type of user (if req not provided)
 * @param {Object} params.details - Additional details about the action
 * @param {string} params.errorMessage - Error message (for failed actions)
 * @param {string} params.targetResource - ID of the affected resource
 * @param {string} params.targetResourceType - Type of the affected resource
 * @param {Object} params.requestData - Sanitized request data
 * @param {Object} params.responseData - Sanitized response data
 * @param {number} params.duration - Request duration in milliseconds
 */
export async function logAction({
  actionType,
  status,
  req = null,
  userId = null,
  userType = null,
  userName = null,
  userRole = null,
  details = {},
  errorMessage = null,
  errorCode = null,
  stackTrace = null,
  societyId = null,
  targetResource = null,
  targetResourceType = null,
  requestData = null,
  responseData = null,
  duration = null
}) {
  try {
    await connectToDatabase();

    let logData = {
      actionType,
      status,
      details,
      errorMessage,
      errorCode,
      stackTrace,
      societyId,
      targetResource,
      targetResourceType,
      requestData: sanitizeData(requestData),
      responseData: sanitizeData(responseData),
      duration,
      timestamp: new Date()
    };

    // Extract user information from request or use provided values
    if (req) {
      // Extract from token if available
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // More flexible user ID extraction
          logData.userId = decoded.phone || decoded.id || decoded.managerPhone || decoded.guardPhone || 'unknown';
          logData.userName = decoded.name || decoded.managerName || decoded.guardName || null;
          logData.userRole = decoded.role || null;
          
          // Extract societyId from token or provided parameter
          logData.societyId = societyId || decoded.societyPin || decoded.societyId || decoded.id || null;
          
          // Determine user type based on token content and endpoint
          if (req.url?.includes('/Society-Api/')) {
            if (decoded.role === 'manager' || decoded.managerPhone) {
              logData.userType = 'society_manager';
            } else if (decoded.role && decoded.role !== 'manager') {
              logData.userType = 'society_member';
            } else {
              logData.userType = 'society_user';
            }
          } else if (req.url?.includes('/Resident-Api/')) {
            logData.userType = 'resident';
          } else if (req.url?.includes('/Security-Api/')) {
            logData.userType = 'security';
          } else if (req.url?.includes('/Tenant-Api/')) {
            logData.userType = 'tenant';
          } else {
            // Try to determine from token content
            if (decoded.societyId || decoded.societyPin) {
              logData.userType = 'society_user';
            } else if (decoded.phone && !decoded.role) {
              logData.userType = 'resident';
            } else {
              logData.userType = 'system';
            }
          }
        } catch (tokenError) {
          // If token is invalid, log as anonymous attempt
          console.log(`Token verification failed for ${actionType}: ${tokenError.message}`);
          logData.userId = 'invalid_token';
          logData.userType = 'anonymous';
          // Don't override existing error messages
          if (!logData.errorMessage) {
            logData.errorMessage = `Token error: ${tokenError.message}`;
          }
        }
      } else {
        console.log(`No token found for ${actionType} on ${req.url}`);
        logData.userId = 'no_token';
        logData.userType = 'anonymous';
      }

      // Extract request metadata
      logData.ipAddress = getClientIP(req);
      logData.userAgent = req.headers['user-agent'];
      logData.endpoint = req.url;
      logData.httpMethod = req.method;
    } else {
      // Use provided values
      logData.userId = userId || 'system';
      logData.userType = userType || 'system';
      logData.userName = userName;
      logData.userRole = userRole;
    }

    // Create and save the log entry
    const activityLog = new ActivityLog(logData);
    await activityLog.save();

    console.log(`Action logged: ${actionType} - ${status} by ${logData.userId}`);
    return activityLog;

  } catch (error) {
    console.error('Error logging action:', error);
    // Don't throw error to avoid breaking the main application flow
    return null;
  }
}

/**
 * Direct logging function that bypasses token verification to avoid conflicts
 */
export async function logActionDirect({
  actionType,
  status,
  userId,
  userName,
  userRole,
  userType,
  societyId,
  details = {},
  endpoint,
  httpMethod,
  ipAddress,
  userAgent,
  errorMessage = null,
  errorCode = null,
  stackTrace = null,
  targetResource = null,
  targetResourceType = null,
  requestData = null,
  responseData = null,
  duration = null
}) {
  try {
    await connectToDatabase();

    const logData = {
      actionType,
      status,
      userId,
      userName,
      userRole,
      userType,
      societyId,
      details,
      endpoint,
      httpMethod,
      ipAddress,
      userAgent,
      errorMessage,
      errorCode,
      stackTrace,
      targetResource,
      targetResourceType,
      requestData: sanitizeData(requestData),
      responseData: sanitizeData(responseData),
      duration,
      timestamp: new Date()
    };

    // Create and save the log entry
    const activityLog = new ActivityLog(logData);
    await activityLog.save();

    console.log(`Action logged: ${actionType} - ${status} by ${userId}`);
    return activityLog;

  } catch (error) {
    console.error('Error logging action:', error);
    return null;
  }
}

/**
 * Convenience function for logging successful actions
 */
export async function logSuccess(actionType, req, details = {}, targetResource = null, targetResourceType = null) {
  return await logAction({
    actionType,
    status: 'success',
    req,
    details,
    targetResource,
    targetResourceType
  });
}

/**
 * Convenience function for logging failed actions
 */
export async function logFailure(actionType, req, errorMessage, details = {}, errorCode = null, stackTrace = null) {
  return await logAction({
    actionType,
    status: 'failed',
    req,
    details,
    errorMessage,
    errorCode,
    stackTrace
  });
}

/**
 * Convenience function for logging attempted actions
 */
export async function logAttempt(actionType, req, details = {}) {
  return await logAction({
    actionType,
    status: 'attempted',
    req,
    details
  });
}

/**
 * Function to get user info from token
 */
export function getUserFromToken(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      userId: decoded.phone || decoded.id,
      userName: decoded.name,
      userRole: decoded.role,
      phone: decoded.phone
    };
  } catch (error) {
    return null;
  }
}

/**
 * Function to extract client IP address
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown';
}

/**
 * Function to sanitize sensitive data before logging
 */
function sanitizeData(data) {
  if (!data) return null;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = JSON.parse(JSON.stringify(data));
  
  function sanitizeObject(obj) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
  }
  
  sanitizeObject(sanitized);
  return sanitized;
}

/**
 * Function to get activity logs with filtering options
 */
export async function getActivityLogs({
  societyId = null,
  userId = null,
  actionType = null,
  status = null,
  startDate = null,
  endDate = null,
  limit = 100,
  page = 1
} = {}) {
  try {
    await connectToDatabase();
    
    const filter = {};
    
    if (societyId) filter.societyId = societyId;
    if (userId) filter.userId = userId;
    if (actionType) filter.actionType = actionType;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await ActivityLog.countDocuments(filter);
    
    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
}
