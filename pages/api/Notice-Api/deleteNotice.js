import Notice from '../../../models/Notice';
import connectDB from '../../../lib/mongodb';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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

    if (!noticeId) {
      await logFailure('DELETE_NOTICE', req, 'Notice ID is required', {
        hasAuthToken,
        errorType: 'MISSING_NOTICE_ID'
      });
      
      return res.status(400).json({
        success: false,
        message: 'Notice ID is required'
      });
    }

    // First find the notice to get its details for logging
    const existingNotice = await Notice.findById(noticeId);
    
    if (!existingNotice) {
      await logFailure('DELETE_NOTICE', req, 'Notice not found', {
        noticeId,
        hasAuthToken,
        errorType: 'NOTICE_NOT_FOUND'
      });
      
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    // Prepare notice data for logging
    noticeData = {
      noticeId: existingNotice._id.toString(),
      title: existingNotice.title || '',
      noticeType: existingNotice.noticeType || '',
      category: existingNotice.category || '',
      priorityLevel: existingNotice.priorityLevel || '',
      status: existingNotice.status || '',
      createdBy: existingNotice.createdBy?.name || 'Unknown',
      createdByRole: existingNotice.createdBy?.role || 'unknown',
      societyId: existingNotice.societyId || '',
      hasAttachments: !!(existingNotice.attachments && existingNotice.attachments.length > 0),
      attachmentCount: existingNotice.attachments?.length || 0,
      createdAt: existingNotice.createdAt,
      hasAuthToken
    };

    // Delete the notice
    await Notice.findByIdAndDelete(noticeId);

    // Log successful deletion
    await logSuccess('DELETE_NOTICE', req, {
      ...noticeData,
      deletedAt: new Date()
    });

    res.status(200).json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    
    // Log failure with context
    await logFailure('DELETE_NOTICE', req, 'Failed to delete notice', {
      ...noticeData,
      noticeId: noticeId || 'unknown',
      errorMessage: error.message,
      errorType: error.name || 'UNKNOWN_ERROR',
      hasAuthToken
    });
    
    res.status(500).json({ message: 'Failed to delete notice', error: error.message });
  }
}
