import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import connectDB from '../../../lib/mongodb';
import Delivery from '../../../models/Delivery';
import jwt from 'jsonwebtoken';

// Configure API route to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to send notification to resident
const sendNotificationToResident = async (deliveryData) => {
  try {
    const notificationData = {
      recipientId: deliveryData.recipientId,
      recipientEmail: deliveryData.recipientEmail,
      recipientPhone: deliveryData.recipientPhone,
      societyId: deliveryData.societyId,
      notificationType: 'delivery_received',
      title: 'Delivery Received',
      message: `Your ${deliveryData.deliveryType.toLowerCase()} from ${deliveryData.deliveryCompany} has been received by security. Items: ${deliveryData.deliveryItems}`,
      deliveryDetails: {
        deliveryCompany: deliveryData.deliveryCompany,
        deliveryType: deliveryData.deliveryType,
        deliveryItems: deliveryData.deliveryItems,
        deliveryPersonName: deliveryData.deliveryPersonName,
        receivedTime: deliveryData.receivedTime,
        trackingNumber: deliveryData.trackingNumber,
        guardName: deliveryData.guardName,
        flatNumber: deliveryData.flatNumber,
        blockName: deliveryData.blockName
      }
    };

    // Send notification via existing notification system
    const notificationResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/NotificationApi/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData)
    });

    if (notificationResponse.ok) {
      console.log('Delivery notification sent successfully');
      return true;
    } else {
      console.error('Failed to send delivery notification');
      return false;
    }
  } catch (error) {
    console.error('Error sending delivery notification:', error);
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Parse the multipart form data
    const form = new IncomingForm({
      uploadDir: './public/uploads/deliveries',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    // Ensure upload directory exists
    const uploadDir = './public/uploads/deliveries';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // Extract and validate form data
    const requiredFields = [
      'societyId', 'blockName', 'floorNumber', 'flatNumber',
      'recipientName', 'recipientPhone', 'deliveryPersonName',
      'deliveryCompany', 'deliveryType', 'deliveryItems'
    ];

    const deliveryData = {};
    for (const field of requiredFields) {
      const value = Array.isArray(fields[field]) ? fields[field][0] : fields[field];
      if (!value) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
      deliveryData[field] = value;
    }

    // Extract optional fields
    const optionalFields = [
      'recipientId', 'recipientEmail', 'deliveryPersonPhone', 'trackingNumber',
      'specialInstructions', 'deliveryTime', 'createdBy', 'guardName', 
      'guardImage', 'guardPhone', 'deliveryValue', 'requiresSignature', 'isFragile'
    ];

    for (const field of optionalFields) {
      const value = Array.isArray(fields[field]) ? fields[field][0] : fields[field];
      if (value) {
        deliveryData[field] = value;
      }
    }

    // Handle image upload
    let deliveryPersonImageUrl = null;
    if (files.image) {
      const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
      
      if (imageFile.size > 0) {
        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2);
        const fileExtension = path.extname(imageFile.originalFilename || '.jpg');
        const filename = `delivery_${timestamp}_${randomStr}${fileExtension}`;
        const newPath = path.join(uploadDir, filename);

        // Move file to permanent location
        fs.renameSync(imageFile.filepath, newPath);
        deliveryPersonImageUrl = `/uploads/deliveries/${filename}`;
      }
    }

    // Prepare delivery record data
    const deliveryRecord = {
      ...deliveryData,
      deliveryPersonImage: deliveryPersonImageUrl,
      floorNumber: parseInt(deliveryData.floorNumber),
      deliveryTime: deliveryData.deliveryTime ? new Date(deliveryData.deliveryTime) : new Date(),
      receivedTime: new Date(),
      status: 'Delivered',
      notificationSent: false
    };

    // Handle boolean fields
    if (deliveryData.requiresSignature) {
      deliveryRecord.requiresSignature = deliveryData.requiresSignature === 'true';
    }
    if (deliveryData.isFragile) {
      deliveryRecord.isFragile = deliveryData.isFragile === 'true';
    }
    if (deliveryData.deliveryValue) {
      deliveryRecord.deliveryValue = parseFloat(deliveryData.deliveryValue);
    }

    // Create delivery record in database
    const newDelivery = new Delivery(deliveryRecord);
    const savedDelivery = await newDelivery.save();

    // Send notification to resident
    const notificationSent = await sendNotificationToResident({
      ...deliveryRecord,
      recipientId: deliveryRecord.recipientId
    });

    // Update delivery record with notification status
    if (notificationSent) {
      savedDelivery.notificationSent = true;
      savedDelivery.notificationSentAt = new Date();
      await savedDelivery.save();
    }

    res.status(201).json({
      success: true,
      message: 'Delivery recorded successfully' + (notificationSent ? ' and notification sent to resident' : ''),
      delivery: savedDelivery,
      notificationSent
    });

  } catch (error) {
    console.error('Error creating delivery record:', error);
    
    // Clean up uploaded file if there was an error
    if (files && files.image) {
      const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
      if (fs.existsSync(imageFile.filepath)) {
        fs.unlinkSync(imageFile.filepath);
      }
    }

    res.status(500).json({ 
      error: 'Failed to create delivery record',
      details: error.message 
    });
  }
}
