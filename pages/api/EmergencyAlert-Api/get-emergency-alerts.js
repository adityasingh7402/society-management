import connectToDatabase from '../../../lib/mongodb';
import EmergencyAlert from '../../../models/EmergencyAlert';
import { verifyToken } from '../../../utils/auth';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let queryParams = {};
  let hasAuthToken = false;

  try {
    await connectToDatabase();

    // Check authentication
    const authHeader = req.headers.authorization;
    hasAuthToken = !!authHeader;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await logFailure('GET_EMERGENCY_ALERTS', req, 'Authentication failed - missing or invalid token', {
        hasAuthToken,
        errorType: 'AUTHENTICATION_ERROR'
      });
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      await logFailure('GET_EMERGENCY_ALERTS', req, 'Authentication failed - invalid token', {
        hasAuthToken,
        errorType: 'INVALID_TOKEN'
      });
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Extract query parameters
    const {
      societyId,
      alertId,
      alertType,
      category,
      priorityLevel,
      status,
      targetAudience,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = 'false'
    } = req.query;

    queryParams = {
      societyId: societyId || '',
      alertId: alertId || '',
      alertType: alertType || '',
      category: category || '',
      priorityLevel: priorityLevel || '',
      status: status || '',
      targetAudience: targetAudience || '',
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      includeDeleted: includeDeleted === 'true',
      hasAuthToken
    };

    // Build MongoDB query
    const mongoQuery = {};

    // Society ID is required for fetching alerts
    if (societyId) {
      mongoQuery.societyId = societyId;
    } else {
      await logFailure('GET_EMERGENCY_ALERTS', req, 'Society ID is required', {
        ...queryParams,
        errorType: 'MISSING_SOCIETY_ID'
      });
      return res.status(400).json({ success: false, message: 'Society ID is required' });
    }

    // Single alert lookup
    if (alertId) {
      mongoQuery._id = alertId;
    }

    // Filter by alert type
    if (alertType) {
      mongoQuery.alertType = alertType;
    }

    // Filter by category
    if (category) {
      mongoQuery.category = category;
    }

    // Filter by priority level
    if (priorityLevel) {
      mongoQuery.priorityLevel = priorityLevel;
    }

    // Filter by status
    if (status) {
      mongoQuery.status = status;
    } else if (!includeDeleted) {
      // Exclude deleted alerts by default
      mongoQuery.status = { $ne: 'deleted' };
    }

    // Filter by target audience
    if (targetAudience) {
      mongoQuery.targetAudience = targetAudience;
    }

    // Pagination setup
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [alerts, totalCount] = await Promise.all([
      EmergencyAlert.find(mongoQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      EmergencyAlert.countDocuments(mongoQuery)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const paginationInfo = {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage,
      hasPreviousPage,
      limit,
      resultsCount: alerts.length
    };

    // Group alerts by categories and priority levels for summary
    const summary = {
      totalAlerts: alerts.length,
      byPriority: {
        high: alerts.filter(alert => alert.priorityLevel === 'High').length,
        medium: alerts.filter(alert => alert.priorityLevel === 'Medium').length,
        low: alerts.filter(alert => alert.priorityLevel === 'Low').length
      },
      byStatus: {
        active: alerts.filter(alert => alert.status === 'active').length,
        inactive: alerts.filter(alert => alert.status === 'inactive').length,
        resolved: alerts.filter(alert => alert.status === 'resolved').length,
        deleted: alerts.filter(alert => alert.status === 'deleted').length
      },
      byCategory: alerts.reduce((acc, alert) => {
        acc[alert.category] = (acc[alert.category] || 0) + 1;
        return acc;
      }, {}),
      byAlertType: alerts.reduce((acc, alert) => {
        acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
        return acc;
      }, {})
    };

    // Log successful fetch
    await logSuccess('GET_EMERGENCY_ALERTS', req, {
      ...queryParams,
      resultCount: alerts.length,
      totalCount,
      fetchedAlertTypes: Object.keys(summary.byAlertType),
      fetchedCategories: Object.keys(summary.byCategory),
      priorityDistribution: summary.byPriority,
      statusDistribution: summary.byStatus,
      requestedBy: decoded.name || 'Unknown',
      requestedByRole: decoded.role || 'unknown'
    });

    // Return single alert if alertId was provided
    if (alertId) {
      const alert = alerts[0];
      if (!alert) {
        await logFailure('GET_EMERGENCY_ALERTS', req, 'Emergency alert not found', {
          ...queryParams,
          errorType: 'ALERT_NOT_FOUND'
        });
        return res.status(404).json({ success: false, message: 'Emergency alert not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Emergency alert fetched successfully',
        data: alert
      });
    }

    // Return paginated list of alerts
    res.status(200).json({
      success: true,
      message: 'Emergency alerts fetched successfully',
      data: alerts,
      pagination: paginationInfo,
      summary: summary,
      filters: {
        societyId,
        alertType,
        category,
        priorityLevel,
        status,
        targetAudience,
        includeDeleted
      }
    });

  } catch (error) {
    console.error('Error fetching emergency alerts:', error);

    // Log failure with context
    await logFailure('GET_EMERGENCY_ALERTS', req, 'Failed to fetch emergency alerts', {
      ...queryParams,
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
