import Notice from '../../../models/Notice';
import connectDB from '../../../lib/mongodb';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let noticeData = {};
  let hasAuthToken = false;

  try {
    await connectDB();
    
    const authHeader = req.headers.authorization;
    hasAuthToken = !!authHeader;
    
    const {
      title,
      description,
      noticeType,
      category,
      priorityLevel,
      societyId,
      createdBy,
      attachments
    } = req.body;

    noticeData = {
      title: title || '',
      noticeType: noticeType || '',
      category: category || '',
      priorityLevel: priorityLevel || '',
      societyId: societyId || '',
      createdByName: createdBy?.name || '',
      createdByRole: createdBy?.role || '',
      hasAttachments: !!(attachments && attachments.length > 0),
      attachmentCount: attachments?.length || 0,
      hasAuthToken
    };

    // Validate required fields
    if (!title || !description || !noticeType || !category || !priorityLevel || !societyId || !createdBy) {
      const missingFields = [];
      if (!title) missingFields.push('title');
      if (!description) missingFields.push('description');
      if (!noticeType) missingFields.push('noticeType');
      if (!category) missingFields.push('category');
      if (!priorityLevel) missingFields.push('priorityLevel');
      if (!societyId) missingFields.push('societyId');
      if (!createdBy) missingFields.push('createdBy');

      await logFailure('CREATE_NOTICE', req, 'Validation failed - missing required fields', {
        ...noticeData,
        missingFields,
        errorType: 'VALIDATION_ERROR'
      });

      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Auto-approve if created by management
    const status = createdBy.role === 'management' ? 'approved' : 'pending';
    const approvedBy = createdBy.role === 'management' ? {
      userId: createdBy.userId,
      name: createdBy.name,
      approvedAt: new Date()
    } : undefined;

    const notice = new Notice({
      title,
      description,
      noticeType,
      category,
      priorityLevel,
      societyId,
      createdBy,
      status,
      approvedBy,
      attachments: attachments || []
    });

    await notice.save();
    
    // Log successful creation
    await logSuccess('CREATE_NOTICE', req, {
      noticeId: notice._id.toString(),
      title: notice.title,
      noticeType: notice.noticeType,
      category: notice.category,
      priorityLevel: notice.priorityLevel,
      societyId: notice.societyId,
      createdBy: notice.createdBy?.name || 'Unknown',
      createdByRole: notice.createdBy?.role || 'unknown',
      status: notice.status,
      autoApproved: status === 'approved',
      attachmentCount: notice.attachments?.length || 0,
      hasAttachments: !!(notice.attachments && notice.attachments.length > 0),
      hasAuthToken
    });
    
    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    console.error('Error creating notice:', error);
    
    // Log failure with context
    await logFailure('CREATE_NOTICE', req, 'Failed to create notice', {
      ...noticeData,
      errorMessage: error.message,
      errorType: error.name || 'UNKNOWN_ERROR'
    });
    
    res.status(500).json({ message: 'Failed to create notice', error: error.message });
  }
}
