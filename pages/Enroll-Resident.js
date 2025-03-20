import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Building2, User, MapPin, Shield, ChevronLeft, ChevronRight, Phone, Mail, MapPinned, FileText, Home } from 'lucide-react';

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
        <div className="bg-gray-50 min-h-screen">
            <Head>
                <title>Resident Signup - Society Management System</title>
                <meta name="description" content="Sign up to your society in our management system." />
            </Head>

            <header className="bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-white shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href={"/"}><h1 className="sm:text-xl md:text-3xl font-bold">SocietyManage</h1></Link>
                    <nav>
                        <ul className="flex space-x-6">
                            <a href="/Login" className="hover:underline text-lg font-medium">Login</a>
                            <a href="/Contact" className="hover:underline text-lg font-medium">Contact</a>
                        </ul>
                    </nav>
                </div>
            </header>

            {/* Signup Form */}
            <section className="py-10 bg-gray-100 min-h-screen">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-3 lg:mb-10">
                        <h2 className="text-4xl font-bold text-blue-600 mb-5">Resident Signup</h2>
                        <p className="text-lg">Complete the form below to register your society with us</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="mb-12">
                        <div className="flex justify-between relative">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <div key={step.number} className="flex flex-col items-center relative z-10">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentStep >= step.number ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'} transition-colors duration-200`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <p className={`mt-2 text-sm font-medium ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'}`}>
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
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                            {/* Step 1 - Society Details */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    {/* Society Name Input with Autocomplete */}
                                    <div className="relative">
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
                                            className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter your society's name"
                                        />

                                        {/* Autocomplete Suggestions */}
                                        {filteredSocieties.length > 0 && (
                                            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
                                                {filteredSocieties.map((society) => (
                                                    <div
                                                        key={society._id}
                                                        onClick={() => handleSocietySelect(society)}
                                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                                    >
                                                        {society.societyName}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter PIN code"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2 - Contact Details */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                                                <User className="inline-block w-5 h-5 mr-2" />
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                                                <Phone className="inline-block w-5 h-5 mr-2" />
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter your phone number"
                                            />
                                        </div>
                                    </div>
                                    <div>
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
                                            className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter your email address"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 3 - Unit Details */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="unitNumber" className="block text-gray-700 font-medium mb-2">
                                            <Home className="inline-block w-5 h-5 mr-2" />
                                            Unit Number
                                        </label>
                                        <input
                                            type="text"
                                            id="unitNumber"
                                            name="unitNumber"
                                            value={formData.unitNumber}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter your unit number"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 4 - OTP Verification */}
                            {currentStep === 4 && !otpSent && (
                                <div className="text-center">
                                    <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-4">Verify Your Phone Number</h3>
                                    <p className="text-gray-600 mb-6">
                                        We'll send a verification code to: <br />
                                        <span className="font-semibold">+91 {formData.phone}</span>
                                    </p>
                                    <button
                                        type="button"
                                        onClick={sendOtp}
                                        disabled={loadingOtp}
                                        className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${loadingOtp ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                                    >
                                        {loadingOtp ? 'Sending Code...' : 'Send Verification Code'}
                                    </button>
                                </div>
                            )}

                            {currentStep === 4 && otpSent && (
                                <div>
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-semibold mb-2">Enter Verification Code</h3>
                                        <p className="text-gray-600">
                                            We've sent a code to your phone number
                                        </p>
                                    </div>
                                    <input
                                        type="text"
                                        id="otp"
                                        name="otp"
                                        value={otp}
                                        onChange={handleOtpChange}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border outline-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl letter-spacing-2"
                                        placeholder="Enter 6-digit code"
                                        maxLength={6}
                                    />
                                    {otpError && <p className="text-red-500 text-sm mt-2">{otpError}</p>}
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
                                
                                {currentStep < 4 && (
                                    <button 
                                        type="button" 
                                        onClick={handleNext} 
                                        className="flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors ml-auto"
                                    >
                                        Next
                                        <ChevronRight className="w-5 h-5 ml-2" />
                                    </button>
                                )}
                                
                                {currentStep === 4 && otpSent && (
                                    <button 
                                        type="button"
                                        onClick={verifyOtp}
                                        className="flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors ml-auto"
                                    >
                                        Submit
                                        <ChevronRight className="w-5 h-5 ml-2" />
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