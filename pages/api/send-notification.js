import connectToDatabase from '../../lib/mongodb';
import Resident from '../../models/Resident';
import admin from 'firebase-admin';

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

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const {
        residentId,
        visitorId,
        visitorName,
        guardName,
        guardPhone,
        visitorReason,
        entryTime
      } = req.body;
      console.log('Received request body:', req.body); // Log the request body for diagnostic

      // Validate required fields
      //   if (!residentId || !visitorName) {
      //     return res.status(400).json({ 
      //       success: false, 
      //       error: 'Missing required fields' 
      //     });
      //   }

      await connectToDatabase();

      // Find the resident to get their FCM tokens
      const resident = await Resident.findOne({ _id: residentId });

      console.log('Resident found:', {
        name: resident?.name,
        phone: resident?.phone,
        fcmTokens: resident?.fcmTokens
      });

      if (!resident) {
        return res.status(404).json({
          success: false,
          error: 'Resident not found'
        });
      }

      if (!resident.fcmTokens || resident.fcmTokens.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No FCM tokens found for resident'
        });
      }

      // Send notifications to all devices
      const notifications = resident.fcmTokens.map(token => 
        admin.messaging().send({
          token: token,
          data: {
            title: 'New Visitor',
            body: `Visitor: ${visitorName}\nReason: ${visitorReason || 'Not specified'}`,
            visitorId: visitorId.toString(),
            type: 'visitor_entry',
            guardName: guardName || '',
            guardPhone: guardPhone || '',
            visitorReason: visitorReason || '',
            entryTime: entryTime || '',
            visitorImage: 'https://res.cloudinary.com/dl8njpec6/image/upload/v1743668331/ewpk09ewfg9maqwfrrxt.jpg'
          },
          android: {
            priority: 'high',
            ttl: 3600 * 1000
          }
        })
      );

      console.log('Sending notifications to:', resident.fcmTokens);
      console.log('Notifications:', notifications);

      await Promise.all(notifications);

      res.status(200).json({
        success: true,
        message: 'Notifications sent successfully'
      });
    } catch (error) {
      console.error('Error sending notifications:', error);
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