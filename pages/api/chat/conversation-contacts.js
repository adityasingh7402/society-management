import connectDB from '../../../lib/mongodb';
import Message from '../../../models/Message';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    console.log(`Getting conversation contacts for user: ${userId}`);
    
    // Convert userId to ObjectId for proper matching
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Get unique contacts (both sent to and received from) for this user
    const contacts = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userObjectId },
            { recipientId: userObjectId }
          ]
        }
      },
      {
        $project: {
          contactId: {
            $cond: {
              if: { $eq: ["$senderId", userObjectId] },
              then: "$recipientId",
              else: "$senderId"
            }
          },
          timestamp: 1
        }
      },
      {
        $group: {
          _id: "$contactId",
          lastMessageTime: { $max: "$timestamp" }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);
    
    // Extract just the contact IDs and convert them to strings
    const contactIds = contacts.map(contact => contact._id.toString());
    
    console.log(`Found ${contactIds.length} conversation contacts:`, contactIds);
    
    return res.status(200).json({
      success: true,
      contactIds
    });
  } catch (error) {
    console.error('Error getting conversation contacts:', error);
    return res.status(500).json({ 
      message: 'Failed to get conversation contacts',
      error: error.message 
    });
  }
}
