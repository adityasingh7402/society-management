import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';

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
    const [societies, setSocieties] = useState([]); // List of societies for dropdown
    const [filteredSocieties, setFilteredSocieties] = useState([]); // Filtered list based on user input

    const handleNext = () => setCurrentStep(currentStep + 1);
    const handleBack = () => setCurrentStep(currentStep - 1);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Ensure societies is an array before filtering
        if (name === 'societyName' && Array.isArray(societies)) {
            const filtered = societies.filter(society =>
                society?.societyName?.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredSocieties(filtered);
        }

        console.log("so", societies);
        console.log("fs", filteredSocieties);
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
        setFilteredSocieties([]); // Clear the dropdown after selection
    };

    const handleOtpChange = (e) => setOtp(e.target.value);

    const getFormattedPhoneNumber = () => {
        return formData.phone.startsWith('+91') ? formData.phone : `+91${formData.phone}`;
    };

    const sendOtp = async () => {
        const phoneNumber = getFormattedPhoneNumber();
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
                setSocieties(data.societies || []); // Ensure it stays an array
            } catch (error) {
                console.error("Failed to fetch societies", error);
            }
        };

        fetchSocieties();
    }, []);

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
                        <p className="text-lg">Fill out the form to register as a resident in your society.</p>
                    </div>

                    {/* Form Sections */}
                    <div className="bg-white shadow-lg rounded-lg p-8">
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                            {/* Step 1 - Society Details */}
                            {currentStep === 1 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                                    {/* Society Name Input with Autocomplete */}
                                    <div className="w-full relative">
                                        <label htmlFor="societyName" className="block text-lg font-medium text-gray-700">
                                            Society Name
                                        </label>
                                        <input
                                            type="text"
                                            id="societyName"
                                            name="societyName"
                                            value={formData.societyName || ""}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter your society's name"
                                        />

                                        {/* Autocomplete Suggestions */}
                                        {filteredSocieties.length > 0 && (
                                            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
                                                {filteredSocieties.map((society) => (
                                                    <div
                                                        key={society._id}  // ✅ Fixed Key
                                                        onClick={() => handleSocietySelect(society)}
                                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                                    >
                                                        {society.societyName}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Street Input */}
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
                                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter street"
                                        />
                                    </div>

                                    {/* City Input */}
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
                                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter city"
                                        />
                                    </div>

                                    {/* State Input */}
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
                                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter state"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 2 - Contact Details */}
                            {currentStep === 2 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                                    <div className="w-full">
                                        <label htmlFor="name" className="block text-lg font-medium text-gray-700">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                    <div className="w-full">
                                        <label htmlFor="phone" className="block text-lg font-medium text-gray-700">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter your phone number"
                                        />
                                    </div>

                                    <div className="w-full">
                                        <label htmlFor="email" className="block text-lg font-medium text-gray-700">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter your email address"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 3 - Address and Unit Number */}
                            {currentStep === 3 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                                    {/* <div className="w-full">
                                        <label htmlFor="address" className="block text-lg font-medium text-gray-700">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            id="address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter your address"
                                        />
                                    </div> */}

                                    <div className="w-full">
                                        <label htmlFor="unitNumber" className="block text-lg font-medium text-gray-700">
                                            Unit Number
                                        </label>
                                        <input
                                            type="text"
                                            id="unitNumber"
                                            name="unitNumber"
                                            value={formData.unitNumber}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter your unit number"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 4 - OTP Verification */}
                            {currentStep === 4 && !otpSent && (
                                <div className="w-full">
                                    <div className="mobile-show text-2xl text-gray-700 bg-gray-100 p-2 rounded-md shadow-md">
                                        OTP sends to this no. <span className="font-bold text-gray-900">+91 {formData.phone}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={sendOtp}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-md"
                                    >
                                        Send OTP
                                    </button>
                                </div>
                            )}

                            {currentStep === 4 && otpSent && (
                                <div className="w-full">
                                    <label htmlFor="otp" className="block text-lg font-medium text-gray-700">
                                        Enter OTP
                                    </label>
                                    <input
                                        type="text"
                                        id="otp"
                                        name="otp"
                                        value={otp}
                                        onChange={handleOtpChange}
                                        required
                                        className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter the OTP sent to your phone"
                                    />
                                    {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
                                    <button
                                        type="button"
                                        onClick={verifyOtp}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-md mt-4"
                                    >
                                        Verify OTP
                                    </button>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-6">
                                {currentStep > 1 && (
                                    <button type="button" onClick={handleBack} className="bg-gray-300 text-black px-6 py-3 rounded-md">
                                        Back
                                    </button>
                                )}
                                {currentStep < 4 && (
                                    <button type="button" onClick={handleNext} className="bg-blue-600 text-white px-6 py-3 rounded-md">
                                        Next
                                    </button>
                                )}
                                {currentStep === 4 && (
                                    <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-md">
                                        Submit
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