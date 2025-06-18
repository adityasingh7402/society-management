import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, User, MapPin, Shield, ChevronLeft, ChevronRight, Phone, Mail, MapPinned, FileText, Home, MessageSquare, Check, AlertCircle, X, Edit } from 'lucide-react';

export default function ResidentSignup() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        societyName: '',
        societyId: '',
        street: '',
        city: '',
        state: '',
        pinCode: '',
        name: '',
        phone: '',
        email: '',
        address: '',
    });
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [loadingOtp, setLoadingOtp] = useState(false);
    const [societies, setSocieties] = useState([]);
    const [filteredSocieties, setFilteredSocieties] = useState([]);
    const [fcmToken, setFcmToken] = useState('');
    const [notification, setNotification] = useState({
        show: false,
        type: 'success',
        message: ''
    });
    const [showSocietyList, setShowSocietyList] = useState(false);
    const [isPincodeValid, setIsPincodeValid] = useState(false);
    const [isSearchingSocieties, setIsSearchingSocieties] = useState(false);

    // Add the new useEffect for FCM token
    useEffect(() => {
        // Try to get FCM token from localStorage (set by the Android WebView)
        const token = localStorage.getItem('fcmToken');
        if (token) {
            setFcmToken(token);
            console.log("FCM token retrieved from localStorage:", token);
        }
    }, []);

    // Notification variants for animation
    const notificationVariants = {
        hidden: { opacity: 0, y: -50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 120,
                damping: 12
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

    const handleNext = () => setCurrentStep(currentStep + 1);
    const handleBack = () => setCurrentStep(currentStep - 1);

    // Show notification helper function
    const showNotification = (type, message, duration = 5000) => {
        setNotification({
            show: true,
            type,
            message
        });

        // Auto hide notification after duration
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
        }, duration);
    };

    const handlePincodeChange = async (e) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, pinCode: value }));

        // Basic pincode validation
        if (value.length === 6 && /^\d+$/.test(value)) {
            setIsPincodeValid(true);
            setIsSearchingSocieties(true);
            try {
                const response = await fetch(`/api/societies?pincode=${value}`);
                const data = await response.json();
                setSocieties(data.societies || []);
                setFilteredSocieties(data.societies || []);
                setShowSocietyList(true);
            } catch (error) {
                console.error("Failed to fetch societies", error);
                setNotification({
                    show: true,
                    type: 'error',
                    message: 'Failed to fetch societies for this pincode'
                });
            }
            setIsSearchingSocieties(false);
        } else {
            setIsPincodeValid(false);
            setShowSocietyList(false);
            setSocieties([]);
            setFilteredSocieties([]);
        }
    };

    const handleSocietySearch = (e) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, societyName: value }));
        if (societies.length > 0) {
            const filtered = societies.filter(society =>
                society.societyName.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredSocieties(filtered);
            setShowSocietyList(true);
        }
    };

    const handleSocietySelect = (society) => {
        setFormData(prev => ({
            ...prev,
            societyName: society.societyName,
            street: society.street,
            city: society.city,
            state: society.state,
            societyId: society.societyId,
            pinCode: society.pinCode,
        }));
        setShowSocietyList(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleOtpChange = (e) => setOtp(e.target.value);

    const getFormattedPhoneNumber = () => {
        return formData.phone.startsWith('+91') ? formData.phone : `+91${formData.phone}`;
    };

    const sendOtp = async () => {
        const phoneNumber = getFormattedPhoneNumber();
        setLoadingOtp(true);

        try {
            const response = await axios.post('/api/send-otp', { phoneNumber });
            if (response.data.success) {
                setOtpSent(true);
                showNotification('success', 'OTP has been sent to your phone.');
            } else {
                showNotification('error', 'Failed to send OTP. Please try again.');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            showNotification('error', 'Error sending OTP. Please check your connection and try again.');
        }

        setLoadingOtp(false);
    };

    // Update the verifyOtp function
    const verifyOtp = async () => {
        const phoneNumber = getFormattedPhoneNumber();
        try {
            // Verify OTP
            const otpResponse = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    otp: otp,
                    phoneNumber: phoneNumber,
                }),
            });

            const otpData = await otpResponse.json();

            if (otpData.success) {
                setOtpError('');
                // OTP is valid, now submit the resident data with FCM token
                const submitResponse = await fetch('/api/Resident-Api/resident', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        phone: phoneNumber,
                        fcmToken: fcmToken // Include the FCM token
                    }),
                });

                const submitData = await submitResponse.json();

                if (submitData.message === 'Resident signed up successfully!') {
                    showNotification('success', 'Resident signed up successfully! Redirecting to login...');
                    setTimeout(() => {
                        router.push('/login');
                    }, 2000);
                } else {
                    showNotification('error', 'Error in resident signup. Please try again.');
                }
            } else {
                setOtpError('Invalid OTP. Please try again.');
                showNotification('error', 'Invalid OTP. Please try again.');
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            showNotification('error', 'Error verifying OTP. Please try again.');
        }
    };

    // Fetch societies list on component mount
    useEffect(() => {
        const fetchSocieties = async () => {
            try {
                const response = await fetch('/api/societies');
                const data = await response.json();
                setSocieties(data.societies || []);
            } catch (error) {
                console.error("Failed to fetch societies", error);
                showNotification('error', 'Failed to fetch societies list. Please refresh the page.');
            }
        };

        fetchSocieties();
    }, []);

    const steps = [
        { number: 1, title: 'Society Details', icon: Building2 },
        { number: 2, title: 'Contact Info', icon: User },
        { number: 3, title: 'Verify', icon: Shield },
    ];

    return (
        <div className="bg-slate-50 min-h-screen">
            <Head>
                <title>Resident Signup - Society Management System</title>
                <meta name="description" content="Sign up to your society in our management system." />
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
                                <Link href="/login" className="hover:underline text-lg font-medium flex items-center">
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

            {/* Background decoration elements */}
            <section className="py-10 bg-slate-50 min-h-screen relative">
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
                    className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-200 rounded-full opacity-20"
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
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent inline-block mb-4">Resident Signup</h2>
                    </motion.div>

                    {/* Progress Steps */}
                    <motion.div
                        className="mb-10 max-w-3xl mx-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <div className="flex justify-between relative">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <motion.div
                                        key={step.number}
                                        className="flex flex-col items-center relative" style={{ zIndex: 1 }}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: index * 0.1 + 0.3 }}
                                    >
                                        <motion.div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors duration-200 ${currentStep >= step.number ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-white text-gray-400'}`}
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </motion.div>
                                        <p className={`mt-2 text-sm font-medium ${currentStep >= step.number ? 'text-indigo-600' : 'text-gray-500'}`}>
                                            {step.title}
                                        </p>
                                    </motion.div>
                                );
                            })}
                            {/* Progress line */}
                            <div className="absolute top-5 left-10 right-5 mx-auto h-[2px] bg-gray-200" style={{ width: '80%', zIndex: 0 }}>
                                <motion.div
                                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Form Container */}
                    <motion.div
                        className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl overflow-visible relative z-20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        <div className="bg-gradient-to-r rounded-t-2xl from-indigo-600 to-purple-600 py-4 px-6">
                            <h3 className="text-xl font-bold text-center text-white">
                                {currentStep === 1 && "Society Information"}
                                {currentStep === 2 && "Personal Information"}
                                {currentStep === 3 && "Verify Your Identity"}
                            </h3>
                        </div>

                        <motion.div
                            className="p-8"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                                {/* Step 1 - Society Details */}
                                {currentStep === 1 && (
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
                                                value={formData.pinCode}
                                                onChange={handlePincodeChange}
                                                maxLength={6}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                placeholder="Enter PIN code to find societies"
                                            />
                                            {isSearchingSocieties && (
                                                <div className="mt-2 text-sm text-blue-600 flex items-center">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                                    Searching for societies...
                                                </div>
                                            )}
                                        </motion.div>

                                        {/* Society Selection */}
                                        {isPincodeValid && (
                                            <motion.div variants={itemVariants} className="relative">
                                                <label htmlFor="societyName" className="block text-gray-700 font-medium mb-2">
                                                    <Building2 className="inline-block w-5 h-5 mr-2" />
                                                    Society Name
                                                </label>
                                                <input
                                                    type="text"
                                                    id="societyName"
                                                    name="societyName"
                                                    value={formData.societyName}
                                                    onChange={handleSocietySearch}
                                                    className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="Search for your society"
                                                />

                                                {/* Society List Dropdown */}
                                                <AnimatePresence>
                                                    {showSocietyList && filteredSocieties.length > 0 && (
                                                        <motion.div
                                                            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
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

                                        {/* Display Selected Society Details */}
                                        {formData.societyName && !showSocietyList && (
                                            <motion.div
                                                variants={itemVariants}
                                                className="bg-indigo-50 p-4 rounded-lg border border-indigo-200"
                                            >
                                                <h3 className="font-medium text-indigo-800 mb-2">Selected Society</h3>
                                                <div className="space-y-1">
                                                    <p className="text-indigo-700">{formData.societyName}</p>
                                                    <p className="text-indigo-600 text-sm">{formData.street}</p>
                                                    <p className="text-indigo-600 text-sm">{formData.city}, {formData.state} - {formData.pinCode}</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowSocietyList(true);
                                                        setFormData(prev => ({ ...prev, societyName: '' }));
                                                    }}
                                                    className="mt-2 text-sm text-indigo-700 hover:text-indigo-800 flex items-center"
                                                >
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    Change Society
                                                </button>
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2 - Contact Details */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <motion.div variants={itemVariants}>
                                                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                                                    <User className="inline-block w-5 h-5 mr-2 text-indigo-600" />
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    placeholder="Enter your full name"
                                                />
                                            </motion.div>
                                            <motion.div variants={itemVariants}>
                                                <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                                                    <Phone className="inline-block w-5 h-5 mr-2 text-indigo-600" />
                                                    Phone Number
                                                </label>
                                                <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                                                    <div className="bg-indigo-100 py-3 px-3 rounded-l-lg text-indigo-800 font-medium">+91</div>
                                                    <input
                                                        type="tel"
                                                        id="phone"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full px-4 py-3 rounded-r-lg focus:outline-none"
                                                        placeholder="Enter your phone number"
                                                    />
                                                </div>
                                            </motion.div>
                                        </div>
                                        <motion.div variants={itemVariants}>
                                            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                                                <Mail className="inline-block w-5 h-5 mr-2 text-indigo-600" />
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                placeholder="Enter your email address"
                                            />
                                        </motion.div>
                                    </div>
                                )}
                                {currentStep === 3 && !otpSent && (
                                    <motion.div
                                        className="text-center"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <motion.div
                                            className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6"
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
                                        >
                                            <Shield className="w-10 h-10 text-indigo-600" />
                                        </motion.div>
                                        <h3 className="text-xl font-semibold mb-4">Verify Your Phone Number</h3>
                                        <p className="text-gray-600 mb-6">
                                            We'll send a verification code to: <br />
                                            <span className="font-semibold">+91 {formData.phone}</span>
                                        </p>
                                        <motion.button
                                            type="button"
                                            onClick={sendOtp}
                                            disabled={loadingOtp}
                                            className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${loadingOtp ? 'bg-gray-400' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}
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
                                                </>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                )}

                                {currentStep === 3 && otpSent && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <div className="text-center mb-6">
                                            <motion.div
                                                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ repeat: 3, duration: 0.5 }}
                                            >
                                                <Shield className="w-8 h-8 text-green-600" />
                                            </motion.div>
                                            <h3 className="text-xl font-semibold mb-2">Enter Verification Code</h3>
                                            <p className="text-gray-600">
                                                We've sent a code to your phone number
                                            </p>
                                        </div>
                                        <motion.div
                                            className="mb-6"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <input
                                                type="text"
                                                id="otp"
                                                name="otp"
                                                value={otp}
                                                onChange={handleOtpChange}
                                                required
                                                className="w-full px-4 py-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center text-2xl tracking-widest"
                                                placeholder="Enter 6-digit code"
                                                maxLength={6}
                                            />
                                            {otpError && (
                                                <motion.p
                                                    className="text-red-500 text-sm mt-2"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                >
                                                    {otpError}
                                                </motion.p>
                                            )}
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-8">
                                    {currentStep > 1 && (
                                        <motion.button
                                            type="button"
                                            onClick={handleBack}
                                            className="flex items-center px-6 py-3 rounded-lg border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors"
                                            variants={buttonVariants}
                                            whileHover="hover" whileTap="tap"
                                        >
                                            <ChevronLeft className="mr-2" />
                                            Back
                                        </motion.button>
                                    )}
                                    {currentStep < 3 && (
                                        <motion.button
                                            type="button"
                                            onClick={handleNext}
                                            className="ml-auto flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
                                            variants={buttonVariants}
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            Next
                                            <ChevronRight className="ml-2" />
                                        </motion.button>
                                    )}
                                    {currentStep === 3 && otpSent && (
                                        <motion.button
                                            type="button"
                                            onClick={verifyOtp}
                                            className="ml-auto flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
                                            variants={buttonVariants}
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            Verify & Complete Signup
                                            <Check className="ml-2" />
                                        </motion.button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>

                    {/* Already have an account */}
                    <motion.div
                        className="text-center mt-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                                Login here
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <motion.footer
                className="bg-gray-900 text-gray-300 py-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-6 md:mb-0">
                            <h2 className="text-2xl font-bold text-white mb-2">SocietyManage</h2>
                            <p className="text-gray-400">Simplifying society management for everyone</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6">
                            <Link href="/About" className="hover:text-white transition-colors">
                                About Us
                            </Link>
                            <Link href="/Privacy" className="hover:text-white transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/Terms" className="hover:text-white transition-colors">
                                Terms of Service
                            </Link>
                            <Link href="/Contact" className="hover:text-white transition-colors">
                                Contact Us
                            </Link>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-sm text-gray-500">
                            &copy; {new Date().getFullYear()} SocietyManage. All rights reserved.
                        </p>
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <motion.a
                                href="#"
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-600 transition-colors"
                                whileHover={{ scale: 1.1 }}
                            >
                                <span className="sr-only">Facebook</span>
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                                </svg>
                            </motion.a>
                            <motion.a
                                href="#"
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-600 transition-colors"
                                whileHover={{ scale: 1.1 }}
                            >
                                <span className="sr-only">Twitter</span>
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M22 5.8a8.49 8.49 0 0 1-2.36.64 4.13 4.13 0 0 0 1.81-2.27 8.21 8.21 0 0 1-2.61 1 4.1 4.1 0 0 0-7 3.74 11.64 11.64 0 0 1-8.45-4.29 4.16 4.16 0 0 0-.55 2.07 4.09 4.09 0 0 0 1.82 3.41 4.05 4.05 0 0 1-1.86-.51v.05a4.1 4.1 0 0 0 3.3 4 3.93 3.93 0 0 1-1.1.17 3.9 3.9 0 0 1-.77-.07 4.11 4.11 0 0 0 3.83 2.84 8.22 8.22 0 0 1-5.1 1.76 7.93 7.93 0 0 1-1.17-.08 11.57 11.57 0 0 0 6.29 1.85c7.55 0 11.67-6.25 11.67-11.66 0-.18 0-.35-.02-.52A8.3 8.3 0 0 0 22 5.8z" />
                                </svg>
                            </motion.a>
                            <motion.a
                                href="#"
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-600 transition-colors"
                                whileHover={{ scale: 1.1 }}
                            >
                                <span className="sr-only">Instagram</span>
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2c-2.714 0-3.055.013-4.121.06-1.066.05-1.79.217-2.428.465a4.883 4.883 0 0 0-1.77 1.151 4.92 4.92 0 0 0-1.15 1.77c-.25.637-.416 1.363-.465 2.428C2.013 8.945 2 9.286 2 12c0 2.714.013 3.055.06 4.121.05 1.066.217 1.79.465 2.428a4.883 4.883 0 0 0 1.151 1.77c.555.555 1.105.938 1.77 1.15.637.25 1.363.416 2.428.465 1.066.05 1.407.06 4.121.06s3.055-.013 4.121-.06c1.066-.05 1.79-.217 2.428-.465a4.883 4.883 0 0 0 1.77-1.151 4.92 4.92 0 0 0 1.15-1.77c.25-.637.416-1.363.465-2.428.047-1.066.06-1.407.06-4.121s-.013-3.055-.06-4.121c-.05-1.066-.217-1.79-.465-2.428a4.883 4.883 0 0 0-1.151-1.77 4.92 4.92 0 0 0-1.77-1.15c-.637-.25-1.363-.416-2.428-.465C15.055 2.013 14.714 2 12 2zm0 1.8c2.67 0 2.987.01 4.042.059.975.045 1.504.208 1.857.344.466.182.8.399 1.15.748.35.35.566.683.748 1.15.136.353.3.882.344 1.857.048 1.055.059 1.371.059 4.042 0 2.67-.01 2.987-.059 4.042-.045.975-.208 1.504-.344 1.857a3.1 3.1 0 0 1-.748 1.15c-.35.35-.683.566-1.15.748-.353.136-.882.3-1.857.344-1.055.048-1.372.059-4.042.059-2.67 0-2.987-.01-4.042-.059-.975-.045-1.504-.208-1.857-.344a3.098 3.098 0 0 1-1.15-.748 3.098 3.098 0 0 1-.748-1.15c-.136-.353-.3-.882-.344-1.857-.048-1.055-.059-1.372-.059-4.042 0-2.67.01-2.987.059-4.042.045-.975.208-1.504.344-1.857.182-.466.399-.8.748-1.15.35-.35.683-.566 1.15-.748.353-.136.882-.3 1.857-.344 1.055-.048 1.372-.059 4.042-.059zm0 3.06a5.14 5.14 0 1 0 0 10.28 5.14 5.14 0 0 0 0-10.28zm0 8.476a3.337 3.337 0 1 1 0-6.674 3.337 3.337 0 0 1 0 6.674zm6.559-8.687a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z" />
                                </svg>
                            </motion.a>
                        </div>
                    </div>
                </div>
            </motion.footer>
        </div>
    );
}