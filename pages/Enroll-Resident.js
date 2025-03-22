import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, User, MapPin, Shield, ChevronLeft, ChevronRight, Phone, Mail, MapPinned, FileText, Home, MessageSquare } from 'lucide-react';

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
        unitNumber: '',
    });
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [loadingOtp, setLoadingOtp] = useState(false);
    const [societies, setSocieties] = useState([]);
    const [filteredSocieties, setFilteredSocieties] = useState([]);

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
        return formData.phone.startsWith('+91') ? formData.phone : `+91${formData.phone}`;
    };

    const sendOtp = async () => {
        const phoneNumber = getFormattedPhoneNumber();
        setLoadingOtp(true);

        try {
            const response = await axios.post('/api/send-otp', { phoneNumber });
            if (response.data.success) {
                setOtpSent(true);
                alert('OTP has been sent to your phone.');
            } else {
                alert('Failed to send OTP.');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            alert('Error sending OTP.');
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

                // OTP is valid, now submit the resident data
                const submitResponse = await fetch('/api/Resident-Api/resident', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, phone: phoneNumber }),
                });

                const submitData = await submitResponse.json();

                if (submitData.message === 'Resident signed up successfully!') {
                    alert('Resident signed up successfully!');
                    router.push('/Login');
                } else {
                    alert('Error in resident signup.');
                }
            } else {
                setOtpError('Invalid OTP. Please try again.');
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            alert('Error verifying OTP.');
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
        { number: 3, title: 'Unit Details', icon: Home },
        { number: 4, title: 'Verify', icon: Shield },
    ];

    return (
        <div className="bg-slate-50 min-h-screen">
            <Head>
                <title>Resident Signup - Society Management System</title>
                <meta name="description" content="Sign up to your society in our management system." />
            </Head>

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
                                <Link href="/Login" className="hover:underline text-lg font-medium flex items-center">
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
            <section className="py-10 bg-slate-50 min-h-screen relative overflow-hidden">
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-8"
                    >
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent inline-block mb-4">Resident Signup</h2>
                        <p className="text-lg text-gray-600">Complete the form below to register with SocietyManage</p>
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
                                        className="flex flex-col items-center relative z-10"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: index * 0.1 + 0.3 }}
                                    >
                                        <motion.div
                                            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-colors duration-200 ${currentStep >= step.number ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-white text-gray-400'}`}
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            <Icon className="w-6 h-6" />
                                        </motion.div>
                                        <p className={`mt-2 text-sm font-medium ${currentStep >= step.number ? 'text-indigo-600' : 'text-gray-500'}`}>
                                            {step.title}
                                        </p>
                                    </motion.div>
                                );
                            })}
                            {/* Progress line */}
                            <div className="absolute top-7 left-0 h-0.5 bg-gray-200 w-full -z-10">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.div
                        className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.5 }}
                    >
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-4 px-6">
                            <h3 className="text-xl font-bold text-center text-white">
                                {currentStep === 1 && "Society Information"}
                                {currentStep === 2 && "Personal Information"}
                                {currentStep === 3 && "Unit Details"}
                                {currentStep === 4 && "Verify Your Identity"}
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
                                        {/* Society Name Input with Autocomplete */}
                                        <motion.div className="relative" variants={itemVariants}>
                                            <label htmlFor="societyName" className="block text-gray-700 font-medium mb-2">
                                                <Building2 className="inline-block w-5 h-5 mr-2 text-indigo-600" />
                                                Society Name
                                            </label>
                                            <input
                                                type="text"
                                                id="societyName"
                                                name="societyName"
                                                value={formData.societyName || ""}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                placeholder="Enter your society's name"
                                            />

                                            {/* Autocomplete Suggestions */}
                                            {filteredSocieties.length > 0 && (
                                                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                                    {filteredSocieties.map((society) => (
                                                        <motion.div
                                                            key={society._id}
                                                            onClick={() => handleSocietySelect(society)}
                                                            className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100"
                                                            whileHover={{ backgroundColor: "#EEF2FF" }}
                                                        >
                                                            {society.societyName}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Street Input */}
                                            <motion.div variants={itemVariants}>
                                                <label htmlFor="street" className="block text-gray-700 font-medium mb-2">
                                                    <MapPinned className="inline-block w-5 h-5 mr-2 text-indigo-600" />
                                                    Street
                                                </label>
                                                <input
                                                    type="text"
                                                    id="street"
                                                    name="street"
                                                    value={formData.street}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    placeholder="Enter street"
                                                />
                                            </motion.div>

                                            {/* City Input */}
                                            <motion.div variants={itemVariants}>
                                                <label htmlFor="city" className="block text-gray-700 font-medium mb-2">
                                                    <MapPin className="inline-block w-5 h-5 mr-2 text-indigo-600" />
                                                    City
                                                </label>
                                                <input
                                                    type="text"
                                                    id="city"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    placeholder="Enter city"
                                                />
                                            </motion.div>

                                            {/* State Input */}
                                            <motion.div variants={itemVariants}>
                                                <label htmlFor="state" className="block text-gray-700 font-medium mb-2">
                                                    <MapPin className="inline-block w-5 h-5 mr-2 text-indigo-600" />
                                                    State
                                                </label>
                                                <input
                                                    type="text"
                                                    id="state"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    placeholder="Enter state"
                                                />
                                            </motion.div>

                                            {/* Pin Code Input */}
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
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    placeholder="Enter PIN code"
                                                />
                                            </motion.div>
                                        </div>
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
                                                    <div className="bg-indigo-100 py-2 px-3 rounded-l-lg text-indigo-800 font-medium">+91</div>
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

                                {/* Step 3 - Unit Details */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <motion.div variants={itemVariants}>
                                            <label htmlFor="unitNumber" className="block text-gray-700 font-medium mb-2">
                                                <Home className="inline-block w-5 h-5 mr-2 text-indigo-600" />
                                                Unit/Apartment Number
                                            </label>
                                            <input
                                                type="text"
                                                id="unitNumber"
                                                name="unitNumber"
                                                value={formData.unitNumber}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                placeholder="Enter your unit/apartment number"
                                            />
                                        </motion.div>
                                    </div>
                                )}

                                {/* Step 4 - OTP Verification */}
                                {currentStep === 4 && !otpSent && (
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

                                {currentStep === 4 && otpSent && (
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
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            <ChevronLeft className="w-5 h-5 mr-2" />
                                            Back
                                        </motion.button>
                                    )}

                                    {currentStep < 4 && (
                                        <motion.button
                                            type="button"
                                            onClick={handleNext}
                                            className="flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white ml-auto"
                                            variants={buttonVariants}
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            Next
                                            <ChevronRight className="w-5 h-5 ml-2" />
                                        </motion.button>
                                    )}

                                    {currentStep === 4 && otpSent && (
                                        <motion.button
                                            type="button"
                                            onClick={verifyOtp}
                                            className="flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white ml-auto"
                                            variants={buttonVariants}
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            Complete Registration
                                            <ChevronRight className="w-5 h-5 ml-2" />
                                        </motion.button>
                                    )}
                                </div>
                            </form>
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
                        <Link href="/About">
                            <motion.span className="hover:underline flex items-center" whileHover={{ scale: 1.1 }}>
                                <FileText size={16} className="mr-1" />
                                About
                            </motion.span>
                        </Link>
                        <Link href="/Contact">
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