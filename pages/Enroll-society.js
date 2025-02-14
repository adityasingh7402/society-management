import Head from 'next/head';
import { useState } from 'react';
import { FaPhoneAlt } from "react-icons/fa";
import Link from 'next/link';
import axios from 'axios'; // Import axios for making requests
import { useRouter } from 'next/router'

export default function Enroll() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    societyName: '',
    societyType: '',
    managerName: '',
    managerPhone: '',
    managerEmail: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',  // Added description field
    otp: '',
    verificationId: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);

  const handleNext = () => setCurrentStep(currentStep + 1);
  const handleBack = () => setCurrentStep(currentStep - 1);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Function to handle sending OTP using Twilio
  const handleOtpSend = async () => {
    const phoneNumber = `+91${formData.managerPhone}`;
    setLoadingOtp(true);

    try {
      const response = await axios.post('/api/send-otp', { phoneNumber });

      if (response.data.success) {
        setFormData({ ...formData, verificationId: response.data.verificationId });
        setOtpSent(true);
      } else {
        alert('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Failed to send OTP. Please try again.');
    }
    setLoadingOtp(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.otp || formData.otp.length < 6) {
      alert('Please enter a valid OTP.');
      return;
    }

    try {
      // Verify OTP with backend
      const otpResponse = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: formData.otp,
          phoneNumber: `+91${formData.managerPhone}`, // Correctly format the phone number
        }),
      });

      const otpData = await otpResponse.json();

      if (otpData.success) {
        // OTP verification was successful, now proceed with submitting the society data
        const formDataToSubmit = new FormData();

        // Loop through the form data and append it to the FormData object
        Object.keys(formData).forEach((key) => {
          formDataToSubmit.append(key, formData[key]);
        });

        // Send the society data to the server
        const societyResponse = await fetch('/api/society', {
          method: 'POST',
          body: formDataToSubmit,
        });

        const societyData = await societyResponse.json();

        if (societyData.success) {
          // If the society data is successfully saved, show a success alert
          alert('Society enrolled successfully!');
          router.push('/societyLogin');
        } else {
          // If there was an error while saving the society data, show a failure alert
          alert('Failed to save society data.');
        }
      } else {
        // If OTP verification fails, show an alert for invalid OTP
        alert('OTP verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('There was an error verifying the OTP. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Head>
        <title>Enroll Your Society - Society Management System</title>
        <meta name="description" content="Enroll your society in our management system and get started!" />
      </Head>

      <header className="bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="sm:text-xl md:text-3xl font-bold">SocietyManage</h1>
          <nav>
            <ul className="flex space-x-6">
              <Link href={"/"}><div className="hover:underline text-lg font-medium">Home</div></Link>
              <Link href={"/societyLogin"}><div className="hover:underline text-lg font-medium">Login</div></Link>
            </ul>
          </nav>
        </div>
      </header>

      {/* Enrollment Section */}
      <section className="py-10 bg-gray-100 min-h-screen">
        <div className="container mx-auto px-6">
          <div className="text-center mb-3 lg:mb-10">
            <h2 className="text-4xl font-bold text-blue-600 mb-5">Enroll Your Society</h2>
            <p className="text-lg">Fill out the form step-by-step to enroll your society.</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="relative pt-1 pb-3">
              <div className="flex mb-2 items-center justify-between">
                {['Step 1', 'Step 2', 'Step 3', 'Submit'].map((step, index) => (
                  <div
                    key={index}
                    className={`flex text-xs mr-2 font-semibold uppercase w-1/4 items-center justify-center ${currentStep > index ? 'text-blue-600' : 'text-gray-400'
                      }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
              <div className="flex">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex w-1/4 items-center justify-center h-2 rounded-lg ${currentStep >= step ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                  />
                ))}
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
                    <label htmlFor="societyName" className="block text-lg font-medium text-gray-700">
                      Society Name
                    </label>
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
                    <label htmlFor="societyType" className="block text-lg font-medium text-gray-700">
                      Society Type
                    </label>
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
                    <label htmlFor="managerName" className="block text-lg font-medium text-gray-700">
                      Manager's Name
                    </label>
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
                    <label htmlFor="managerPhone" className="block text-lg font-medium text-gray-700">
                      Manager's Phone
                    </label>
                    <div className="flex items-center space-x-2">
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

                  <div className="w-full">
                    <label htmlFor="managerEmail" className="block text-lg font-medium text-gray-700">
                      Manager's Email
                    </label>
                    <input
                      type="email"
                      id="managerEmail"
                      name="managerEmail"
                      value={formData.managerEmail}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter manager's email"
                    />
                  </div>
                </div>
              )}

              {/* Step 3 - Society Address, Zip, Description */}
              {currentStep === 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  <div className="w-full">
                    <label htmlFor="street" className="block text-lg font-medium text-gray-700">
                      Street
                    </label>
                    <input
                      type="text"
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border border-gray-300 rounded-md focus:ring-blue-500"
                      placeholder="Enter street address"
                    />
                  </div>
                  <div className="w-full">
                    <label htmlFor="city" className="block text-lg font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border border-gray-300 rounded-md focus:ring-blue-500"
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="w-full">
                    <label htmlFor="state" className="block text-lg font-medium text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border border-gray-300 rounded-md focus:ring-blue-500"
                      placeholder="Enter state"
                    />
                  </div>
                  <div className="w-full">
                    <label htmlFor="pinCode" className="block text-lg font-medium text-gray-700">
                      Pin Code
                    </label>
                    <input
                      type="text"
                      id="pinCode"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border border-gray-300 rounded-md focus:ring-blue-500"
                      placeholder="Enter pin code"
                    />
                  </div>
                  <div className="w-full">
                    <label htmlFor="description" className="block text-lg font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter a description for the society"
                    />
                  </div>
                </div>
              )}


              {/* Step 4 - OTP Verification */}
              {currentStep === 4 && (
                <div>
                  {!otpSent ? (
                    <div>
                      <div className="mobile-show text-2xl text-gray-700 bg-gray-100 p-2 rounded-md shadow-md">
                        OTP sends to this no. <span className="font-bold text-gray-900">+91 {formData.managerPhone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleOtpSend}
                        disabled={loadingOtp}
                        className={`mt-4 w-full py-3 text-white rounded-md ${loadingOtp ? 'bg-gray-400' : 'bg-blue-600'}`}
                      >
                        {loadingOtp ? 'Sending OTP...' : 'Send OTP'}
                      </button>

                      {/* <label htmlFor="managerPhone" className="block text-lg font-medium text-gray-700">
                        Manager's Phone Number
                      </label>
                      <div className="flex items-center space-x-2">
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
                      <button
                        type="button"
                        onClick={handleOtpSend}
                        disabled={loadingOtp}
                        className={`mt-4 w-full py-3 text-white rounded-md ${loadingOtp ? 'bg-gray-400' : 'bg-blue-600'}`}
                      >
                        {loadingOtp ? 'Sending OTP...' : 'Send OTP'}
                      </button> */}
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="otp" className="block text-lg font-medium text-gray-700">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        id="otp"
                        name="otp"
                        value={formData.otp}
                        onChange={handleChange}
                        required
                        className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter OTP"
                      />
                      <div className="mt-4">
                        <FaPhoneAlt className="text-blue-600" /> <span className="text-blue-600">OTP has been sent to the manager's phone</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between mt-6">
                    {/* {currentStep > 1 && (
                      <button type="button" onClick={handleBack} className="bg-gray-300 text-black px-6 py-3 rounded-md">
                        Back
                      </button>
                    )} */}
                    {otpSent && (
                      <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-md">
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                {currentStep > 1 && (
                  <button type="button" onClick={handleBack} className="bg-gray-300 text-black px-6 py-3 rounded-md">Back</button>
                )}
                {currentStep < 4 && (
                  <button type="button" onClick={handleNext} className="bg-blue-600 text-white px-6 py-3 rounded-md">Next</button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
