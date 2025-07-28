import connectToDatabase from '../../../lib/mongodb';
import Visitor from '../../../models/Visitor';
import Resident from '../../../models/Resident';
import admin from 'firebase-admin';
import cloudinary from 'cloudinary';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import mongoose from 'mongoose';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const form = new IncomingForm();
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'File upload parsing failed', 
        details: err.message 
      });
    }

    // Start a database session for transaction support
    let session = null;
    let uploadedImageUrl = null;
    let tempFilePath = null;

    try {
      // Connect to the database
      await connectToDatabase();
      
      // Extract form data - handle arrays from formidable
      const societyId = Array.isArray(fields.societyId) ? fields.societyId[0] : fields.societyId;
      const blockName = Array.isArray(fields.blockName) ? fields.blockName[0] : fields.blockName;
      const floorNumber = Array.isArray(fields.floorNumber) ? fields.floorNumber[0] : fields.floorNumber;
      const flatNumber = Array.isArray(fields.flatNumber) ? fields.flatNumber[0] : fields.flatNumber;
      const guardName = Array.isArray(fields.guardName) ? fields.guardName[0] : fields.guardName;
      const guardImage = Array.isArray(fields.guardImage) ? fields.guardImage[0] : fields.guardImage;
      const guardPhone = Array.isArray(fields.guardPhone) ? fields.guardPhone[0] : fields.guardPhone;
      const residentId = Array.isArray(fields.residentId) ? fields.residentId[0] : fields.residentId;
      const ownerName = Array.isArray(fields.ownerName) ? fields.ownerName[0] : fields.ownerName;
      const ownerMobile = Array.isArray(fields.ownerMobile) ? fields.ownerMobile[0] : fields.ownerMobile;
      const ownerEmail = Array.isArray(fields.ownerEmail) ? fields.ownerEmail[0] : fields.ownerEmail;
      const visitorName = Array.isArray(fields.visitorName) ? fields.visitorName[0] : fields.visitorName;
      const visitorReason = Array.isArray(fields.visitorReason) ? fields.visitorReason[0] : fields.visitorReason;
      const entryTime = Array.isArray(fields.entryTime) ? fields.entryTime[0] : fields.entryTime;
      const exitTime = Array.isArray(fields.exitTime) ? fields.exitTime[0] : fields.exitTime;
      const CreatedBy = Array.isArray(fields.CreatedBy) ? fields.CreatedBy[0] : fields.CreatedBy;

      // Validate required fields
      if (!societyId || !blockName || !flatNumber || !residentId || !visitorName || !entryTime) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      // Validate image file
      const imageFile = files.image;
      if (!imageFile) {
        return res.status(400).json({ 
          success: false, 
          error: 'Visitor image is required' 
        });
      }

      const file = Array.isArray(imageFile) ? imageFile[0] : imageFile;
      tempFilePath = file.filepath;

      // Step 1: Upload image to Cloudinary first
      console.log('Uploading image to Cloudinary...');
      const uploadResult = await cloudinary.uploader.upload(file.filepath, {
        resource_type: 'auto',
        folder: 'visitors', // Organize images in a folder
        transformation: [
          { width: 800, height: 800, crop: 'limit' }, // Optimize image size
          { quality: 'auto' }
        ]
      });
      uploadedImageUrl = uploadResult.secure_url;
      console.log('Image uploaded successfully:', uploadedImageUrl);

      // Step 2: Start database transaction
      session = await mongoose.startSession();
      session.startTransaction();

      // Step 3: Create visitor record with image URL
      const newVisitor = new Visitor({
        societyId,
        blockName,
        floorNumber: parseInt(floorNumber),
        flatNumber,
        guardName,
        guardImage,
        guardPhone,
        residentId,
        ownerName,
        ownerMobile,
        ownerEmail,
        visitorName,
        visitorReason,
        visitorImage: uploadedImageUrl, // Include image URL
        entryTime: new Date(entryTime),
        exitTime: exitTime ? new Date(exitTime) : null,
        CreatedBy,
        createdAt: new Date(),
        status: 'pending'
      });

      const savedVisitor = await newVisitor.save({ session });
      console.log('Visitor saved to database:', savedVisitor._id);

      // Step 4: Send notifications (non-blocking)
      const notificationPromise = sendNotificationToResident(residentId, {
        visitorName,
        visitorReason,
        guardName,
        guardPhone,
        entryTime,
        visitorImage: uploadedImageUrl,
        visitorId: savedVisitor._id.toString()
      });

      // Don't wait for notification to complete the transaction
      notificationPromise.catch(error => {
        console.error('Notification failed (non-blocking):', error);
      });

      // Step 5: Commit transaction
      await session.commitTransaction();
      console.log('Transaction committed successfully');

      // Step 6: Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      // Success response
      res.status(201).json({
        success: true,
        message: 'Visitor entry created successfully with image',
        _id: savedVisitor._id,
        visitorName: savedVisitor.visitorName,
        visitorImage: uploadedImageUrl
      });

    } catch (error) {
      console.error('Error in visitor entry creation:', error);

      // Rollback transaction if it was started
      if (session) {
        try {
          await session.abortTransaction();
          console.log('Transaction rolled back');
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError);
        }
      }

      // Clean up uploaded image if database operation failed
      if (uploadedImageUrl) {
        try {
          // Extract public_id from Cloudinary URL for deletion
          const publicId = uploadedImageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`visitors/${publicId}`);
          console.log('Uploaded image cleaned up from Cloudinary');
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded image:', cleanupError);
        }
      }

      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (fileError) {
          console.error('Error cleaning up temp file:', fileError);
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create visitor entry',
        details: error.message
      });

    } finally {
      // Always end the session
      if (session) {
        session.endSession();
      }
    }
  });
}

// Helper function to send notifications
async function sendNotificationToResident(residentId, visitorData) {
  try {
    const resident = await Resident.findById(residentId);
    
    if (!resident || !resident.fcmTokens || resident.fcmTokens.length === 0) {
      console.log('No FCM tokens found for resident, notification not sent');
      return;
    }

    const notifications = resident.fcmTokens.map(token =>
      admin.messaging().send({
        token: token,
        data: {
          title: 'New Visitor',
          body: `Visitor: ${visitorData.visitorName}\nReason: ${visitorData.visitorReason || 'Not specified'}`,
          visitorId: visitorData.visitorId,
          type: 'visitor_entry',
          guardName: visitorData.guardName || '',
          guardPhone: visitorData.guardPhone || '',
          visitorReason: visitorData.visitorReason || '',
          entryTime: visitorData.entryTime || '',
          visitorImage: visitorData.visitorImage || ''
        },
        android: {
          priority: 'high',
          ttl: 3600 * 1000
        }
      })
    );

    await Promise.all(notifications);
    console.log('Notifications sent successfully to resident');
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error; // Re-throw to be handled by caller
  }
}
