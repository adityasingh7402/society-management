import connectDB from '../../../lib/mongodb';
import Message from '../../../models/MessageG';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { societyCode, senderId, senderName, content, isSociety } = req.body;
    console.log(req.body)
    console.log("Society Code:", societyCode)
    
    if (!societyCode || !senderId || !senderName || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const message = await Message.create({
      societyId: societyCode, // Map societyCode to societyId in the Message model
      senderId,
      senderName,
      content,
      isSociety
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
}