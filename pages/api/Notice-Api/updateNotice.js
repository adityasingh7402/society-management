import Notice from '../../../models/Notice';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { noticeId } = req.query;
    const updateData = req.body;

    if (!noticeId) {
      return res.status(400).json({
        success: false,
        message: 'Notice ID is required'
      });
    }

    // If it's a status update
    if (updateData.status && updateData.approvedBy) {
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

      if (!notice) {
        return res.status(404).json({
          success: false,
          message: 'Notice not found'
        });
      }

      return res.status(200).json({ success: true, data: notice });
    }
    
    // For full notice update
    const { title, description, noticeType, category, priorityLevel, societyId, attachments, updatedBy } = updateData;
    
    if (!title || !description || !noticeType || !category || !priorityLevel || !societyId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
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

    if (!updatedNotice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    res.status(200).json({ success: true, data: updatedNotice });
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({ message: 'Failed to update notice', error: error.message });
  }
}