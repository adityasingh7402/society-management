import connectToDatabase from '../../../lib/mongodb';
import PropertyMessage from '../../../models/PropertyMessage';
import jwt from 'jsonwebtoken';
import Resident from '../../../models/Resident';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
      console.error('No user ID found in token:', decoded);
      return res.status(401).json({ message: 'Invalid token: No user ID' });
    }

    // Connect to the database
    await connectToDatabase();

    // Get count only if count=true in query
    if (req.query.count === 'true') {
      const unreadCount = await PropertyMessage.countDocuments({
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ],
        'readBy.userId': { $ne: userId } // Messages where user hasn't read
      });

      return res.status(200).json({ unreadCount });
    }

    // Get all unread messages where the user is either sender or receiver
    let messages = await PropertyMessage.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ],
      'readBy.userId': { $ne: userId } // Messages where user hasn't read
    }).lean();

    // If no messages, return empty array
    if (!messages.length) {
      return res.status(200).json([]);
    }

    // Populate property details
    const populatedMessages = await Promise.all(messages.map(async (msg) => {
      try {
        // Get property details
        const property = await mongoose.model('Property').findById(msg.propertyId).select('title').lean();
        
        // Get sender details
        const sender = await Resident.findById(msg.senderId).select('name userImage').lean();
        
        // Get receiver details
        const receiver = await Resident.findById(msg.receiverId).select('name userImage').lean();

        return {
          _id: msg._id,
          message: msg.message,
          propertyId: msg.propertyId,
          propertyTitle: property?.title || 'Unknown Property',
          societyId: msg.societyId,
          senderId: msg.senderId,
          senderName: sender?.name || 'Unknown User',
          senderImage: sender?.userImage,
          receiverId: msg.receiverId,
          receiverName: receiver?.name || 'Unknown User',
          receiverImage: receiver?.userImage,
          createdAt: msg.createdAt,
          isRead: false // These are all unread messages
        };
      } catch (err) {
        console.error('Error populating message:', err);
        return null;
      }
    }));

    // Filter out any failed message populations
    const formattedMessages = populatedMessages.filter(msg => msg !== null);

    return res.status(200).json(formattedMessages);

  } catch (error) {
    console.error('Error in get-unread-messages:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 