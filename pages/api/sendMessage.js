import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Twilio Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN;   // Twilio Auth Token
const twilioPhone = process.env.TWILIO_PHONE;      // Twilio Phone Number

const client = twilio(accountSid, authToken);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { to, message } = req.body;

    // Validate inputs
    if (!to || !message) {
      return res.status(400).json({ error: 'Mobile number and message are required.' });
    }

    try {
      const response = await client.messages.create({
        body: message,     // Message content
        from: twilioPhone, // Twilio phone number
        to,                // Recipient mobile number
      });

      res.status(200).json({ success: true, data: response });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
