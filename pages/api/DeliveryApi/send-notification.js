import connectToDatabase from '../../../lib/mongodb';
import Delivery from '../../../models/Delivery';
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { deliveryId } = req.body;

    if (!deliveryId) {
      return res.status(400).json({ success: false, error: 'Delivery ID is required' });
    }

    await connectToDatabase();

    // Find the delivery
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    // Find the resident to get their FCM tokens
    const resident = await Resident.findById(delivery.recipientId);
    if (!resident) {
      return res.status(404).json({ success: false, error: 'Recipient not found' });
    }

    if (!resident.fcmTokens || resident.fcmTokens.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No FCM tokens found for recipient'
      });
    }

    // Send notifications to all devices
    const notifications = resident.fcmTokens.map(token =>
      admin.messaging().send({
        token: token,
        data: {
          title: 'Delivery Notification',
          body: `Your delivery from ${delivery.deliveryCompany} is waiting for pickup.\nItems: ${delivery.deliveryItems}\nDelivery person: ${delivery.deliveryPersonName}`,
          deliveryId: delivery._id.toString(),
          type: 'delivery_reminder',
          deliveryCompany: delivery.deliveryCompany || '',
          deliveryPersonName: delivery.deliveryPersonName || '',
          deliveryItems: delivery.deliveryItems || '',
          deliveryType: delivery.deliveryType || '',
          deliveryTime: delivery.deliveryTime ? delivery.deliveryTime.toISOString() : '',
          receivedTime: delivery.receivedTime ? delivery.receivedTime.toISOString() : '',
          guardName: delivery.guardName || '',
          guardPhone: delivery.guardPhone || '',
          flatNumber: delivery.flatNumber || '',
          blockName: delivery.blockName || '',
          visitorImage: delivery.deliveryPersonImage || ''
        },
        android: {
          priority: 'high',
          ttl: 3600 * 1000
        }
      })
    );

    await Promise.all(notifications);

    // Update delivery to mark notification as sent
    await Delivery.findByIdAndUpdate(deliveryId, {
      notificationSent: true,
      notificationSentAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Delivery notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending delivery notification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
