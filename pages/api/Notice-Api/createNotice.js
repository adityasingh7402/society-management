import Notice from '../../../models/Notice';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
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

    // Validate required fields
    if (!title || !description || !noticeType || !category || !priorityLevel || !societyId || !createdBy) {
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
    
    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ message: 'Failed to create notice', error: error.message });
  }
}