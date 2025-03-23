import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Building2, User, Shield, ChevronLeft, ChevronRight, Phone, Mail, MapPin, MapPinned, FileText, Clock, Home, Check, AlertCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function SecuritySignup() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        societyName: '',
        societyId: '',
        street: '',
        city: '',
        state: '',
        pinCode: '',
        guardName: '',
        guardPhone: '+91',
        email: '',
        shiftStart: '',
        shiftEnd: '',
    });
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [loadingOtp, setLoadingOtp] = useState(false);
    const [societies, setSocieties] = useState([]);
    const [filteredSocieties, setFilteredSocieties] = useState([]);
    const [notification, setNotification] = useState({
        show: false,
        type: 'success', // or 'error'
        message: ''
    });

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

    const handleNext = () => setCurrentStep(currentStep + 1);
    const handleBack = () => setCurrentStep(currentStep - 1);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'societyName' && Array.isArray(societies)) {
            const filtered = societies.filter(society =>
                society?.societyName?.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredSocieties(filtered);
        }
    };

    const handleSocietySelect = (society) => {
        setFormData({
            ...formData,
            societyName: society.societyName,
            street: society.street,
            city: society.city,
            state: society.state,
            societyId: society.societyId,
            pinCode: society.pinCode,
        });
        setFilteredSocieties([]);
    };

    const handleOtpChange = (e) => setOtp(e.target.value);

    const getFormattedPhoneNumber = () => {
        return formData.guardPhone.startsWith('+91') ? formData.guardPhone : `+91${formData.guardPhone}`;
    };

    const sendOtp = async () => {
        const phoneNumber = getFormattedPhoneNumber();
        setLoadingOtp(true);

        try {
            const response = await axios.post('/api/send-otp', { phoneNumber });
            if (response.data.success) {
                setOtpSent(true);
                setNotification({
                    show: true,
                    type: 'success',
                    message: 'OTP has been sent to your phone.'
                });
            } else {
                setNotification({
                    show: true,
                    type: 'error',
                    message: 'Failed to send OTP.'
                });
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            setNotification({
                show: true,
                type: 'error',
                message: 'Error sending OTP.'
            });
        }

        setLoadingOtp(false);
    };

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

                // OTP is valid, now submit the security data
                const submitResponse = await fetch('/api/Security-Api/security', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        guardPhone: phoneNumber
                    }),
                });

                const submitData = await submitResponse.json();

                if (submitData.message === 'Security guard signed up successfully!') {
                    setNotification({
                        show: true,
                        type: 'success',
                        message: 'Security guard signed up successfully!'
                    });

                    setTimeout(() => {
                        router.push('/SecurityLogin');
                    }, 1500);
                } else {
                    setNotification({
                        show: true,
                        type: 'error',
                        message: 'Error in security guard signup.'
                    });
                }
            } else {
                setOtpError('Invalid OTP. Please try again.');
                setNotification({
                    show: true,
                    type: 'error',
                    message: 'Invalid OTP. Please try again.'
                });
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            setNotification({
                show: true,
                type: 'error',
                message: 'Error verifying OTP.'
            });
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
            }
        };

        fetchSocieties();
    }, []);

    const steps = [
        { number: 1, title: 'Society Details', icon: Building2 },
        { number: 2, title: 'Contact Info', icon: User },
        { number: 3, title: 'Shift Details', icon: Clock },
        { number: 4, title: 'Verify', icon: Shield },
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            <Head>
                <title>Security Signup - Society Management System</title>
                <meta name="description" content="Sign up as a security guard in our management system." />
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
                className="bg-gradient-to-r from-green-500 to-green-600 py-3 text-white shadow-lg sticky top-0 z-50"
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
                                <Link href="/SecurityLogin" className="hover:underline text-lg font-medium flex items-center">
                                    <User size={18} className="mr-1" />
                                    <span>Login</span>
                                </Link>
                            </motion.li>
                            <motion.li whileHover={{ scale: 1.1 }}>
                                <Link href="/Contact" className="hover:underline text-lg font-medium flex items-center">
                                    <Mail size={18} className="mr-1" />
                                    <span>Contact</span>
                                </Link>
                            </motion.li>
                        </ul>
                    </nav>
                </div>
            </motion.header>

            {/* Signup Form */}
            <section className="py-10 bg-gray-100 min-h-screen relative overflow-hidden">
                {/* Background decoration elements */}
                <motion.div
                    className="absolute top-20 left-20 w-64 h-64 bg-green-200 rounded-full opacity-20"
                    animate={{
                        y: [0, -30, 0],
                        x: [0, 20, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.div
                    className="absolute bottom-20 right-20 w-96 h-96 bg-green-200 rounded-full opacity-20"
                    animate={{
                        y: [0, 30, 0],
                        x: [0, -20, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
                />

                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        className="text-center mb-3 lg:mb-10"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl font-bold text-green-600 mb-5">Security Guard Signup</h2>
                        <p className="text-lg">Complete the form below to register as a security guard</p>
                    </motion.div>

                    {/* Progress Steps */}
                    <motion.div
                        className="mb-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
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
                                            className={`w-12 h-12 rounded-full flex items-center justify-center ${currentStep >= step.number ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'} transition-colors duration-200`}
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            <Icon className="w-6 h-6" />
                                        </motion.div>
                                        <p className={`mt-2 text-sm font-medium ${currentStep >= step.number ? 'text-green-600' : 'text-gray-500'}`}>
                                            {step.title}
                                        </p>
                                    </motion.div>
                                );
                            })}
                            {/* Progress line */}
                            <div className="absolute top-6 left-0 h-0.5 bg-gray-200 w-full -z-10">
                                <motion.div
                                    className="h-full bg-green-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.div
                        className="bg-white rounded-2xl shadow-xl p-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                            {/* Step 1 - Society Details */}
                            {currentStep === 1 && (
                                <motion.div
                                    className="space-y-6"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {/* Society Name Input with Autocomplete */}
                                    <motion.div className="relative" variants={itemVariants}>
                                        <label htmlFor="societyName" className="block text-gray-700 font-medium mb-2">
                                            <Building2 className="inline-block w-5 h-5 mr-2" />
                                            Society Name
                                        </label>
                                        <input
                                            type="text"
                                            id="societyName"
                                            name="societyName"
                                            value={formData.societyName || ""}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="Enter your society's name"
                                        />

                                        {/* Autocomplete Suggestions */}
                                        <AnimatePresence>
                                            {filteredSocieties.length > 0 && (
                                                <motion.div
                                                    className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {filteredSocieties.map((society) => (
                                                        <motion.div
                                                            key={society._id}
                                                            onClick={() => handleSocietySelect(society)}
                                                            className="p-2 hover:bg-gray-100 cursor-pointer"
                                                            whileHover={{ backgroundColor: "#f3f4f6" }}
                                                        >
                                                            {society.societyName}
                                                        </motion.div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>

                                    <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={itemVariants}>
                                        {/* Street Input */}
                                        <div>
                                            <label htmlFor="street" className="block text-gray-700 font-medium mb-2">
                                                <MapPinned className="inline-block w-5 h-5 mr-2" />
                                                Street
                                            </label>
                                            <input
                                                type="text"
                                                id="street"
                                                name="street"
                                                value={formData.street}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Enter street"
                                            />
                                        </div>

                                        {/* City Input */}
                                        <div>
                                            <label htmlFor="city" className="block text-gray-700 font-medium mb-2">
                                                <MapPin className="inline-block w-5 h-5 mr-2" />
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                id="city"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Enter city"
                                            />
                                        </div>

                                        {/* State Input */}
                                        <div>
                                            <label htmlFor="state" className="block text-gray-700 font-medium mb-2">
                                                <MapPin className="inline-block w-5 h-5 mr-2" />
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                id="state"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Enter state"
                                            />
                                        </div>

                                        {/* Pin Code Input */}
                                        <div>
                                            <label htmlFor="pinCode" className="block text-gray-700 font-medium mb-2">
                                                <MapPin className="inline-block w-5 h-5 mr-2" />
                                                PIN Code
                                            </label>
                                            <input
                                                type="text"
                                                id="pinCode"
                                                name="pinCode"
                                                value={formData.pinCode}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Enter PIN code"
                                            />
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}

                            {/* Step 2 - Guard Details */}
                            {currentStep === 2 && (
                                <motion.div
                                    className="space-y-6"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={itemVariants}>
                                        <div>
                                            <label htmlFor="guardName" className="block text-gray-700 font-medium mb-2">
                                                <User className="inline-block w-5 h-5 mr-2" />
                                                Guard Name
                                            </label>
                                            <input
                                                type="text"
                                                id="guardName"
                                                name="guardName"
                                                value={formData.guardName}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Enter guard's name"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="guardPhone" className="block text-gray-700 font-medium mb-2">
                                                <Phone className="inline-block w-5 h-5 mr-2" />
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                id="guardPhone"
                                                name="guardPhone"
                                                value={formData.guardPhone}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                    </motion.div>
                                    <motion.div variants={itemVariants}>
                                        <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                                            <Mail className="inline-block w-5 h-5 mr-2" />
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="Enter email address"
                                        />
                                    </motion.div>
                                </motion.div>
                            )}

                            {/* Step 3 - Shift Details */}
                            {currentStep === 3 && (
                                <motion.div
                                    className="space-y-6"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={itemVariants}>
                                        <div>
                                            <label htmlFor="shiftStart" className="block text-gray-700 font-medium mb-2">
                                                <Clock className="inline-block w-5 h-5 mr-2" />
                                                Shift Start Time
                                            </label>
                                            <input
                                                type="time"
                                                id="shiftStart"
                                                name="shiftStart"
                                                value={formData.shiftStart}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="shiftEnd" className="block text-gray-700 font-medium mb-2">
                                                <Clock className="inline-block w-5 h-5 mr-2" />
                                                Shift End Time
                                            </label>
                                            <input
                                                type="time"
                                                id="shiftEnd"
                                                name="shiftEnd"
                                                value={formData.shiftEnd}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}

                            {/* Step 4 - OTP Verification */}
                            {currentStep === 4 && !otpSent && (
                                <motion.div
                                    className="text-center"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <motion.div variants={itemVariants}>
                                        <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold mb-4">Verify Your Phone Number</h3>
                                        <p className="text-gray-600 mb-6">
                                            We'll send a verification code to: <br />
                                            <span className="font-semibold">{getFormattedPhoneNumber()}</span>
                                        </p>
                                        <motion.button
                                            type="button"
                                            onClick={sendOtp}
                                            disabled={loadingOtp}
                                            className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${loadingOtp ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
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
                                                'Send Verification Code'
                                            )}
                                        </motion.button>
                                    </motion.div>
                                </motion.div>
                            )}

                            {currentStep === 4 && otpSent && (
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <motion.div className="text-center mb-6" variants={itemVariants}>
                                        <h3 className="text-xl font-semibold mb-2">Enter Verification Code</h3>
                                        <p className="text-gray-600">
                                            We've sent a code to your phone number
                                        </p>
                                    </motion.div>
                                    <motion.input
                                        type="text"
                                        id="otp"
                                        name="otp"
                                        value={otp}
                                        onChange={handleOtpChange}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl letter-spacing-2"
                                        placeholder="Enter 6-digit code"
                                        maxLength={6}
                                        variants={itemVariants}
                                    />
                                    {otpError && (
                                        <motion.p
                                            className="text-red-500 text-sm mt-2"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {otpError}
                                        </motion.p>
                                    )}
                                </motion.div>
                            )}

                            {/* Navigation Buttons */}
                            <motion.div
                                className="flex justify-between mt-8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                {currentStep > 1 && (
                                    <motion.button
                                        type="button"
                                        onClick={handleBack}
                                        className="flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        <ChevronLeft className="w-5 h-5 mr-1" />
                                        Back
                                    </motion.button>
                                )}

                                {currentStep < 4 && (
                                    <motion.button
                                        type="button"
                                        onClick={handleNext}
                                        className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium ml-auto transition-colors"
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        Next
                                        <ChevronRight className="w-5 h-5 ml-1" />
                                    </motion.button>
                                )}

                                {currentStep === 4 && otpSent && (
                                    <motion.button
                                        type="button"
                                        onClick={verifyOtp}
                                        className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium ml-auto transition-colors"
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        Verify & Submit
                                        <Check className="w-5 h-5 ml-1" />
                                    </motion.button>
                                )}
                            </motion.div>
                        </form>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        className="mt-8 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                    >
                        <p className="text-gray-600">
                            Already registered?{' '}
                            <Link href="/SecurityLogin" className="text-green-600 hover:underline font-medium">
                                Login here
                            </Link>
                        </p>
                        <Link href="/" className="inline-flex items-center text-green-600 hover:underline mt-4">
                            <Home className="w-4 h-4 mr-1" />
                            Back to Home
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <motion.footer
                className="bg-gray-800 text-white py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
            >
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-6 md:mb-0">
                            <Link href={"/"}>
                                <h2 className="text-2xl font-bold text-green-400">SocietyManage</h2>
                            </Link>
                            <p className="mt-2 text-gray-400">Simplifying society security management</p>
                        </div>
                        <div className="flex space-x-6">
                            <Link href="/About" className="hover:text-green-400 transition-colors">
                                <FileText className="w-5 h-5" />
                                <span className="sr-only">About</span>
                            </Link>
                            <Link href="/Contact" className="hover:text-green-400 transition-colors">
                                <Mail className="w-5 h-5" />
                                <span className="sr-only">Contact</span>
                            </Link>
                            <Link href="/Privacy" className="hover:text-green-400 transition-colors">
                                <Shield className="w-5 h-5" />
                                <span className="sr-only">Privacy</span>
                            </Link>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; {new Date().getFullYear()} SocietyManage. All rights reserved.</p>
                    </div>
                </div>
            </motion.footer>
        </div>
    );
}