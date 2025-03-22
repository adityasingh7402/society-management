import Head from 'next/head';
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, Building, Home, MessageSquare, ChevronRight } from 'lucide-react';

export default function SocietyLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [verificationId, setVerificationId] = useState('');

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

  const handleOtpSend = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullPhoneNumber = `+91${phoneNumber}`;
    setLoadingOtp(true);

    try {
      const response = await axios.post('/api/send-otp', { phoneNumber: fullPhoneNumber });

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
      // Step 1: Verify OTP
      const response = await axios.post('/api/verify-otp', {
        otp,
        phoneNumber: `+91${phoneNumber}`,
        verificationId,
      });

      if (response.data.success) {
        // Step 2: Fetch Society Details
        const societyResponse = await axios.post('/api/get-society', {
          phoneNumber: `+91${phoneNumber}`,
        });

        if (societyResponse.data.success) {
          const { society, token } = societyResponse.data;

          // Step 3: Store JWT Token in LocalStorage
          localStorage.setItem('Society', token);

          // Redirect to the dashboard
          window.location.href = '/Society-dashboard';
        } else {
          alert('Society details not found. Please try again.');
        }
      } else {
        alert('Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP or fetching society details:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Head>
        <title>Society Login - SocietyManage</title>
        <meta name="description" content="Society login using mobile number and OTP." />
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
                <Link href="/" className="hover:underline text-lg font-medium flex items-center">
                  <Home size={18} className="mr-1" />
                  <span>Home</span>
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
            className="max-w-lg mx-auto bg-white shadow-xl rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-4 px-6">
              <h2 className="text-2xl font-bold text-center text-white">Society Login</h2>
            </div>
            
            <motion.div 
              className="p-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Society Icon */}
              <motion.div 
                className="flex justify-center mb-6"
                variants={itemVariants}
              >
                <div className="p-4 bg-blue-100 rounded-full">
                  <Building size={40} className="text-blue-600" />
                </div>
              </motion.div>

              {/* Phone Number Input */}
              {!otpSent ? (
                <>
                  <motion.div variants={itemVariants}>
                    <label htmlFor="phoneNumber" className="block text-lg font-medium text-gray-700 mb-2 flex items-center">
                      <Phone size={20} className="mr-2 text-blue-600" />
                      Mobile Number
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                      <div className="bg-blue-100 py-2 px-3 rounded-md mr-3 text-blue-800 font-medium">+91</div>
                      <input
                        type="tel"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="flex-1 focus:outline-none"
                        placeholder="Enter your 10-digit number"
                      />
                    </div>
                  </motion.div>
                  
                  <motion.button
                    type="button"
                    onClick={handleOtpSend}
                    disabled={loadingOtp}
                    className={`mt-6 w-full py-3 text-white rounded-lg flex items-center justify-center ${loadingOtp ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}
                    variants={buttonVariants}
                    whileHover={!loadingOtp ? "hover" : "disabled"}
                    whileTap={!loadingOtp ? "tap" : "disabled"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {loadingOtp ? (
                      <>
                        <motion.div 
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send OTP
                        <ChevronRight size={18} className="ml-1" />
                      </>
                    )}
                  </motion.button>
                </>
              ) : (
                <>
                  {/* OTP Input */}
                  <motion.div variants={itemVariants}>
                    <label htmlFor="otp" className="block text-lg font-medium text-gray-700 mb-2">
                      Enter OTP
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter the 6-digit OTP"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        OTP sent to +91 {phoneNumber}
                      </p>
                    </div>
                  </motion.div>

                  <motion.button
                    type="button"
                    onClick={handleLogin}
                    className="mt-6 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Login
                  </motion.button>
                  
                  <motion.button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="mt-3 w-full py-2 text-blue-600 bg-transparent border border-blue-600 rounded-lg"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Change Phone Number
                  </motion.button>
                </>
              )}

              {/* Enrollment Link */}
              <motion.div 
                className="text-center flex justify-end items-center mt-6"
                variants={itemVariants}
              >
                <p className="text-gray-700">Not registered yet? </p>
                <Link href={'/Enroll-society'}>
                  <motion.span
                    className="text-blue-600 hover:underline font-medium ml-1 inline-flex items-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    Enroll Society
                    <ChevronRight size={16} className="ml-1" />
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>
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