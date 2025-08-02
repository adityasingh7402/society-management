import connectToDatabase from '../../../lib/mongodb';
import Delivery from '../../../models/Delivery';
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

// Helper function to send notifications using direct FCM
async function sendNotificationToResident(residentId, deliveryData) {
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
          title: 'New Delivery',
          body: `Delivery: ${deliveryData.deliveryPersonName}\nCompany: ${deliveryData.deliveryCompany || 'Unknown'}\nItems: ${deliveryData.deliveryItems || 'Package'}`,
          deliveryId: deliveryData.deliveryId,
          type: 'delivery_entry',
          deliveryCompany: deliveryData.deliveryCompany || '',
          deliveryPersonName: deliveryData.deliveryPersonName || '',
          deliveryItems: deliveryData.deliveryItems || '',
          deliveryType: deliveryData.deliveryType || '',
          deliveryTime: deliveryData.deliveryTime || '',
          receivedTime: deliveryData.receivedTime || '',
          visitorImage: deliveryData.deliveryImage || '',
          guardName: deliveryData.guardName || '',
          guardPhone: deliveryData.guardPhone || '',
          flatNumber: deliveryData.flatNumber || '',
          blockName: deliveryData.blockName || ''
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
      const recipientName = Array.isArray(fields.recipientName) ? fields.recipientName[0] : fields.recipientName;
      const recipientPhone = Array.isArray(fields.recipientPhone) ? fields.recipientPhone[0] : fields.recipientPhone;
      const recipientEmail = Array.isArray(fields.recipientEmail) ? fields.recipientEmail[0] : fields.recipientEmail;
      const deliveryPersonName = Array.isArray(fields.deliveryPersonName) ? fields.deliveryPersonName[0] : fields.deliveryPersonName;
      const deliveryCompany = Array.isArray(fields.deliveryCompany) ? fields.deliveryCompany[0] : fields.deliveryCompany;
      const deliveryItems = Array.isArray(fields.deliveryItems) ? fields.deliveryItems[0] : fields.deliveryItems;
      const deliveryType = Array.isArray(fields.deliveryType) ? fields.deliveryType[0] : fields.deliveryType;
      const deliveryTime = Array.isArray(fields.deliveryTime) ? fields.deliveryTime[0] : fields.deliveryTime;
      const CreatedBy = Array.isArray(fields.CreatedBy) ? fields.CreatedBy[0] : fields.CreatedBy;

      // Validate required fields
      if (!societyId || !blockName || !flatNumber || !residentId || !deliveryPersonName || !deliveryTime) {
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
          error: 'Delivery image is required' 
        });
      }

      const file = Array.isArray(imageFile) ? imageFile[0] : imageFile;
      tempFilePath = file.filepath;

      // Step 1: Upload image to Cloudinary first
      console.log('Uploading image to Cloudinary...');
      const uploadResult = await cloudinary.uploader.upload(file.filepath, {
        resource_type: 'auto',
        folder: 'deliveries', // Organize images in a folder
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

      // Step 3: Create delivery record with image URL
      const newDelivery = new Delivery({
        societyId,
        blockName,
        floorNumber: parseInt(floorNumber),
        flatNumber,
        guardName,
        guardImage,
        guardPhone,
        recipientId: residentId,
        recipientName,
        recipientPhone,
        recipientEmail,
        deliveryPersonName,
        deliveryCompany,
        deliveryItems,
        deliveryType,
        deliveryPersonImage: uploadedImageUrl, // Include image URL
        deliveryTime: new Date(deliveryTime),
        receivedTime: new Date(),
        CreatedBy,
        createdAt: new Date(),
        status: 'Delivered'
      });

      const savedDelivery = await newDelivery.save({ session });
      console.log('Delivery saved to database:', savedDelivery._id);

      // Step 4: Send notifications (non-blocking)
      const notificationPromise = sendNotificationToResident(residentId, {
        deliveryPersonName,
        deliveryCompany,
        deliveryItems,
        deliveryType,
        guardName,
        guardPhone,
        deliveryTime,
        deliveryImage: uploadedImageUrl,
        deliveryId: savedDelivery._id.toString(),
        flatNumber,
        blockName,
        receivedTime: new Date().toISOString()
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
        message: 'Delivery entry created successfully with image',
        _id: savedDelivery._id,
        deliveryPersonName: savedDelivery.deliveryPersonName,
        deliveryImage: uploadedImageUrl
      });

    } catch (error) {
      console.error('Error in delivery entry creation:', error);

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
          await cloudinary.uploader.destroy(`deliveries/${publicId}`);
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
        error: 'Failed to create delivery entry',
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
