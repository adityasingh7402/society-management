import connectToDatabase from '../../../lib/mongodb';
import Visitor from '../../../models/Visitor';
import Resident from '../../../models/Resident';
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

// Helper function to send notifications using direct FCM
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
          title: visitorData.title || 'Visitor Update',
          body: visitorData.body || `Visitor: ${visitorData.visitorName}\\nStatus: ${visitorData.status}`,
          visitorId: visitorData.visitorId || '',
          type: 'visitor_status_update',
          guardName: visitorData.guardName || '',
          guardPhone: visitorData.guardPhone || '',
          visitorName: visitorData.visitorName || '',
          visitorReason: visitorData.visitorReason || '',
          status: visitorData.status || '',
          entryTime: visitorData.entryTime ? (typeof visitorData.entryTime === 'string' ? visitorData.entryTime : visitorData.entryTime.toISOString ? visitorData.entryTime.toISOString() : visitorData.entryTime.toString()) : '',
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Visitor ID is required' 
      });
    }

    await connectToDatabase();

    // Find the visitor
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return res.status(404).json({ success: false, error: 'Visitor not found' });
    }

    // Send notifications (non-blocking)
    const notificationPromise = sendNotificationToResident(visitor.residentId, {
      title: 'Visitor Status Update',
      body: `Your visitor ${visitor.visitorName || 'Unknown'} has been ${visitor.status || 'processed'}.\\nReason: ${visitor.visitorReason || 'Not specified'}`,
      visitorName: visitor.visitorName || '',
      visitorReason: visitor.visitorReason || '',
      guardName: visitor.guardName || '',
      guardPhone: visitor.guardPhone || '',
      entryTime: visitor.entryTime ? (visitor.entryTime.toISOString ? visitor.entryTime.toISOString() : visitor.entryTime.toString()) : '',
      visitorImage: visitor.visitorImage || '',
      visitorId: visitor._id.toString(),
      status: visitor.status || ''
    });

    // Don't wait for notification to complete
    notificationPromise.catch(error => {
      console.error('Notification failed (non-blocking):', error);
    });

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully to resident'
    });

  } catch (error) {
    console.error('Error in notification sending:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      details: error.message
    });
  }
}
