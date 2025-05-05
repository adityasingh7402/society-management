import connectDB from '../../../lib/mongodb';
import Message from '../../../models/Message';
import { IncomingForm } from 'formidable';
import cloudinary from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  // Log Cloudinary configuration status
  console.log('Cloudinary configuration status:', {
    hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
  });
} catch (err) {
  console.error('Cloudinary configuration error:', err);
}

// Disable the default body parser to handle FormData
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    await connectDB();
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return getMessages(req, res);
      case 'POST':
        return sendMessage(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Get messages between current user and another resident
async function getMessages(req, res) {
  const { userId, recipientId, limit = 50, before } = req.query;
  
  if (!userId || !recipientId) {
    return res.status(400).json({ message: 'User ID and Recipient ID are required' });
  }
  
  try {
    let query = {
      $or: [
        { senderId: userId, recipientId },
        { senderId: recipientId, recipientId: userId }
      ]
    };
    
    // For pagination
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }
    
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Mark unread messages as delivered
    await Message.updateMany(
      { senderId: recipientId, recipientId: userId, status: 'sent' },
      { $set: { status: 'delivered' } }
    );
    
    return res.status(200).json({
      success: true,
      messages: messages.reverse()
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ message: 'Failed to fetch messages' });
  }
}

// Parse form data including files
const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      multiples: true,
      keepExtensions: true
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

// Send a new message
async function sendMessage(req, res) {
  try {
    // Check if the request is JSON
    if (req.headers['content-type']?.includes('application/json')) {
      // Parse JSON body manually since bodyParser is disabled
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      return req.on('end', async () => {
        try {
          const { senderId, recipientId, message, media } = JSON.parse(body);
          
          if (!senderId || !recipientId) {
            return res.status(400).json({ 
              message: 'Sender ID and Recipient ID are required',
              received: { senderId, recipientId, message }
            });
          }
          
          // Check if either message or media is present
          if (!message && !media) {
            return res.status(400).json({
              success: false,
              message: 'Either message content or media must be provided'
            });
          }
          
          // Print the received data to help debug
          console.log('Creating message with data:', { senderId, recipientId, message, media });
          
          const newMessage = new Message({
            senderId,
            recipientId,
            message: message || '',
            media,
            timestamp: new Date(),
            status: 'sent'
          });
          
          await newMessage.save();
          
          return res.status(201).json({
            success: true,
            messageId: newMessage._id,
            message: newMessage
          });
        } catch (error) {
          console.error('Error parsing or saving JSON message:', error);
          return res.status(400).json({ 
            message: 'Invalid JSON data or database error', 
            error: error.message 
          });
        }
      });
    }
    
    // Handle FormData
    const { fields, files } = await parseForm(req);
    
    // Extract fields correctly - form data fields might be arrays
    const senderId = Array.isArray(fields.senderId) ? fields.senderId[0] : fields.senderId;
    const recipientId = Array.isArray(fields.recipientId) ? fields.recipientId[0] : fields.recipientId;
    const messageText = Array.isArray(fields.message) ? fields.message[0] : fields.message || '';
    
    if (!senderId || !recipientId) {
      return res.status(400).json({ 
        message: 'Sender ID and Recipient ID are required',
        received: { senderId, recipientId, messageText, originalFields: fields }
      });
    }
    
    let media = null;
    
    // Handle file upload if present
    if (files.media) {
      try {
        // Extract the first file from the array (if it's an array)
        const file = Array.isArray(files.media) ? files.media[0] : files.media;
        
        if (!file.filepath) {
          console.error('File path is undefined', file);
          throw new Error('Invalid file upload');
        }
        
        // Log file details before uploading
        console.log('Attempting to upload file:', {
          name: file.originalFilename,
          mimetype: file.mimetype,
          size: file.size,
          hasValidPath: fs.existsSync(file.filepath)
        });
        
        // Upload to Cloudinary instead of local file system
        try {
          const result = await cloudinary.uploader.upload(file.filepath, {
            resource_type: 'auto', // Automatically detect the file type
          });
          
          media = {
            url: result.secure_url,
            type: file.mimetype,
            filename: file.originalFilename || 'file'
          };
          
          console.log('Media object created:', media);
        } catch (cloudinaryError) {
          console.error('Cloudinary upload error:', cloudinaryError);
          throw new Error(`Cloudinary upload failed: ${cloudinaryError.message}`);
        }
        
        // Clean up the temporary file
        try {
          fs.unlinkSync(file.filepath);
        } catch (fsError) {
          console.error('Error cleaning up temporary file:', fsError);
          // Continue anyway, this is not critical
        }
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        return res.status(400).json({ 
          message: 'Failed to upload media', 
          error: uploadError.message,
          details: uploadError.stack 
        });
      }
    }
    
    try {
      const messageData = {
        senderId,
        recipientId,
        message: messageText,
        timestamp: new Date(),
        status: 'sent'
      };
      
      // Only add media if it exists
      if (media) {
        messageData.media = media;
      }
      
      // Custom validation - ensure at least one of message or media is present
      if (!messageData.message && !messageData.media) {
        return res.status(400).json({
          success: false,
          message: 'Either message content or media must be provided'
        });
      }
      
      console.log('Creating message with data:', messageData);
      
      const newMessage = new Message(messageData);
      await newMessage.save();
      
      return res.status(201).json({
        success: true,
        messageId: newMessage._id,
        media,
        message: newMessage
      });
    } catch (error) {
      console.error('Error saving message:', error);
      return res.status(500).json({ 
        message: 'Failed to save message', 
        error: error.message,
        stack: error.stack
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
}