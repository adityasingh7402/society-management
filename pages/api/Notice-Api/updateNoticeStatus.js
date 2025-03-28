import Notice from '../../../models/Notice';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { noticeId } = req.query;
    const { status, approvedBy } = req.body;

    if (!noticeId || !status || !approvedBy) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const notice = await Notice.findByIdAndUpdate(
      noticeId,
      {
        status,
        approvedBy: {
          ...approvedBy,
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

    res.status(200).json({ success: true, data: notice });
  } catch (error) {
    console.error('Error updating notice status:', error);
    res.status(500).json({ message: 'Failed to update notice status', error: error.message });
  }
}