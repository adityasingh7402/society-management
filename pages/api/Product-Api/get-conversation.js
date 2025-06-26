import connectToDatabase from '../../../lib/mongodb';
import ProductMessage from '../../../models/ProductMessage';
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

    // Get query parameters - both are required for this endpoint
    const { productId, otherUserId } = req.query;

    if (!productId || !otherUserId) {
      return res.status(400).json({ 
        message: 'Both productId and otherUserId are required' 
      });
    }

    // Build query to get messages between these two users for this product
    const query = {
      productId: productId,
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    };

    // Get messages based on query
    let messages = await ProductMessage.find(query)
      .sort({ createdAt: 1 }) // Sort by creation time ascending
      .lean();

    console.log('Found conversation messages:', messages.length);

    // If no messages, return empty array
    if (!messages.length) {
      return res.status(200).json([]);
    }

    // Get product details once
    const product = await mongoose.model('Product').findById(productId).select('title').lean();
    
    // Get both users' details once
    const [user1, user2] = await Promise.all([
      Resident.findById(userId).select('name userImage').lean(),
      Resident.findById(otherUserId).select('name userImage').lean()
    ]);

    // Map messages with user and product details
    const populatedMessages = messages.map(msg => {
      const isUserSender = msg.senderId.toString() === userId;
      return {
        _id: msg._id,
        message: msg.message,
        productId: msg.productId,
        productTitle: product?.title || 'Unknown Product',
        senderId: msg.senderId,
        senderName: isUserSender ? user1?.name : user2?.name || 'Unknown User',
        senderImage: isUserSender ? user1?.userImage : user2?.userImage,
        receiverId: msg.receiverId,
        receiverName: isUserSender ? user2?.name : user1?.name || 'Unknown User',
        receiverImage: isUserSender ? user2?.userImage : user1?.userImage,
        createdAt: msg.createdAt,
        isRead: msg.isRead
      };
    });

    return res.status(200).json(populatedMessages);

  } catch (error) {
    console.error('Error in get-conversation:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 