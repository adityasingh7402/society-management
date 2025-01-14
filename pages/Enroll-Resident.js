import Head from 'next/head';
import { useState } from 'react';
import axios from 'axios'; // Import axios for making requests
import { useRouter } from 'next/router';

export default function ResidentSignup() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        societyId: '',
        name: '',
        phone: '',
        email: '',
        address: '',
        unitNumber: '',
    });
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpError, setOtpError] = useState('');

    const handleNext = () => setCurrentStep(currentStep + 1);
    const handleBack = () => setCurrentStep(currentStep - 1);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleOtpChange = (e) => setOtp(e.target.value);

    const sendOtp = async () => {
        const phoneNumber = `+91${formData.phone}`;
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
        try {
            // Verify OTP
            const otpResponse = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    otp: otp,
                    phoneNumber: `+91${formData.phone}`, // Format the phone number correctly
                }),
            });

            const otpData = await otpResponse.json();

            if (otpData.success) {
                setOtpError('');

                // OTP is valid, now submit the resident data
                const formDataToSubmit = new FormData();

                // Loop through the form data and append it to the FormData object
                Object.keys(formData).forEach((key) => {
                    formDataToSubmit.append(key, formData[key]);
                });

                // Send the resident data to the server
                const submitResponse = await fetch('/api/Resident-Api/resident', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }, // Set Content-Type to JSON
                    body: JSON.stringify(formData), // Convert formData to JSON
                });

                const submitData = await submitResponse.json();

                if (submitData.message === 'Resident signed up successfully!') {
                    alert('Resident signed up successfully!');
                    router.push('/Login'); // Redirect after successful signup
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


    return (
        <div className="bg-gray-50 min-h-screen">
            <Head>
                <title>Resident Signup - Society Management System</title>
                <meta name="description" content="Sign up to your society in our management system." />
            </Head>

            <header className="bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-white shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="sm:text-xl md:text-3xl font-bold">SocietyManage</h1>
                    <nav>
                        <ul className="flex space-x-6">
                            <a href="/" className="hover:underline text-lg font-medium">Home</a>
                            <a href="/login" className="hover:underline text-lg font-medium">Login</a>
                        </ul>
                    </nav>
                </div>
            </header>

            {/* Signup Form */}
            <section className="py-20 bg-gray-100 min-h-screen">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-3 lg:mb-10">
                        <h2 className="text-4xl font-bold text-blue-600 mb-5">Resident Signup</h2>
                        <p className="text-lg">Fill out the form to register as a resident in your society.</p>
                    </div>

                    {/* Form Sections */}
                    <div className="bg-white shadow-lg rounded-lg p-8">
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                            {/* Step 1 - Resident Details */}
                            {currentStep === 1 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                                    <div className="w-full">
                                        <label htmlFor="societyId" className="block text-lg font-medium text-gray-700">
                                            Society ID
                                        </label>
                                        <input
                                            type="text"
                                            id="societyId"
                                            name="societyId"
                                            value={formData.societyId}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter your society's ID"
                                        />
                                    </div>

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
                                </div>
                            )}

                            {/* Step 2 - Contact Details */}
                            {currentStep === 2 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
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
                                    <div className="w-full">
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
                                    </div>

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
