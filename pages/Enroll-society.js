import Head from 'next/head';
import { useState } from 'react';
import { FaPhoneAlt } from "react-icons/fa";
import Link from 'next/link';
import axios from 'axios'; // Import axios for making requests
import { useRouter } from 'next/router'
import { Building2, User, MapPin, Shield, ChevronLeft, ChevronRight, Phone, Mail, MapPinned, FileText } from 'lucide-react';

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

  const steps = [
    { number: 1, title: 'Society Details', icon: Building2 },
    { number: 2, title: 'Manager Info', icon: User },
    { number: 3, title: 'Location', icon: MapPin },
    { number: 4, title: 'Verify', icon: Shield },
  ];

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
          <Link href={"/"}><h1 className="sm:text-xl md:text-3xl font-bold">SocietyManage</h1></Link>
          <nav>
            <ul className="flex space-x-6">
              <a href="/societyLogin" className="hover:underline text-lg font-medium">Login</a>
              <a href="/Contact" className="hover:underline text-lg font-medium">Contact</a>
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

          <div className="mb-12">
            <div className="flex justify-between relative">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="flex flex-col items-center relative z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentStep >= step.number ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      } transition-colors duration-200`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className={`mt-2 text-sm font-medium ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                      {step.title}
                    </p>
                  </div>
                );
              })}
              {/* Progress line */}
              <div className="absolute top-6 left-0 h-0.5 bg-gray-200 w-full -z-10">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1 - Society Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Society Name
                    </label>
                    <input
                      type="text"
                      name="societyName"
                      value={formData.societyName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter society name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Society Type
                    </label>
                    <select
                      name="societyType"
                      value={formData.societyType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select type</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="mixed">Mixed Use</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2 - Manager Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        <User className="inline-block w-5 h-5 mr-2" />
                        Manager's Name
                      </label>
                      <input
                        type="text"
                        name="managerName"
                        value={formData.managerName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter manager's name"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        <Phone className="inline-block w-5 h-5 mr-2" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="managerPhone"
                        value={formData.managerPhone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      <Mail className="inline-block w-5 h-5 mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="managerEmail"
                      value={formData.managerEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              )}

              {/* Step 3 - Location */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-gray-700 font-medium mb-2">
                        <MapPinned className="inline-block w-5 h-5 mr-2" />
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter street address"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">ZIP Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter ZIP code"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-700 font-medium mb-2">
                        <FileText className="inline-block w-5 h-5 mr-2" />
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe your society..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 - Verification */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {!otpSent ? (
                    <div className="text-center">
                      <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-4">Verify Your Phone Number</h3>
                      <p className="text-gray-600 mb-6">
                        We'll send a verification code to: <br />
                        <span className="font-semibold">+91 {formData.managerPhone}</span>
                      </p>
                      <button
                        type="button"
                        onClick={handleOtpSend}
                        disabled={loadingOtp}
                        className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${loadingOtp ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                      >
                        {loadingOtp ? 'Sending Code...' : 'Send Verification Code'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold mb-2">Enter Verification Code</h3>
                        <p className="text-gray-600">
                          We've sent a code to your phone number
                        </p>
                      </div>
                      <input
                        type="text"
                        name="otp"
                        value={formData.otp}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl letter-spacing-2"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                  </button>
                )}
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors ml-auto"
                  >
                    Next
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                ) : (
                  otpSent && (
                    <button
                      type="submit"
                      className="flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors ml-auto"
                    >
                      Submit
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  )
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
