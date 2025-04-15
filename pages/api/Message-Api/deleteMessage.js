import connectDB from '../../../lib/mongodb';
import Message from '../../../models/Message';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { messageId } = req.body;
    
    if (!messageId) {
      return res.status(400).json({ message: 'Message ID is required' });
    }

    // Soft delete the message by marking it as deleted
    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        isDeleted: true,
        content: 'This message has been deleted',
        deletedAt: new Date()
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json({ success: true, message });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
}