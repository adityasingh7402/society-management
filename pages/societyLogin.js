import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Building, Home, MessageSquare, ChevronRight, Check, AlertCircle, X, MapPin, Edit } from 'lucide-react';

export default function SocietyLogin() {
  const [pinCode, setPinCode] = useState('');
  const [societies, setSocieties] = useState([]);
  const [filteredSocieties, setFilteredSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingSocieties, setLoadingSocieties] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showSocietyList, setShowSocietyList] = useState(false);
  const [isPincodeValid, setIsPincodeValid] = useState(false);
  const [societySearchQuery, setSocietySearchQuery] = useState('');

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

  // Notification popup variants
  const notificationVariants = {
    hidden: {
      y: -100,
      opacity: 0,
      scale: 0.8
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    },
    exit: {
      y: -100,
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.3
      }
    }
  };

  // Auto-hide notification after delay
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Show notification helper function
  const showNotification = (type, message, duration = 5000) => {
    setNotification({
      show: true,
      type,
      message
    });

    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const handlePincodeChange = async (e) => {
    const { value } = e.target;
    setPinCode(value.replace(/\D/g, '').slice(0, 6));

    // Basic pincode validation
    if (value.length === 6 && /^\d+$/.test(value)) {
      setIsPincodeValid(true);
      setLoadingSocieties(true);
      try {
        const response = await axios.get(`/api/societies-login?pinCode=${value}`);
        if (response.data.success) {
          setSocieties(response.data.societies || []);
          setFilteredSocieties(response.data.societies || []);setShowSocietyList(true);
        } else {
          showNotification('error', 'Failed to fetch societies'
          );
        }
      } catch (error) {
        console.error("Failed to fetch societies", error);
        showNotification('error', 'Failed to fetch societies for this pincode');
      }
      setLoadingSocieties(false);
    } else {
      setIsPincodeValid(false);
      setShowSocietyList(false);
      setSocieties([]);
      setFilteredSocieties([]);
    }
  };

  const handleSocietySearch = (e) => {
    const { value } = e.target;
    setSocietySearchQuery(value);
    if (societies.length > 0) {
      const filtered = societies.filter(society =>
        society.societyName.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSocieties(filtered);
      setShowSocietyList(true);
    }
  };

  const handleSocietySelect = (society) => {
    setSelectedSociety(society);
    setShowSocietyList(false);
    setSocietySearchQuery('');
  };

  const fetchSocieties = async () => {
    if (!pinCode || pinCode.length !== 6) {
      showNotification('error', 'Please enter a valid 6-digit PIN code');
      return;
    }

    setLoadingSocieties(true);
    try {
      const response = await axios.get(`/api/societies?pinCode=${pinCode}`);
      if (response.data.success) {
        setSocieties(response.data.societies);
        if (response.data.societies.length === 0) {
          showNotification('error', 'No societies found with this PIN code');
        }
      } else {
        showNotification('error', 'Failed to fetch societies');
      }
    } catch (error) {
      console.error('Error fetching societies:', error);
      showNotification('error', 'Error fetching societies');
    }
    setLoadingSocieties(false);
  };

  const handleOtpSend = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      showNotification('error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!selectedSociety) {
      showNotification('error', 'Please select a society first.');
      return;
    }

    const fullPhoneNumber = `+91${phoneNumber}`;
    setLoadingOtp(true);

    try {
      // First verify if the phone number belongs to manager or member
      const verifyResponse = await axios.post('/api/society/verify-phone', {
        societyId: selectedSociety._id,
        phoneNumber: fullPhoneNumber
      });

      if (!verifyResponse.data.success) {
        showNotification('error', verifyResponse.data.message || 'You are not authorized to access this society');
        setLoadingOtp(false);
        return;
      }

      const response = await axios.post('/api/send-otp', { phoneNumber: fullPhoneNumber });

      if (response.data.success) {
        setVerificationId(response.data.sessionId);
        setOtpSent(true);
        showNotification('success', 'OTP sent successfully! Please check your phone.');
      } else {
        showNotification('error', 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      showNotification('error', error.response?.data?.message || 'Error sending OTP. Please try again.');
    }
    setLoadingOtp(false);
  };

  const handleLogin = async () => {
    if (!otp || otp.length < 6) {
      showNotification('error', 'Please enter a valid OTP.');
      return;
    }

    try {
      // Step 1: Verify OTP
      const response = await axios.post('/api/verify-otp', {
        otp,
        phoneNumber: `+91${phoneNumber}`,
        sessionId: verificationId,
      });

      if (response.data.success) {
        // Step 2: Login with society and phone
        const loginResponse = await axios.post('/api/society/login', {
          societyId: selectedSociety._id,
          phoneNumber: `+91${phoneNumber}`,
        });

        if (loginResponse.data.success) {
          const { token } = loginResponse.data;
          localStorage.setItem('Society', token);
          showNotification('success', 'Login successful! Redirecting to dashboard...');
          
          setTimeout(() => {
            window.location.href = '/Society-dashboard';
          }, 1500);
        } else {
          showNotification('error', 'Login failed. Please try again.');
        }
      } else {
        showNotification('error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      showNotification('error', error.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Head>
        <title>Society Login - SocietyManage</title>
        <meta name="description" content="Society login using mobile number and OTP." />
      </Head>

      {/* Notification Popup */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            className="fixed top-5 left-0 right-0 mx-auto z-50 px-6 py-4 rounded-lg shadow-lg flex items-center max-w-md w-11/12 sm:w-full"
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
        className="bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-white shadow-lg sticky top-0 z-40"
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
            className="max-w-lg mx-auto bg-white shadow-xl rounded-xl overflow-visible"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-4 px-6 rounded-t-xl">
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

              {/* Step 1: PIN Code Input */}
              {!selectedSociety && (
                <div className="space-y-6">
                  {/* PIN Code Input */}
                  <motion.div variants={itemVariants}>
                    <label htmlFor="pinCode" className="block text-gray-700 font-medium mb-2">
                      <MapPin className="inline-block w-5 h-5 mr-2 text-indigo-600" />
                      PIN Code
                    </label>
                    <input
                      type="text"
                      id="pinCode"
                      name="pinCode"
                      value={pinCode}
                      onChange={handlePincodeChange}
                      maxLength={6}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Enter PIN code to find societies"
                    />
                    {loadingSocieties && (
                      <div className="mt-2 text-sm text-blue-600 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Searching for societies...
                      </div>
                    )}
                  </motion.div>

                  {/* Society Selection */}
                  {isPincodeValid && (
                    <motion.div variants={itemVariants} className="relative">
                      <label htmlFor="societySearch" className="block text-gray-700 font-medium mb-2">
                        <Building className="inline-block w-5 h-5 mr-2" />
                        Society Name
                      </label>
                      <input
                        type="text"
                        id="societySearch"
                        name="societySearch"
                        value={societySearchQuery}
                        onChange={handleSocietySearch}
                        className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Search for your society"
                      />

                      {/* Society List Dropdown */}
                      <AnimatePresence>
                        {showSocietyList && filteredSocieties.length > 0 && (
                          <motion.div
                            className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            {filteredSocieties.map((society) => (
                              <motion.div
                                key={society._id}
                                onClick={() => handleSocietySelect(society)}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                whileHover={{ backgroundColor: "#f3f4f6" }}
                              >
                                <div className="font-medium text-gray-800">{society.societyName}</div>
                                <div className="text-sm text-gray-600">{society.street}</div>
                                <div className="text-xs text-gray-500">{society.city}, {society.state}</div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {showSocietyList && filteredSocieties.length === 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          No societies found for this PIN code
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Display Selected Society Details */}
              {selectedSociety && !otpSent && (
                <motion.div
                  variants={itemVariants}
                  className="bg-indigo-50 p-4 rounded-lg border border-indigo-200"
                >
                  <h3 className="font-medium text-indigo-800 mb-2">Selected Society</h3>
                  <div className="space-y-1">
                    <p className="text-indigo-700">{selectedSociety.societyName}</p>
                    <p className="text-indigo-600 text-sm">{selectedSociety.street}</p>
                    <p className="text-indigo-600 text-sm">{selectedSociety.city}, {selectedSociety.state} - {selectedSociety.pinCode}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSocietyList(true);
                      setSelectedSociety(null);
                    }}
                    className="mt-2 text-sm text-indigo-700 hover:text-indigo-800 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Change Society
                  </button>
                </motion.div>
              )}

              {/* Step 2: Phone Number & OTP */}
              {selectedSociety && !otpSent && (
                <>
                  <motion.div 
                    className="mb-6 p-4 bg-blue-50 rounded-lg"
                    variants={itemVariants}
                  >
                    <h3 className="font-medium text-gray-900">{selectedSociety.name}</h3>
                    <p className="text-sm text-gray-500">{selectedSociety.address}</p>
                    <button 
                      onClick={() => {
                        setSelectedSociety(null);
                        setShowSocietyList(true);
                      }}
                      className="text-blue-600 text-sm mt-2 hover:underline"
                    >
                      Change Society
                    </button>
                  </motion.div>

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
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="flex-1 focus:outline-none"
                        placeholder="Enter your 10-digit number"
                      />
                    </div>
                  </motion.div>

                  <motion.button
                    type="button"
                    onClick={handleOtpSend}
                    disabled={loadingOtp || phoneNumber.length !== 10}
                    className={`mt-6 w-full py-3 text-white rounded-lg flex items-center justify-center ${
                      loadingOtp || phoneNumber.length !== 10 ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-blue-700'
                    }`}
                    variants={buttonVariants}
                    whileHover={!loadingOtp && phoneNumber.length === 10 ? "hover" : "disabled"}
                    whileTap={!loadingOtp && phoneNumber.length === 10 ? "tap" : "disabled"}
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
              )}

              {/* Step 3: OTP Verification */}
              {selectedSociety && otpSent && (
                <>
                  <motion.div variants={itemVariants}>
                    <label htmlFor="otp" className="block text-lg font-medium text-gray-700 mb-2">
                      Enter OTP
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
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