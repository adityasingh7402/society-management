import Notice from '../../../models/Notice';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { noticeId } = req.query;

    if (!noticeId) {
      return res.status(400).json({
        success: false,
        message: 'Notice ID is required'
      });
    }

    const notice = await Notice.findByIdAndDelete(noticeId);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    res.status(200).json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ message: 'Failed to delete notice', error: error.message });
  }
}