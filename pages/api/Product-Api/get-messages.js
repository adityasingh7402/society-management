import connectToDatabase from '../../../lib/mongodb';
import ProductMessage from '../../../models/ProductMessage';
import Product from '../../../models/Product';
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

    // Get query parameters
    const { productId, otherUserId, since } = req.query;

    // Build base query for user's messages
    let query = {};

    // If both productId and otherUserId are provided, get specific conversation
    if (productId && otherUserId) {
      query = {
        productId: productId,
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      };
    }
    // If only productId is provided, get all messages for that product
    else if (productId) {
      query = {
        productId: productId,
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      };
    }
    // If only otherUserId is provided, get all messages between these users
    else if (otherUserId) {
      query = {
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      };
    }
    // If no specific filters, get all user's messages
    else {
      query = {
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      };
    }

    // Add timestamp filter if 'since' parameter is provided
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    console.log('Query:', JSON.stringify(query, null, 2));

    // Get messages based on query
    let messages = await ProductMessage.find(query)
      .sort({ createdAt: 1 }) // Sort by creation time ascending
      .lean();

    console.log('Found messages:', messages.length);

    // If no messages, return empty array
    if (!messages.length) {
      return res.status(200).json([]);
    }

    // Populate product details
    const populatedMessages = await Promise.all(messages.map(async (msg) => {
      try {
        // Get product details
        const product = await Product.findById(msg.productId).select('title').lean();
        
        // Get sender details
        const sender = await Resident.findById(msg.senderId).select('name userImage').lean();
        
        // Get receiver details
        const receiver = await Resident.findById(msg.receiverId).select('name userImage').lean();

        return {
          _id: msg._id,
          message: msg.message,
          productId: msg.productId,
          productTitle: product?.title || 'Unknown Product',
          senderId: msg.senderId,
          senderName: sender?.name || 'Unknown User',
          senderImage: sender?.userImage,
          receiverId: msg.receiverId,
          receiverName: receiver?.name || 'Unknown User',
          receiverImage: receiver?.userImage,
          createdAt: msg.createdAt,
          isRead: msg.isRead
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
    console.error('Error in get-messages:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 