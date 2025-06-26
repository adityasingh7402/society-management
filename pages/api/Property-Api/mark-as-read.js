import connectToDatabase from '../../../lib/mongodb';
import PropertyMessage from '../../../models/PropertyMessage';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Authorization check
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    // Decode token to get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token: No user ID' });
    }

    // Connect to the database
    await connectToDatabase();

    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({ message: 'Sender ID is required' });
    }

    // Update all unread messages from this sender to the current user
    const result = await PropertyMessage.updateMany(
      { 
        senderId: senderId,
        receiverId: userId,
        isRead: false
      },
      { 
        $set: { isRead: true }
      }
    );

    return res.status(200).json({
      success: true,
      updatedCount: result.modifiedCount,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 