// pages/api/verify-otp.js
import { getAuth, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { app } from '../../lib/firebase'; // Assuming app is initialized here

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { otp, verificationId } = req.body;

  try {
    const auth = getAuth(app); // Get the auth instance from the initialized app

    const credential = PhoneAuthProvider.credential(verificationId, otp);
    const userCredential = await signInWithCredential(auth, credential);

    res.status(200).json({ success: true, user: userCredential.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
}
