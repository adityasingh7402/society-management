import { getActivityLogs, logSuccess, logFailure } from '../../../services/loggingService';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        throw new Error('Invalid token payload');
      }
    } catch (tokenError) {
      await logFailure('TOKEN_VALIDATION', req, tokenError.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Extract query parameters
    const {
      userId,
      actionType,
      status,
      startDate,
      endDate,
      limit = 50,
      page = 1
    } = req.query;

    // Get societyId from JWT token (societyPin is the MongoDB ObjectId)
    const societyId = decoded.societyPin || decoded.societyId;

    // Get activity logs filtered by society
    const logs = await getActivityLogs({
      societyId, // Always filter by the user's society
      userId,
      actionType,
      status,
      startDate,
      endDate,
      limit: parseInt(limit),
      page: parseInt(page)
    });

    // Note: We don't log ACTIVITY_LOG_VIEW to prevent recursive logging when viewing logs

    return res.status(200).json({
      success: true,
      data: logs,
      message: 'Activity logs retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    
    // Note: We don't log errors for ACTIVITY_LOG_VIEW to prevent recursive logging

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch activity logs'
    });
  }
}
