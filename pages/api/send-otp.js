import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { phoneNumber } = req.body;

    // Accessing Twilio credentials from environment variables
    const client = new twilio(
      process.env.TWILIO_ACCOUNT_SID, 
      process.env.TWILIO_AUTH_TOKEN
    );
    try {
      // Send OTP request using Twilio
      const verification = await client.verify.services(process.env.TWILIO_SERVICE_SID)
        .verifications.create({ to: phoneNumber, channel: 'sms' });

      if (verification.sid) {
        res.status(200).json({ success: true, verificationId: verification.sid });
      } else {
        res.status(400).json({ success: false, message: 'Failed to send OTP' });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
}
