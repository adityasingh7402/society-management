import Notice from '../../../models/Notice';
import connectDB from '../../../lib/mongodb';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let noticeData = {};
  let hasAuthToken = false;
  let noticeId = '';

  try {
    await connectDB();
    
    const authHeader = req.headers.authorization;
    hasAuthToken = !!authHeader;
    
    noticeId = req.query.noticeId;
    const updateData = req.body;

    noticeData = {
      noticeId: noticeId || '',
      title: updateData.title || '',
      noticeType: updateData.noticeType || '',
      category: updateData.category || '',
      priorityLevel: updateData.priorityLevel || '',
      status: updateData.status || '',
      updatedByName: updateData.updatedBy?.name || updateData.approvedBy?.name || '',
      updatedByRole: updateData.updatedBy?.role || '',
      hasAttachments: !!(updateData.attachments && updateData.attachments.length > 0),
      attachmentCount: updateData.attachments?.length || 0,
      hasAuthToken
    };

    if (!noticeId) {
      await logFailure('UPDATE_NOTICE', req, 'Notice ID is required', {
        ...noticeData,
        errorType: 'MISSING_NOTICE_ID'
      });
      
      return res.status(400).json({
        success: false,
        message: 'Notice ID is required'
      });
    }

    // If it's a status update
    if (updateData.status && updateData.approvedBy) {
      const existingNotice = await Notice.findById(noticeId);
      
      if (!existingNotice) {
        await logFailure('UPDATE_NOTICE_STATUS', req, 'Notice not found for status update', {
          ...noticeData,
          errorType: 'NOTICE_NOT_FOUND'
        });
        
        return res.status(404).json({
          success: false,
          message: 'Notice not found'
        });
      }
      
      const notice = await Notice.findByIdAndUpdate(
        noticeId,
        {
          status: updateData.status,
          approvedBy: {
            ...updateData.approvedBy,
            approvedAt: new Date()
          }
        },
        { new: true }
      );

      // Log successful status update
      await logSuccess('UPDATE_NOTICE_STATUS', req, {
        noticeId: notice._id.toString(),
        title: notice.title,
        previousStatus: existingNotice.status,
        newStatus: notice.status,
        approvedBy: notice.approvedBy?.name || 'Unknown',
        noticeType: notice.noticeType,
        category: notice.category,
        priorityLevel: notice.priorityLevel,
        hasAuthToken
      });

      return res.status(200).json({ success: true, data: notice });
    }
    
    // For full notice update
    const { title, description, noticeType, category, priorityLevel, societyId, attachments, updatedBy } = updateData;
    
    if (!title || !description || !noticeType || !category || !priorityLevel || !societyId) {
      const missingFields = [];
      if (!title) missingFields.push('title');
      if (!description) missingFields.push('description');
      if (!noticeType) missingFields.push('noticeType');
      if (!category) missingFields.push('category');
      if (!priorityLevel) missingFields.push('priorityLevel');
      if (!societyId) missingFields.push('societyId');

      await logFailure('UPDATE_NOTICE', req, 'Validation failed - missing required fields', {
        ...noticeData,
        missingFields,
        errorType: 'VALIDATION_ERROR'
      });
      
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const existingNotice = await Notice.findById(noticeId);
    
    if (!existingNotice) {
      await logFailure('UPDATE_NOTICE', req, 'Notice not found for full update', {
        ...noticeData,
        errorType: 'NOTICE_NOT_FOUND'
      });
      
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    const updatedNotice = await Notice.findByIdAndUpdate(
      noticeId,
      {
        title,
        description,
        noticeType,
        category,
        priorityLevel,
        societyId,
        attachments,
        updatedBy,
        updatedAt: new Date()
      },
      { new: true }
    );

    // Log successful full update
    await logSuccess('UPDATE_NOTICE', req, {
      noticeId: updatedNotice._id.toString(),
      title: updatedNotice.title,
      noticeType: updatedNotice.noticeType,
      category: updatedNotice.category,
      priorityLevel: updatedNotice.priorityLevel,
      updatedBy: updatedNotice.updatedBy?.name || 'Unknown',
      updatedByRole: updatedNotice.updatedBy?.role || 'unknown',
      attachmentCount: updatedNotice.attachments?.length || 0,
      hasAttachments: !!(updatedNotice.attachments && updatedNotice.attachments.length > 0),
      previousTitle: existingNotice.title,
      previousCategory: existingNotice.category,
      previousPriorityLevel: existingNotice.priorityLevel,
      hasAuthToken
    });

    res.status(200).json({ success: true, data: updatedNotice });
  } catch (error) {
    console.error('Error updating notice:', error);
    
    // Log failure with context
    await logFailure('UPDATE_NOTICE', req, 'Failed to update notice', {
      ...noticeData,
      errorMessage: error.message,
      errorType: error.name || 'UNKNOWN_ERROR'
    });
    
    res.status(500).json({ message: 'Failed to update notice', error: error.message });
  }
}
