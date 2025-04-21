import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { phoneNumber } = req.body;

    try {
      // Add headers to the axios request
      const response = await axios.get(
        `https://2factor.in/API/V1/${process.env.FACTOR2_API_KEY}/SMS/${phoneNumber}/AUTOGEN`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );

      if (response.data.Status === 'Success') {
        res.status(200).json({ success: true, sessionId: response.data.Details });
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
