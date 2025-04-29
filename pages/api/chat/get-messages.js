import connectToDatabase from '../../../lib/mongodb';
import ChatMessage from '../../../models/ChatMessage';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    const { recipientId } = req.query;

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    // Fetch messages where either sender or receiver is the current user
    const messages = await ChatMessage.find({
      $or: [
        { senderId: recipientId },
        { receiverId: recipientId }
      ]
    })
    .sort({ timestamp: 1 }) // Sort by timestamp in ascending order
    .lean(); // Convert mongoose documents to plain JavaScript objects

    return res.status(200).json({
      success: true,
      messages: messages
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch messages',
      error: error.message 
    });
  }
}