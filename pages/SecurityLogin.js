import Head from 'next/head';
import { useState } from 'react';
import axios from 'axios';
import { FaPhoneAlt } from "react-icons/fa";

export default function SecurityLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [verificationId, setVerificationId] = useState('');

  const handleOtpSend = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullPhoneNumber = `+91${phoneNumber}`;
    setLoadingOtp(true);

    try {
      const endpoint = '/api/send-otp';
      const response = await axios.post(endpoint, { phoneNumber: fullPhoneNumber });

      if (response.data.success) {
        setVerificationId(response.data.verificationId);
        setOtpSent(true);
        alert('OTP sent successfully!');
      } else {
        alert('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Error sending OTP. Please try again.');
    }
    setLoadingOtp(false);
  };

  const handleLogin = async () => {
    if (!otp || otp.length < 6) {
      alert('Please enter a valid OTP.');
      return;
    }

    try {
      const verifyEndpoint = '/api/verify-otp';
      const detailsEndpoint = '/api/Security-Api/get-security';

      // Step 1: Verify OTP
      const verifyResponse = await axios.post(verifyEndpoint, {
        otp,
        phoneNumber: `+91${phoneNumber}`,
        verificationId,
      });

      if (verifyResponse.data.success) {
        // Step 2: Fetch Security Guard Details
        const detailsResponse = await axios.post(detailsEndpoint, {
          phoneNumber: `+91${phoneNumber}`,
        });

        if (detailsResponse.data.success) {
          const { details, token } = detailsResponse.data;

          // Step 3: Store JWT Token in LocalStorage
          localStorage.setItem('Security', token);

          // Redirect to the Security Dashboard
          window.location.href = '/Security-dashboard';
        } else {
          alert('Security guard details not found. Please try again.');
        }
      } else {
        alert('Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP or fetching security guard details:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Head>
        <title>Security Login - Society Management System</title>
        <meta name="description" content="Login as a security guard using mobile number and OTP." />
      </Head>

      <header className="bg-gradient-to-r from-green-500 to-green-600 py-3 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="sm:text-xl md:text-3xl font-bold">SocietyManage - Security</h1>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <a href="/" className="hover:underline text-lg font-medium">Home</a>
              </li>
              <li>
                <a href="/contact" className="hover:underline text-lg font-medium">Contact</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <section className="py-20 min-h-screen">
        <div className="container mx-auto px-6">
          <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-8">
            <h2 className="text-2xl font-bold text-center text-green-600 mb-6">Security Login</h2>

            {!otpSent ? (
              <div>
                <label htmlFor="phoneNumber" className="block text-lg font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <div className="flex items-center border border-gray-300 rounded-md p-3">
                  <FaPhoneAlt className="text-green-600 mr-3" />
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 focus:outline-none"
                    placeholder="Enter your mobile number"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleOtpSend}
                  disabled={loadingOtp}
                  className={`mt-6 w-full py-3 text-white rounded-md ${loadingOtp ? 'bg-gray-400' : 'bg-green-600'}`}
                >
                  {loadingOtp ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div>
                {/* OTP Input */}
                <label htmlFor="otp" className="block text-lg font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter the OTP"
                />
                <button
                  type="button"
                  onClick={handleLogin}
                  className="mt-6 w-full py-3 bg-green-600 text-white rounded-md"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-6 mt-10">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2024 Society Management System. All rights reserved.</p>
          <nav className="flex justify-center space-x-6 mt-4">
            <a href="/" className="hover:underline">Home</a>
            <a href="/contact" className="hover:underline">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
