import connectDB from '../../../lib/mongodb';
import Message from '../../../models/Message';

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { senderId, userId } = req.body;
    
    if (!senderId || !userId) {
      return res.status(400).json({ 
        message: 'Both senderId and userId are required parameters',
        received: req.body
      });
    }
    
    console.log(`Marking messages as read: from ${senderId} to ${userId}`);
    
    // Update all messages that were sent by the senderId to the current user
    const result = await Message.updateMany(
      { senderId, recipientId: userId, status: { $ne: 'read' } },
      { $set: { status: 'read' } }
    );
    
    console.log(`Marked ${result.modifiedCount} messages as read`);
    
    return res.status(200).json({ 
      success: true, 
      count: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ 
      message: 'Failed to mark messages as read',
      error: error.message 
    });
  }
} 