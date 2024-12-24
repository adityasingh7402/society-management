// pages/api/send-otp.js
import { getAuth, signInWithPhoneNumber } from 'firebase/auth';
import firebaseApp from '../../lib/firebase'; // Assuming firebaseApp is initialized

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { phoneNumber, appVerifier } = req.body; // Use appVerifier passed from the client

  try {
    const auth = getAuth(firebaseApp);
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

    res.status(200).json({ success: true, verificationId: confirmationResult.verificationId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
}
