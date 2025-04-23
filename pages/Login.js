import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone, User, Home, MessageSquare, ChevronRight, UserCheck, Building, Check, AlertCircle, X } from 'lucide-react';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [userType, setUserType] = useState('resident'); // "resident" or "tenant"
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    message: ''
  });
  const [fcmToken, setFcmToken] = useState('Hello');

  // Add FCM token handler
  useEffect(() => {
    const token = localStorage.getItem('fcmToken');
    if (token) {
      setFcmToken(token);
      console.log("FCM token retrieved from localStorage:", token);
    }
  }, []);

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

  // Notification animation variants
  const notificationVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 120 
      }
    },
    exit: { 
      opacity: 0, 
      y: -50,
      transition: { 
        duration: 0.3 
      }
    }
  };

  const handleOtpSend = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Please enter a valid 10-digit mobile number.'
      });
      return;
    }

    const fullPhoneNumber = `+91${phoneNumber}`;
    setLoadingOtp(true);

    try {
      const response = await axios.post('/api/send-otp', { phoneNumber: fullPhoneNumber });

      if (response.data.success) {
        setVerificationId(response.data.sessionId); // Changed from verificationId to sessionId
        setOtpSent(true);
        setNotification({
          show: true,
          type: 'success',
          message: 'OTP sent successfully!'
        });
      } else {
        setNotification({
          show: true,
          type: 'error',
          message: 'Failed to send OTP. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Error sending OTP. Please try again.'
      });
    }
    setLoadingOtp(false);
  };

  const handleLogin = async () => {
    if (!otp || otp.length < 6) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Please enter a valid OTP.'
      });
      return;
    }

    try {
      const verifyResponse = await axios.post('/api/verify-otp', {
        otp,
        phoneNumber: `+91${phoneNumber}`,
        sessionId: verificationId, // Changed from verificationId to sessionId
      });

      if (verifyResponse.data.success) {
        const detailsEndpoint =
          userType === 'resident'
            ? '/api/Resident-Api/get-resident'
            : '/api/Tenant-Api/get-tenant';

        const detailsResponse = await axios.post(detailsEndpoint, {
          phoneNumber: `+91${phoneNumber}`,
          fcmToken: fcmToken  // Add FCM token to the request
        });

        if (detailsResponse.data.success) {
          const { details, token } = detailsResponse.data;
          localStorage.setItem(userType === 'resident' ? 'Resident' : 'Tenant', token);
          
          // Remove this section since we're now handling FCM token in the initial request
          // if (fcmToken) {
          //   try {
          //     await axios.post(`/api/${userType === 'resident' ? 'Resident' : 'Tenant'}-Api/update-fcm`, {
          //       phoneNumber: `+91${phoneNumber}`,
          //       fcmToken: fcmToken
          //     });
          //   } catch (error) {
          //     console.error('Error updating FCM token:', error);
          //   }
          // }

          setNotification({
            show: true,
            type: 'success',
            message: 'Login successful! Redirecting to dashboard...'
          });
          setTimeout(() => {
            window.location.href = userType === 'resident' ? '/Resident-dashboard' : '/Tenant-dashboard';
          }, 1500);
        } else {
          setNotification({
            show: true,
            type: 'error',
            message: `${userType === 'resident' ? 'Resident' : 'Tenant'} details not found. Please try again.`
          });
        }
      } else {
        setNotification({
          show: true,
          type: 'error',
          message: 'Invalid OTP. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error verifying OTP or fetching user details:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'An error occurred. Please try again.'
      });
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Head>
        <title>Login - SocietyManage</title>
        <meta name="description" content="Login to your account using mobile number and OTP." />
      </Head>

      {/* Notification Popup */}
      <AnimatePresence>
        {notification.show && (
          <motion.div 
            className="fixed top-[7rem] left-0 right-0 mx-auto z-50 px-6 py-4 rounded-lg shadow-lg flex items-center max-w-md w-11/12 sm:w-full"
            style={{
              margin: '0 auto',
              backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
              borderLeft: notification.type === 'success' ? '4px solid #22c55e' : '4px solid #ef4444'
            }}
            variants={notificationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div 
              className="rounded-full p-2 mr-3"
              style={{
                backgroundColor: notification.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: notification.type === 'success' ? '#16a34a' : '#dc2626'
              }}
            >
              {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-1">
              <h3 
                className="font-medium"
                style={{ color: notification.type === 'success' ? '#166534' : '#991b1b' }}
              >
                {notification.type === 'success' ? 'Success' : 'Error'}
              </h3>
              <p 
                className="text-sm"
                style={{ color: notification.type === 'success' ? '#15803d' : '#b91c1c' }}
              >
                {notification.message}
              </p>
            </div>
            <button 
              onClick={() => setNotification({ ...notification, show: false })}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section with Animation */}
      <motion.header 
        className="bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-white shadow-lg sticky top-0 z-50"
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
                <Link href="/Resident-dashboard" className="hover:underline text-lg font-medium flex items-center">
                  <Home size={18} className="mr-1" />
                  <span>Dashboard</span>
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
          className="absolute top-20 left-20 w-64 h-64 bg-indigo-200 rounded-full opacity-20"
          animate={{ 
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-200 rounded-full opacity-20"
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
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-4 px-6">
              <h2 className="text-2xl font-bold text-center text-white">Welcome Back</h2>
            </div>
            
            <motion.div 
              className="p-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* User Type Selection */}
              <motion.div className="mb-6" variants={itemVariants}>
                <label className="block text-lg font-medium text-gray-700 mb-2 flex items-center">
                  <User size={20} className="mr-2 text-indigo-600" />
                  User Type
                </label>
                <div className="relative">
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="resident">Resident</option>
                    <option value="tenant">Tenant</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    {userType === 'resident' ? 
                      <Building size={20} className="text-indigo-500" /> : 
                      <UserCheck size={20} className="text-indigo-500" />
                    }
                  </div>
                </div>
              </motion.div>

              {/* Phone Number Input */}
              {!otpSent ? (
                <>
                  <motion.div variants={itemVariants}>
                    <label htmlFor="phoneNumber" className="block text-lg font-medium text-gray-700 mb-2 flex items-center">
                      <Phone size={20} className="mr-2 text-indigo-600" />
                      Mobile Number
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                      <div className="bg-indigo-100 py-2 px-3 rounded-md mr-3 text-indigo-800 font-medium">+91</div>
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
                    className={`mt-6 w-full py-3 text-white rounded-lg flex items-center justify-center ${loadingOtp ? 'bg-gray-400' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}
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
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={`Enter the 6-digit OTP ${fcmToken}`}
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        OTP sent to +91 {phoneNumber}
                      </p>
                    </div>
                  </motion.div>

                  <motion.button
                    type="button"
                    onClick={handleLogin}
                    className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Login
                  </motion.button>
                  
                  <motion.button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="mt-3 w-full py-2 text-indigo-600 bg-transparent border border-indigo-600 rounded-lg"
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
                <Link
                  href={userType === 'resident' ? '/Enroll-Resident' : '/Enroll-Tenants'}
                >
                  <motion.span
                    className="text-indigo-600 hover:underline font-medium ml-1 inline-flex items-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    Enroll as {userType === 'resident' ? 'Resident' : 'Tenant'}
                    <ChevronRight size={16} className="ml-1" />
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <motion.footer 
        className="bg-slate-900 text-white py-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} SocietyManage. All rights reserved.</p>
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