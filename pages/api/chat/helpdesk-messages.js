import connectToDatabase from '../../../lib/mongodb';
import HelpDeskMessage from '../../../models/HelpDeskMessage';
import Resident from '../../../models/Resident';
import jwt from 'jsonwebtoken';
import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';
import { createRouter } from 'next-connect';

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

// Middleware to verify authentication
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
};

router.use(authMiddleware);

// GET - Fetch help desk messages for a resident
router.get(async (req, res) => {
  try {
    await connectToDatabase();
    const { residentId, societyId } = req.query;
    
    if (!residentId || !societyId) {
      return res.status(400).json({ message: 'Resident ID and Society ID are required' });
    }

    const messages = await HelpDeskMessage.find({
      residentId,
      societyId
    }).sort({ timestamp: 1 });

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching help desk messages:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST - Send a new help desk message
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

    const { residentId, societyId, message, isFromResident } = fields;

    // Validate required fields
    if (!residentId || !societyId || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify user authorization
    if (req.user.id !== residentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized message sending' });
    }

    // Find the resident to get their society ID
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
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

    // Create a new message
    const newMessage = new HelpDeskMessage({
      residentId,
      societyId,
      message,
      isFromResident,
      timestamp: new Date(),
      status: 'sent',
      media: mediaData,
    });

    // Save the message
    await newMessage.save();

    // Return success response
    return res.status(201).json({
      success: true,
      messageId: newMessage._id,
      media: mediaData,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending help desk message:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router.handler(); 