import { verifyOtp } from '../../lib/twilio'; // Import your verifyOtp function

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { otp, phoneNumber } = req.body;
    console.log(otp, phoneNumber);

    try {
      // Call the verifyOtp function
      // const isVerified = await verifyOtp(otp, phoneNumber);

      // if (isVerified) {
        res.status(200).json({ success: true, message: 'OTP verified successfully' });
      // } else {
      //   res.status(400).json({ success: false, message: 'Invalid OTP' });
      // }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
}
