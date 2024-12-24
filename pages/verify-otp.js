// pages/otp-verification.js
import { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../lib/firebase'; // Assuming you already have the Firebase config set

export default function OTPVerification() {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    otp: '',
    verificationId: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);

  useEffect(() => {
    // Initialize reCAPTCHA verifier once when the component mounts
    const verifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
      callback: (response) => {
        console.log('reCAPTCHA verified:', response);
      },
    }, auth);
    setRecaptchaVerifier(verifier);
  }, []);

  const handlePhoneNumberSubmit = async () => {
    try {
      if (!recaptchaVerifier) {
        alert('reCAPTCHA not initialized');
        return;
      }

      const phoneNumber = `+91${formData.phoneNumber}`; // Add country code if necessary
      setLoadingOtp(true);

      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          appVerifier: recaptchaVerifier, // Send reCAPTCHA verifier to backend
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFormData({ ...formData, verificationId: data.verificationId });
        setOtpSent(true);
      } else {
        alert('Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Error sending OTP');
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: formData.otp,
          verificationId: formData.verificationId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('OTP Verified Successfully');
        // Proceed with the next steps (e.g., redirect or show user data)
      } else {
        alert('OTP verification failed');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('Error verifying OTP');
    }
  };

  return (
    <div>
      <h1>Phone Number Verification</h1>

      <div id="recaptcha-container"></div>

      {/* Phone number input */}
      {!otpSent && (
        <div>
          <input
            type="tel"
            placeholder="Enter your phone number"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            required
          />
          <button onClick={handlePhoneNumberSubmit} disabled={loadingOtp}>
            {loadingOtp ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </div>
      )}

      {/* OTP input */}
      {otpSent && (
        <div>
          <input
            type="text"
            placeholder="Enter OTP"
            value={formData.otp}
            onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
            required
          />
          <button onClick={handleVerifyOtp}>Verify OTP</button>
        </div>
      )}
    </div>
  );
}
