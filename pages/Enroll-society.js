import Head from 'next/head';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';
import { 
  Building2, 
  User, 
  MapPin, 
  Shield, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Mail, 
  MapPinned, 
  FileText,
  Home,
  MessageSquare
} from 'lucide-react';

export default function Enroll() {
  const router = useRouter();
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
    description: '',
    otp: '',
    verificationId: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);

  const handleNext = () => setCurrentStep(currentStep + 1);
  const handleBack = () => setCurrentStep(currentStep - 1);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Button animation variants
  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" },
    tap: { scale: 0.98 },
    disabled: { opacity: 0.7 }
  };

  const steps = [
    { number: 1, title: 'Society Details', icon: Building2 },
    { number: 2, title: 'Manager Info', icon: User },
    { number: 3, title: 'Location', icon: MapPin },
    { number: 4, title: 'Verify', icon: Shield },
  ];

  // Function to handle sending OTP using Twilio
  const handleOtpSend = async () => {
    const phoneNumber = `+91${formData.managerPhone}`;
    setLoadingOtp(true);

    try {
      const response = await axios.post('/api/send-otp', { phoneNumber });

      if (response.data.success) {
        setFormData({ ...formData, verificationId: response.data.verificationId });
        setOtpSent(true);
        alert('OTP sent successfully!');
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
          phoneNumber: `+91${formData.managerPhone}`,
          verificationId: formData.verificationId,
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
    <div className="bg-slate-50 min-h-screen">
      <Head>
        <title>Enroll Your Society - SocietyManage</title>
        <meta name="description" content="Enroll your society in our management system and get started!" />
      </Head>

      {/* Header Section with Animation */}
      <motion.header 
        className="bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-white shadow-lg sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href={"/"}>
            <motion.h1 
              className="sm:text-xl md:text-3xl font-bold"
              whileHover={{ scale: 1.05 }}
            >
              SocietyManage
            </motion.h1>
          </Link>
          <nav>
            <ul className="flex space-x-6">
              <motion.li whileHover={{ scale: 1.1 }}>
                <Link href="/societyLogin" className="hover:underline text-lg font-medium flex items-center">
                  <User size={18} className="mr-1" />
                  <span>Login</span>
                </Link>
              </motion.li>
              <motion.li whileHover={{ scale: 1.1 }}>
                <Link href="/Contact" className="hover:underline text-lg font-medium flex items-center">
                  <MessageSquare size={18} className="mr-1" />
                  <span>Contact</span>
                </Link>
              </motion.li>
            </ul>
          </nav>
        </div>
      </motion.header>

      {/* Enrollment Section */}
      <section className="py-20 min-h-screen relative overflow-hidden">
        {/* Background decoration elements */}
        <motion.div 
          className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full opacity-20"
          animate={{ 
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-200 rounded-full opacity-20"
          animate={{ 
            y: [0, 30, 0],
            x: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl font-bold text-blue-600 mb-4">Enroll Your Society</h2>
            <p className="text-lg text-gray-600">Fill out the form step-by-step to enroll your society.</p>
          </motion.div>

          {/* Steps Progress */}
          <motion.div 
            className="max-w-4xl mx-auto mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex justify-between relative">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div 
                    key={step.number} 
                    className="flex flex-col items-center relative z-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                  >
                    <motion.div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${currentStep >= step.number ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-6 h-6" />
                    </motion.div>
                    <p className={`mt-2 text-sm font-medium ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                  </motion.div>
                );
              })}
              {/* Progress line */}
              <div className="absolute top-6 left-0 h-0.5 bg-gray-200 w-full -z-10">
                <motion.div
                  className="h-full bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div 
            className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-4 px-6">
              <h3 className="text-xl font-bold text-center text-white">
                {currentStep === 1 && "Society Details"}
                {currentStep === 2 && "Manager Information"}
                {currentStep === 3 && "Society Location"}
                {currentStep === 4 && "Verification"}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit}>
              <motion.div 
                className="p-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key={currentStep} // This forces re-render of animation when step changes
              >
                {/* Step 1 - Society Details */}
                {currentStep === 1 && (
                  <>
                    <motion.div className="flex justify-center mb-6" variants={itemVariants}>
                      <div className="p-4 bg-blue-100 rounded-full">
                        <Building2 size={40} className="text-blue-600" />
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="mb-6">
                      <label className="block text-gray-700 font-medium mb-2">
                        Society Name
                      </label>
                      <input
                        type="text"
                        name="societyName"
                        value={formData.societyName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter society name"
                      />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <label className="block text-gray-700 font-medium mb-2">
                        Society Type
                      </label>
                      <select
                        name="societyType"
                        value={formData.societyType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select type</option>
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="mixed">Mixed Use</option>
                      </select>
                    </motion.div>
                  </>
                )}

                {/* Step 2 - Manager Details */}
                {currentStep === 2 && (
                  <>
                    <motion.div className="flex justify-center mb-6" variants={itemVariants}>
                      <div className="p-4 bg-blue-100 rounded-full">
                        <User size={40} className="text-blue-600" />
                      </div>
                    </motion.div>

                    <motion.div className="mb-6" variants={itemVariants}>
                      <label className="block text-gray-700 font-medium mb-2 flex items-center">
                        <User className="inline-block w-5 h-5 mr-2 text-blue-600" />
                        Manager's Name
                      </label>
                      <input
                        type="text"
                        name="managerName"
                        value={formData.managerName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter manager's name"
                      />
                    </motion.div>

                    <motion.div className="mb-6" variants={itemVariants}>
                      <label className="block text-gray-700 font-medium mb-2 flex items-center">
                        <Phone className="inline-block w-5 h-5 mr-2 text-blue-600" />
                        Phone Number
                      </label>
                      <div className="flex items-center border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                        <div className="bg-blue-100 py-2 px-3 rounded-md mr-3 text-blue-800 font-medium">+91</div>
                        <input
                          type="tel"
                          name="managerPhone"
                          value={formData.managerPhone}
                          onChange={handleChange}
                          className="flex-1 focus:outline-none"
                          placeholder="Enter 10-digit phone number"
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <label className="block text-gray-700 font-medium mb-2 flex items-center">
                        <Mail className="inline-block w-5 h-5 mr-2 text-blue-600" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="managerEmail"
                        value={formData.managerEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter email address"
                      />
                    </motion.div>
                  </>
                )}

                {/* Step 3 - Location */}
                {currentStep === 3 && (
                  <>
                    <motion.div className="flex justify-center mb-6" variants={itemVariants}>
                      <div className="p-4 bg-blue-100 rounded-full">
                        <MapPin size={40} className="text-blue-600" />
                      </div>
                    </motion.div>

                    <motion.div className="mb-6" variants={itemVariants}>
                      <label className="block text-gray-700 font-medium mb-2 flex items-center">
                        <MapPinned className="inline-block w-5 h-5 mr-2 text-blue-600" />
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter street address"
                      />
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <motion.div variants={itemVariants}>
                        <label className="block text-gray-700 font-medium mb-2">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter city"
                        />
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <label className="block text-gray-700 font-medium mb-2">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter state"
                        />
                      </motion.div>
                    </div>

                    <motion.div className="mb-6" variants={itemVariants}>
                      <label className="block text-gray-700 font-medium mb-2">ZIP Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter ZIP code"
                      />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <label className="block text-gray-700 font-medium mb-2 flex items-center">
                        <FileText className="inline-block w-5 h-5 mr-2 text-blue-600" />
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe your society..."
                      />
                    </motion.div>
                  </>
                )}

                {/* Step 4 - Verification */}
                {currentStep === 4 && (
                  <>
                    <motion.div className="flex justify-center mb-6" variants={itemVariants}>
                      <div className="p-4 bg-blue-100 rounded-full">
                        <Shield size={40} className="text-blue-600" />
                      </div>
                    </motion.div>

                    {!otpSent ? (
                      <motion.div className="text-center" variants={itemVariants}>
                        <h3 className="text-xl font-semibold mb-4">Verify Your Phone Number</h3>
                        <p className="text-gray-600 mb-6">
                          We'll send a verification code to: <br />
                          <span className="font-semibold">+91 {formData.managerPhone}</span>
                        </p>
                        <motion.button
                          type="button"
                          onClick={handleOtpSend}
                          disabled={loadingOtp}
                          className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${loadingOtp ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}
                          variants={buttonVariants}
                          whileHover={!loadingOtp ? "hover" : "disabled"}
                          whileTap={!loadingOtp ? "tap" : "disabled"}
                        >
                          {loadingOtp ? (
                            <>
                              <motion.div 
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 inline-block"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                              Sending Code...
                            </>
                          ) : (
                            <>
                              Send Verification Code
                              <ChevronRight size={18} className="ml-1 inline-block" />
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div variants={itemVariants}>
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
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-wider"
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                        />
                      </motion.div>
                    )}
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  {currentStep > 1 ? (
                    <motion.button
                      type="button"
                      onClick={handleBack}
                      className="flex items-center px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Back
                    </motion.button>
                  ) : (
                    <div></div> // Empty div to maintain flexbox spacing
                  )}
                  
                  {currentStep < 4 ? (
                    <motion.button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg transition-all"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      Next
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </motion.button>
                  ) : (
                    otpSent && (
                      <motion.button
                        type="submit"
                        className="flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg transition-all"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        Submit
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </motion.button>
                    )
                  )}
                </div>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </section>

      <motion.footer 
        className="bg-gray-800 text-white py-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} Society Management System. All rights reserved.</p>
          <motion.nav className="flex justify-center space-x-6 mt-4">
            <Link href="/">
              <motion.span className="hover:underline flex items-center" whileHover={{ scale: 1.1 }}>
                <Home size={16} className="mr-1" />
                Home
              </motion.span>
            </Link>
            <Link href="/societyLogin">
              <motion.span className="hover:underline flex items-center" whileHover={{ scale: 1.1 }}>
                <User size={16} className="mr-1" />
                Login
              </motion.span>
            </Link>
            <Link href="/contact">
              <motion.span className="hover:underline flex items-center" whileHover={{ scale: 1.1 }}>
                <MessageSquare size={16} className="mr-1" />
                Contact
              </motion.span>
            </Link>
          </motion.nav>
        </div>
      </motion.footer>
    </div>
  );
}