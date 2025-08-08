import connectToDatabase from '../../../lib/mongodb';
import Visitor from '../../../models/Visitor';
import Resident from '../../../models/Resident'; // Make sure to import your Resident model
import admin from 'firebase-admin';
import { logSuccess, logFailure } from '../../../services/loggingService';

// Initialize Firebase Admin (do this once at the top of your file)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { 
        societyId, 
        blockName, 
        floorNumber, 
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
        entryTime, 
        exitTime, 
        CreatedBy 
      } = req.body;

      // Validate required fields
      if (!societyId || !blockName || !flatNumber || !residentId || !visitorName || !entryTime) {
        await logFailure('CREATE_VISITOR_ENTRY', req, 'Missing required fields', {
          providedFields: { 
            societyId: !!societyId, 
            blockName: !!blockName, 
            flatNumber: !!flatNumber, 
            residentId: !!residentId, 
            visitorName: !!visitorName, 
            entryTime: !!entryTime 
          },
          errorType: 'VALIDATION_ERROR'
        });
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      // Connect to the database
      await connectToDatabase();

      // Create a new visitor record
      const newVisitor = new Visitor({
        societyId,
        blockName,
        floorNumber,
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
        entryTime: new Date(entryTime),
        exitTime: exitTime ? new Date(exitTime) : null,
        CreatedBy,
        createdAt: new Date(),
        status: 'pending'
      });

      // Save the new visitor
      const savedVisitor = await newVisitor.save();

      // Find the resident to get their FCM tokens
      const resident = await Resident.findById(residentId);
      
      // If resident has FCM tokens, send notifications
      if (resident && resident.fcmTokens && resident.fcmTokens.length > 0) {
        try {
          const notifications = resident.fcmTokens.map(token => 
            admin.messaging().send({
              token: token,
              data: {
                title: 'New Visitor',
                body: `Visitor: ${visitorName}\nReason: ${visitorReason || 'Not specified'}` ,
                visitorId: savedVisitor._id.toString(),
                type: 'visitor_entry',
                guardName: guardName || '',
                guardPhone: guardPhone || '',
                visitorReason: visitorReason || '',
                entryTime: entryTime || '',
                visitorImage: savedVisitor.visitorImage || ''
              },
              android: {
                priority: 'high',
                ttl: 3600 * 1000
              }
            })
          );
          
          await Promise.all(notifications);
          console.log('Notifications sent successfully to resident');
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError);
          // We don't want to fail the whole request if notification fails
          // Just log the error and continue
        }
      } else {
        console.log('No FCM tokens found for resident, notification not sent');
      }
      console.log(notifications)

      // Log successful visitor entry creation
      await logSuccess('CREATE_VISITOR_ENTRY', req, {
        message: 'Visitor entry created successfully',
        visitorId: savedVisitor._id.toString(),
        visitorName: savedVisitor.visitorName,
        visitorReason: savedVisitor.visitorReason || 'Not specified',
        residentId: savedVisitor.residentId,
        societyId: savedVisitor.societyId,
        blockName: savedVisitor.blockName,
        flatNumber: savedVisitor.flatNumber,
        guardName: savedVisitor.guardName || 'Unknown',
        entryTime: savedVisitor.entryTime,
        status: savedVisitor.status,
        notificationSent: !!(resident && resident.fcmTokens && resident.fcmTokens.length > 0)
      }, savedVisitor._id.toString(), 'visitor_entry');

      res.status(201).json({ 
        success: true, 
        message: 'Visitor entry created successfully', 
        _id: savedVisitor._id, 
        visitorName: savedVisitor.visitorName 
      });
    } catch (error) {
      console.error('Error creating visitor entry:', error);
      
      // Log failure
      await logFailure('CREATE_VISITOR_ENTRY', req, 'Failed to create visitor entry', {
        errorMessage: error.message,
        errorType: error.name || 'UNKNOWN_ERROR',
        visitorName: req.body?.visitorName,
        societyId: req.body?.societyId,
        residentId: req.body?.residentId
      });
      
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error', 
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
}