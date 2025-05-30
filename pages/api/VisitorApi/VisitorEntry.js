import connectToDatabase from '../../../lib/mongodb';
import Visitor from '../../../models/Visitor';
import Resident from '../../../models/Resident'; // Make sure to import your Resident model
import admin from 'firebase-admin';

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

      // Find the resident to get their FCM token
      const resident = await Resident.findById(residentId);
      
      // If resident has an FCM token, send a notification
      if (resident && resident.fcmToken) {
        try {
          await admin.messaging().send({
            token: resident.fcmToken,
            data: {
              title: 'New Visitor',
              message: `${visitorName} is waiting at the gate`,
              visitorId: savedVisitor._id.toString()
            },
            android: {
              priority: 'high',
              notification: {
                sound: 'visitor_alert',
                channelId: 'visitor_notification_channel',
                priority: 'high',
                vibrateTimingsMillis: [0, 1000, 500, 1000, 500, 1000]
              }
            }
          });
          console.log('Notification sent successfully to resident');
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
          // We don't want to fail the whole request if notification fails
          // Just log the error and continue
        }
      } else {
        console.log('No FCM token found for resident, notification not sent');
      }

      res.status(201).json({ 
        success: true, 
        message: 'Visitor entry created successfully', 
        _id: savedVisitor._id, 
        visitorName: savedVisitor.visitorName 
      });
    } catch (error) {
      console.error('Error creating visitor entry:', error);
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