import twilio from 'twilio';
import connectToDatabase from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Twilio Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN;   // Twilio Auth Token
const twilioPhone = process.env.TWILIO_PHONE;      // Twilio Phone Number

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { to, message, type, residentId, flatNumber, guardName, guardPhone } = req.body;

    // Validate inputs
    if (!to || !message) {
      return res.status(400).json({ error: 'Mobile number and message are required.' });
    }

    try {
      // Initialize Twilio client
      const client = twilio(accountSid, authToken);

      // Format the message based on type
      let formattedMessage = message;
      
      if (type === 'visitor') {
        formattedMessage = `🔔 VISITOR APPROVAL: ${message}`;
      }

      // Send the message via Twilio
      const response = await client.messages.create({
        body: formattedMessage,     // Message content
        from: twilioPhone,          // Twilio phone number
        to,                         // Recipient mobile number
      });

      // Log the message in the database
      const { db } = await connectToDatabase();
      
      await db.collection('securityMessages').insertOne({
        residentId: residentId ? new ObjectId(residentId) : null,
        flatNumber,
        phoneNumber: to,
        message: formattedMessage,
        type: type || 'visitor',
        guardName,
        guardPhone,
        sentAt: new Date(),
        twilioSid: response.sid,
        status: response.status
      });

      res.status(200).json({ 
        success: true, 
        messageSid: response.sid,
        status: response.status 
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}