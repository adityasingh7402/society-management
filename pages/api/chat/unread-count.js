import connectDB from '../../../lib/mongodb';
import Message from '../../../models/Message';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Get unread message counts grouped by sender
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          recipientId: userId,
          status: { $ne: 'read' }
        }
      },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 },
          lastMessage: { $last: '$message' },
          lastTimestamp: { $last: '$timestamp' }
        }
      }
    ]); // Remove .lean() as it's not supported on aggregate

    res.status(200).json({ success: true, unreadCounts });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    res.status(500).json({ message: 'Failed to fetch unread counts' });
  }
}