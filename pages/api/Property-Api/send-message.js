import connectToDatabase from '../../../lib/mongodb';
import PropertyMessage from '../../../models/PropertyMessage';
import Property from '../../../models/Property';
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
    try {
      await connectToDatabase();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return res.status(500).json({ message: 'Database connection failed', error: dbError.message });
    }

    // Decode token to get sender ID
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', { ...decoded, id: decoded.id });
    } catch (jwtError) {
      console.error('Token verification failed:', jwtError);
      return res.status(401).json({ message: 'Invalid token', error: jwtError.message });
    }

    const senderId = decoded.id;
    if (!senderId) {
      console.error('No sender ID in token:', decoded);
      return res.status(401).json({ message: 'Invalid token: No user ID found' });
    }

    // Validate request body
    const { propertyId, message, receiverId } = req.body;
    console.log('Request body:', { propertyId, message, receiverId });

    if (!propertyId || !message || !receiverId) {
      const missingFields = [];
      if (!propertyId) missingFields.push('propertyId');
      if (!message) missingFields.push('message');
      if (!receiverId) missingFields.push('receiverId');
      return res.status(400).json({ 
        message: 'Missing required fields', 
        missingFields 
      });
    }

    // Verify that the property exists
    let property;
    try {
      property = await Property.findById(propertyId);
      if (!property) {
        console.error('Property not found:', propertyId);
        return res.status(404).json({ message: 'Property not found' });
      }
      console.log('Found property:', { id: property._id, title: property.title });
    } catch (propertyError) {
      console.error('Error finding property:', propertyError);
      return res.status(500).json({ message: 'Error finding property', error: propertyError.message });
    }

    // Verify that both users exist
    let sender, receiver;
    try {
      [sender, receiver] = await Promise.all([
        Resident.findById(senderId),
        Resident.findById(receiverId)
      ]);

      if (!sender) {
        console.error('Sender not found:', senderId);
        return res.status(404).json({ message: 'Sender not found' });
      }
      if (!receiver) {
        console.error('Receiver not found:', receiverId);
        return res.status(404).json({ message: 'Receiver not found' });
      }

      console.log('Found users:', {
        sender: { id: sender._id, name: sender.name },
        receiver: { id: receiver._id, name: receiver.name }
      });
    } catch (userError) {
      console.error('Error finding users:', userError);
      return res.status(500).json({ message: 'Error finding users', error: userError.message });
    }

    // Create and save new message
    try {
      const messageData = {
        propertyId,
        societyId: property.societyId,
        senderId,
        receiverId,
        message,
        readBy: [{
          userId: senderId,
          readAt: new Date()
        }]
      };

      console.log('Creating new message with data:', messageData);
      const newMessage = new PropertyMessage(messageData);

      console.log('Attempting to save message:', {
        propertyId: newMessage.propertyId,
        senderId: newMessage.senderId,
        receiverId: newMessage.receiverId,
        message: newMessage.message
      });

      await newMessage.save();
      console.log('Message saved successfully');

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: {
          ...newMessage.toObject(),
          senderName: sender.name,
          senderImage: sender.userImage,
          receiverName: receiver.name,
          receiverImage: receiver.userImage,
          propertyTitle: property.title
        }
      });
    } catch (messageError) {
      console.error('Error saving message:', messageError);
      return res.status(500).json({ message: 'Error saving message', error: messageError.message });
    }

  } catch (error) {
    console.error('Unhandled error in send-message:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 