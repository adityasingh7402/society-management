import connectDB from '../../../lib/mongodb';
import Message from '../../../models/Message';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    console.log(`Getting unread counts for user: ${userId}`);
    
    // Convert userId to ObjectId for proper matching
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Aggregate unread message counts by sender
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          recipientId: userObjectId,
          status: { $ne: 'read' }
        }
      },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert the sender IDs to strings for consistency
    const formattedCounts = unreadCounts.map(item => ({
      _id: item._id.toString(),
      count: item.count
    }));
    
    console.log(`Found ${formattedCounts.length} senders with unread messages:`, formattedCounts);
    
    return res.status(200).json({
      success: true,
      unreadCounts: formattedCounts
    });
  } catch (error) {
    console.error('Error getting unread counts:', error);
    return res.status(500).json({ 
      message: 'Failed to get unread message counts',
      error: error.message 
    });
  }
}
