import Head from 'next/head';
import { useState } from 'react';
import axios from 'axios'; // Import axios for making requests
import { useRouter } from 'next/router';

export default function SecuritySignup() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        societyId: '',
        guardName: '',
        guardPhone: '+91',
        email: '',
        shiftStart: '',
        shiftEnd: '',
    });
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpError, setOtpError] = useState('');

    const handleNext = () => setCurrentStep(currentStep + 1);
    const handleBack = () => setCurrentStep(currentStep - 1);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleOtpChange = (e) => setOtp(e.target.value);

    const getFormattedPhoneNumber = () => {
        return formData.guardPhone.startsWith('+91') ? formData.guardPhone : `+91${formData.guardPhone}`;
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
            // Verify OTP first
            const otpResponse = await axios.post('/api/verify-otp', {
                otp,
                phoneNumber,
            });

            if (otpResponse.data.success) {
                setOtpError('');

                // Prepare the data for submission
                const dataToSend = {
                    societyId: formData.societyId,
                    guardName: formData.guardName,
                    guardPhone: formData.guardPhone,
                    email: formData.email,
                    shiftStart: formData.shiftStart,
                    shiftEnd: formData.shiftEnd,
                };

                // Submit the form data as JSON
                const submitResponse = await axios.post('/api/Security-Api/security', dataToSend);

                if (submitResponse.data.message === 'Security guard signed up successfully!') {
                    alert('Security guard signed up successfully!');
                    router.push('/Login'); // Redirect after successful signup
                } else {
                    alert('Error in security guard signup.');
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
                <title>Security Signup - Society Management System</title>
                <meta name="description" content="Sign up as a security guard in the management system." />
            </Head>

            <header className="bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-white shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href={"/"}><h1 className="sm:text-xl md:text-3xl font-bold">SocietyManage</h1></Link>
                    <nav>
                        <ul className="flex space-x-6">
                            <a href="/SecurityLogin" className="hover:underline text-lg font-medium">Login</a>
                            <a href="/Contact" className="hover:underline text-lg font-medium">Contact</a>
                        </ul>
                    </nav>
                </div>
            </header>

            {/* Signup Form */}
            <section className="py-20 bg-gray-100 min-h-screen">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-3 lg:mb-10">
                        <h2 className="text-4xl font-bold text-blue-600 mb-5">Security Guard Signup</h2>
                        <p className="text-lg">Fill out the form to register as a security guard.</p>
                    </div>

                    <div className="bg-white shadow-lg rounded-lg p-8">
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                            {/* Step 1 - Basic Details */}
                            {currentStep === 1 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="societyId" className="block text-lg font-medium text-gray-700">
                                            Society ID
                                        </label>
                                        <input
                                            type="text"
                                            id="societyId"
                                            name="societyId"
                                            placeholder="Enter your society ID"
                                            value={formData.societyId}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="guardName" className="block text-lg font-medium text-gray-700">
                                            Guard Name
                                        </label>
                                        <input
                                            type="text"
                                            id="guardName"
                                            name="guardName"
                                            placeholder="Enter guard's full name"
                                            value={formData.guardName}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 2 - Contact Details */}
                            {currentStep === 2 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="guardPhone" className="block text-lg font-medium text-gray-700">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            id="guardPhone"
                                            name="guardPhone"
                                            placeholder="Enter phone number"
                                            value={formData.guardPhone}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-lg font-medium text-gray-700">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="Enter email address"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 3 - Shift Timings */}
                            {currentStep === 3 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="shiftStart" className="block text-lg font-medium text-gray-700">
                                            Shift Start Time
                                        </label>
                                        <input
                                            type="time"
                                            id="shiftStart"
                                            name="shiftStart"
                                            value={formData.shiftStart}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="shiftEnd" className="block text-lg font-medium text-gray-700">
                                            Shift End Time
                                        </label>
                                        <input
                                            type="time"
                                            id="shiftEnd"
                                            name="shiftEnd"
                                            value={formData.shiftEnd}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* OTP and Submit */}
                            {currentStep === 4 && !otpSent && (
                                <div>
                                    <p className="text-lg text-gray-600 mb-4">
                                        Mobile Number: <span className="text-blue-600 font-semibold">{getFormattedPhoneNumber()}</span>
                                    </p>
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
                                <div>
                                    <p className="text-lg text-gray-600 mb-4">
                                        OTP has been sent to <span className="text-blue-600 font-semibold">{getFormattedPhoneNumber()}</span>. Please enter the OTP below to verify your number.
                                    </p>
                                    <label htmlFor="otp" className="block text-lg font-medium text-gray-700">
                                        Enter OTP
                                    </label>
                                    <input
                                        type="text"
                                        id="otp"
                                        name="otp"
                                        placeholder="Enter the OTP received"
                                        value={otp}
                                        onChange={handleOtpChange}
                                        required
                                        className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                                    <button type="button" onClick={handleBack} className="bg-gray-300 px-6 py-3 rounded-md">
                                        Back
                                    </button>
                                )}
                                {currentStep < 4 && (
                                    <button type="button" onClick={handleNext} className="bg-blue-600 text-white px-6 py-3 rounded-md">
                                        Next
                                    </button>
                                )}
                                {currentStep === 4 && otpSent && (
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
