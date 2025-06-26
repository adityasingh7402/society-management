import connectToDatabase from '../../../lib/mongodb';
import ProductMessage from '../../../models/ProductMessage';
import Product from '../../../models/Product';
import Resident from '../../../models/Resident';
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

    // Connect to database first
    await connectToDatabase();

    // Decode token to get sender ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const senderId = decoded.id;

    if (!senderId) {
      return res.status(401).json({ message: 'Invalid token: No user ID found' });
    }

    // Validate request body
    const { productId, message, receiverId } = req.body;

    if (!productId || !message || !receiverId) {
      const missingFields = [];
      if (!productId) missingFields.push('productId');
      if (!message) missingFields.push('message');
      if (!receiverId) missingFields.push('receiverId');
      return res.status(400).json({ 
        message: 'Missing required fields', 
        missingFields 
      });
    }

    // Verify that the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify that both users exist
    const [sender, receiver] = await Promise.all([
      Resident.findById(senderId),
      Resident.findById(receiverId)
    ]);

    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Create and save new message
    const messageData = {
      productId,
      senderId,
      receiverId,
      message,
      isRead: false
    };

    const newMessage = new ProductMessage(messageData);
    await newMessage.save();

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        ...newMessage.toObject(),
        senderName: sender.name,
        senderImage: sender.userImage,
        receiverName: receiver.name,
        receiverImage: receiver.userImage,
        productTitle: product.title
      }
    });

  } catch (error) {
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 