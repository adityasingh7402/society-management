import connectToDatabase from '../../../lib/mongodb';
import HelpDeskMessage from '../../../models/HelpDeskMessage';
import jwt from 'jsonwebtoken';
import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';
import { createRouter } from 'next-connect';
import { logSuccess, logFailure } from '../../../services/loggingService';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Turn off the default body parser to handle form-data for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const router = createRouter();

// Middleware to verify society authentication
const societyAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Make sure it's a society token
    if (!decoded.societyId) {
      return res.status(403).json({ success: false, message: 'Access denied. Society credentials required.' });
    }
    
    req.society = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
};

router.use(societyAuthMiddleware);

// GET - Get all help desk messages for a society
router.get(async (req, res) => {
  try {
    await connectToDatabase();
    const { societyId } = req.society;
    const { residentId, limit = 100 } = req.query;

    // Base query - filter by society ID
    const query = { societyId };

    // If a resident ID is provided, filter by that as well
    if (residentId) {
      query.residentId = residentId;
    }

    // Fetch messages
    const messages = await HelpDeskMessage.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('residentId', 'name flatDetails.flatNumber userImage')
      .lean();

    // If filtering by residentId, return messages in chronological order
    const sortedMessages = residentId 
      ? messages.reverse() 
      : messages;

    // Group by resident if not filtering for a specific resident
    if (!residentId) {
      // Get unique resident IDs
      const uniqueResidents = [...new Set(messages.map(m => m.residentId?._id?.toString()))];
      
      // Get the most recent message for each resident
      const conversationPreviews = uniqueResidents.map(id => {
        const residentMessages = messages.filter(m => m.residentId?._id?.toString() === id);
        const lastMessage = residentMessages[0]; // Already sorted by timestamp descending
        
        return {
          resident: lastMessage.residentId,
          lastMessage: {
            id: lastMessage._id,
            text: lastMessage.message,
            timestamp: lastMessage.timestamp,
            isFromResident: lastMessage.isFromResident
          },
          unreadCount: residentMessages.filter(m => m.isFromResident && m.status !== 'read').length
        };
      });
      
      return res.status(200).json({
        success: true,
        conversations: conversationPreviews
      });
    }

    // Return messages for a specific resident
    return res.status(200).json({
      success: true,
      messages: sortedMessages,
      resident: sortedMessages.length > 0 ? sortedMessages[0].residentId : null
    });
  } catch (error) {
    console.error('Error fetching help desk messages:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST - Society sending a reply to a resident
router.post(async (req, res) => {
  const form = formidable({
    multiples: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });

  try {
    await connectToDatabase();

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const { residentId, message } = fields;
    const { societyId } = req.society;

    // Validate required fields
    if (!residentId || !message) {
      await logFailure('SEND_HELPDESK_REPLY', req, 'Resident ID and message are required', {
        providedFields: { residentId: !!residentId, message: !!message },
        societyId,
        errorType: 'VALIDATION_ERROR'
      });
      return res.status(400).json({ success: false, message: 'Resident ID and message are required' });
    }

    let mediaData = null;

    // Handle file upload if present
    if (files.media) {
      try {
        const uploadResult = await cloudinary.uploader.upload(files.media.filepath, {
          resource_type: 'auto',
          folder: 'helpdesk_messages',
        });

        mediaData = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          type: files.media.mimetype,
          filename: files.media.originalFilename
        };
      } catch (uploadError) {
        console.error('Error uploading file to Cloudinary:', uploadError);
        return res.status(500).json({ success: false, message: 'Failed to upload file' });
      }
    }

    // Create a new message from society
    const newMessage = new HelpDeskMessage({
      residentId,
      message,
      societyId,
      isFromResident: false, // Message from society management
      media: mediaData,
    });

    // Save the message
    await newMessage.save();

    // Mark all previous messages from this resident as read
    const updateResult = await HelpDeskMessage.updateMany(
      { residentId, societyId, isFromResident: true, status: { $ne: 'read' } },
      { status: 'read' }
    );

    // Log successful helpdesk reply
    await logSuccess('SEND_HELPDESK_REPLY', req, {
      messageId: newMessage._id.toString(),
      residentId,
      societyId,
      messageLength: message.length,
      hasMedia: !!mediaData,
      mediaType: mediaData?.type,
      markedAsReadCount: updateResult.modifiedCount
    }, newMessage._id.toString(), 'helpdesk_message');

    // Return success response
    return res.status(201).json({
      success: true,
      messageId: newMessage._id,
      media: mediaData,
      message: 'Reply sent successfully'
    });
  } catch (error) {
    console.error('Error sending help desk reply:', error);
    
    // Log the failure
    await logFailure('SEND_HELPDESK_REPLY', req, error.message, {
      societyId: req.society?.societyId,
      errorType: error.name
    });
    
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH - Mark messages as read
router.patch(async (req, res) => {
  try {
    await connectToDatabase();
    
    const { residentId } = req.body;
    const { societyId } = req.society;
    
    if (!residentId) {
      return res.status(400).json({ success: false, message: 'Resident ID is required' });
    }
    
    // Update all unread messages from this resident
    const result = await HelpDeskMessage.updateMany(
      { residentId, societyId, isFromResident: true, status: { $ne: 'read' } },
      { status: 'read' }
    );
    
    return res.status(200).json({
      success: true,
      updatedCount: result.modifiedCount,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router.handler(); 