import Head from 'next/head';
import { useState, useEffect } from 'react';
import { FaPhoneAlt } from "react-icons/fa";
import Link from 'next/link';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../lib/firebase'; // Importing the auth instance

export default function Enroll() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    societyName: '',
    societyType: '',
    managerName: '',
    managerPhone: '',
    managerEmail: '',
    societyAddress: '',
    zipCode: '',
    description: '',
    societyImages: null,
    otp: '',
    verificationId: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false); // Added loading state
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);

  useEffect(() => {
    // Enable appVerificationDisabledForTesting for testing purposes
    if (auth) {
      auth.settings.appVerificationDisabledForTesting = true;
    }

    // Initialize RecaptchaVerifier for testing (can be 'normal' or 'invisible')
    const verifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',  // You can choose 'normal', 'invisible' or 'compact'
      callback: (response) => {
        console.log('Recaptcha verified:', response);
      },
      'expired-callback': () => {
        console.log('Recaptcha expired');
      },
    }, auth);
  }, []);

  const handleNext = () => setCurrentStep(currentStep + 1);
  const handleBack = () => setCurrentStep(currentStep - 1);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFormData({ ...formData, societyImages: e.target.files });

  // Send OTP using Firebase authentication
  const handleOtpSend = async () => {
    if (!recaptchaVerifier) {
      alert("reCAPTCHA not initialized");
      return;
    }

    const phoneNumber = `+91${formData.managerPhone}`;
    setLoadingOtp(true); // Show loading state while OTP is being sent

    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setFormData({ ...formData, verificationId: confirmationResult.verificationId });
      setOtpSent(true); // OTP sent successfully, allow OTP input
      setLoadingOtp(false); // Hide loading state once OTP is sent
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Failed to send OTP. Please try again.");
      setLoadingOtp(false); // Hide loading state in case of error
    }
  };

  // Verify OTP and Submit data
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.otp || formData.otp.length < 6) {
      alert('Please enter a valid OTP.');
      return;
    }

    // Verify OTP with the backend API
    const otpResponse = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otp: formData.otp,
        verificationId: formData.verificationId,
      }),
    });

    const otpData = await otpResponse.json();

    if (otpData.success) {
      // Proceed with the society data submission
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('societyName', formData.societyName);
      formDataToSubmit.append('societyType', formData.societyType);
      formDataToSubmit.append('managerName', formData.managerName);
      formDataToSubmit.append('managerPhone', formData.managerPhone);
      formDataToSubmit.append('managerEmail', formData.managerEmail);
      formDataToSubmit.append('societyAddress', formData.societyAddress);
      formDataToSubmit.append('zipCode', formData.zipCode);
      formDataToSubmit.append('description', formData.description);
      formDataToSubmit.append('societyImages', formData.societyImages[0]);

      const societyResponse = await fetch('/api/society', {
        method: 'POST',
        body: formDataToSubmit,
      });

      const societyData = await societyResponse.json();

      if (societyData.success) {
        alert('Society enrolled successfully!');
        // Optionally, reset form or navigate
      } else {
        alert('Failed to save society data.');
      }
    } else {
      alert('OTP verification failed. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Head>
        <title>Enroll Your Society - Society Management System</title>
        <meta name="description" content="Enroll your society in our management system and get started!" />
        <script>window.flutterfire_web_sdk_version = '9.22.1';</script>
      </Head>

      {/* Header Section */}
      <header className="bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">SocietyManage</h1>
          <nav>
            <ul className="flex space-x-6">
              <Link href={"/"}><div className="hover:underline text-lg font-medium">Home</div></Link>
              <Link href={"/contact"}><div className="hover:underline text-lg font-medium">Contact</div></Link>
            </ul>
          </nav>
        </div>
      </header>

      {/* Enrollment Section */}
      <section className="py-20 bg-gray-100 min-h-screen">
        <div className="container mx-auto px-6">
          <div className="text-center mb-3 lg:mb-10">
            <h2 className="text-4xl font-bold text-blue-600 mb-5">Enroll Your Society</h2>
            <p className="text-lg">Fill out the form step-by-step to enroll your society.</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="relative pt-1 pb-3">
              <div className="flex mb-2 items-center justify-between">
                <div className="flex text-xs mr-2 font-semibold uppercase w-1/4 items-center justify-center">
                  <span>Step 1</span>
                </div>
                <div className="flex text-xs mr-2 font-semibold uppercase w-1/4 items-center justify-center">
                  <span>Step 2</span>
                </div>
                <div className="flex text-xs mr-2 font-semibold uppercase w-1/4 items-center justify-center">
                  <span>Step 3</span>
                </div>
                <div className="flex text-xs mr-2 font-semibold uppercase w-1/4 items-center justify-center">
                  <span>Submit</span>
                </div>
              </div>
              <div className="flex mb-2">
                <div className={`flex w-1/4 items-center justify-center h-2 rounded-lg bg-blue-600 ${currentStep >= 1 ? "w-full" : ""}`} />
                <div className={`flex w-1/4 items-center justify-center h-2 rounded-lg ${currentStep >= 2 ? "bg-blue-600" : "bg-gray-300"}`} />
                <div className={`flex w-1/4 items-center justify-center h-2 rounded-lg ${currentStep >= 3 ? "bg-blue-600" : "bg-gray-300"}`} />
                <div className={`flex w-1/4 items-center justify-center h-2 rounded-lg ${currentStep === 4 ? "bg-blue-600" : "bg-gray-300"}`} />
              </div>
            </div>
          </div>

          {/* Form Sections */}
          <div className="bg-white shadow-lg rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1 - Basic Information */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  <div className="w-full">
                    <label htmlFor="societyName" className="block text-lg font-medium text-gray-700">Society Name</label>
                    <input
                      type="text"
                      id="societyName"
                      name="societyName"
                      value={formData.societyName}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your society's name"
                    />
                  </div>
                  <div className="w-full">
                    <label htmlFor="societyType" className="block text-lg font-medium text-gray-700">Society Type</label>
                    <select
                      id="societyType"
                      name="societyType"
                      value={formData.societyType}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Society Type</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2 - Manager Details */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  <div className="w-full">
                    <label htmlFor="managerName" className="block text-lg font-medium text-gray-700">Manager's Name</label>
                    <input
                      type="text"
                      id="managerName"
                      name="managerName"
                      value={formData.managerName}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter manager's name"
                    />
                  </div>
                  <div className="w-full">
                    <label htmlFor="managerPhone" className="block text-lg font-medium text-gray-700">Manager's Phone</label>
                    <div className="flex items-center space-x-2">
                      <FaPhoneAlt />
                      <input
                        type="tel"
                        id="managerPhone"
                        name="managerPhone"
                        value={formData.managerPhone}
                        onChange={handleChange}
                        required
                        className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter manager's phone number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 - OTP Verification */}
              {currentStep === 3 && (
                <div>
                  <label htmlFor="otp" className="block text-lg font-medium text-gray-700">Enter OTP</label>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    required
                    disabled={!otpSent} // Disable until OTP is sent
                    className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter OTP"
                  />
                  <div className="mt-4">
                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={handleOtpSend}
                        disabled={loadingOtp} // Disable button while OTP is being sent
                        className={`w-full p-4 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${loadingOtp && "opacity-50"}`}
                      >
                        {loadingOtp ? "Sending OTP..." : "Send OTP"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full p-4 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Submit Society Details
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-2 text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Back
                  </button>
                )}
                {currentStep < 3 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Next
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
