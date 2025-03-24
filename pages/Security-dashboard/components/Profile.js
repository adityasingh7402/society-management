import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Copy, Plus, Trash2, Edit, Save, Clock, User, Phone, Building, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SecurityProfile() {
    const [formData, setFormData] = useState({
        guardName: "",
        guardPhone: "+91", // Default phone number with country code
        additionalNumbers: [], // Dynamic list for additional numbers
        societyId: "",
        securityId: "",
        societyName: "",
        shiftTimings: {
            start: "",
            end: "",
        },
        address: {
            societyName: "",
            street: "",
            city: "",
            state: "",
            pinCode: ""
        }
    });
    const [showModal, setShowModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("Security");
                if (!token) {
                    router.push("/SecurityLogin");
                    return;
                }

                const response = await fetch("/api/Security-Api/get-security-details", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch profile");
                }

                const data = await response.json();
                setFormData({
                    ...data,
                    additionalNumbers: data.additionalNumbers || [],
                    shiftTimings: data.shiftTimings || { start: "", end: "" },
                    address: data.address || {
                        societyName: data.societyName || "",
                        street: "",
                        city: "",
                        state: "",
                        pinCode: ""
                    }
                });
            } catch (error) {
                console.error("Error fetching profile:", error);
                router.push("/SecurityLogin");
            }
        };

        fetchProfile();
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "start" || name === "end") {
            setFormData({
                ...formData,
                shiftTimings: { ...formData.shiftTimings, [name]: value },
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleAddNumber = () => {
        // Add another number only if the first number is valid (starts with +91 and has 10 digits)
        if (formData.guardPhone.length === 13 && formData.guardPhone.startsWith("+91")) {
            if (formData.additionalNumbers.length < 3) {
                setFormData({
                    ...formData,
                    additionalNumbers: [...formData.additionalNumbers, "+91"], // Pre-fill with country code
                });
            } else {
                alert("You can add a maximum of 3 phone numbers.");
            }
        } else {
            alert("Please enter a valid first phone number (+91 followed by 10 digits).");
        }
    };

    const handleAdditionalNumberChange = (index, value) => {
        const updatedNumbers = [...formData.additionalNumbers];
        updatedNumbers[index] = value;
        setFormData({ ...formData, additionalNumbers: updatedNumbers });
    };

    const handleRemoveNumber = (index) => {
        const updatedNumbers = formData.additionalNumbers.filter((_, i) => i !== index);
        setFormData({ ...formData, additionalNumbers: updatedNumbers });
    };

    const handlePreviewSubmit = (e) => {
        e.preventDefault();
        setShowModal(true);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(formData.securityId);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("Security");
            const response = await fetch("/api/Security-Api/update-security-profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to update profile");
            }

            alert("Profile updated successfully!");
            setShowModal(false);
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-white"
        >
            {/* App Header with Back Button */}
            <div className="sticky top-0 z-10 bg-green-600 text-white shadow-md">
                <div className="flex items-center justify-between p-4">
                    <button 
                        onClick={() => router.back()} 
                        className="flex items-center space-x-2 text-white"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-base font-medium">Back</span>
                    </button>
                    <h1 className="text-xl font-bold">Security Profile</h1>
                    <div className="w-6"></div> {/* Spacer for alignment */}
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Profile Form Card */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden mb-6"
                >
                    <div className="bg-green-500 text-white p-4">
                        <div className="flex items-center space-x-3">
                            <User size={24} />
                            <h2 className="text-xl font-semibold">Edit Profile</h2>
                        </div>
                    </div>
                    
                    <form onSubmit={handlePreviewSubmit} className="p-4">
                        <div className="space-y-5">
                            {/* Guard Name */}
                            <motion.div whileHover={{ scale: 1.01 }} className="bg-gray-50 p-3 rounded-lg">
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                    <User size={16} />
                                    <span>Guard Name</span>
                                </label>
                                <input
                                    type="text"
                                    name="guardName"
                                    value={formData.guardName}
                                    onChange={handleChange}
                                    className="w-full p-3 border-b-2 border-green-300 focus:border-green-500 bg-white rounded-md outline-none transition-all"
                                    required
                                />
                            </motion.div>

                            {/* Primary Phone */}
                            <motion.div whileHover={{ scale: 1.01 }} className="bg-gray-50 p-3 rounded-lg">
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                    <Phone size={16} />
                                    <span>Primary Phone</span>
                                </label>
                                <input
                                    type="text"
                                    name="guardPhone"
                                    value={formData.guardPhone}
                                    onChange={handleChange}
                                    className="w-full p-3 border-b-2 border-green-300 focus:border-green-500 bg-white rounded-md outline-none transition-all"
                                    required
                                />
                            </motion.div>

                            {/* Additional Phone Numbers */}
                            <AnimatePresence>
                                {formData.additionalNumbers.map((number, index) => (
                                    <motion.div 
                                        key={index}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-gray-50 p-3 rounded-lg"
                                    >
                                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                            <Phone size={16} />
                                            <span>Additional Phone {index + 1}</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={number}
                                                onChange={(e) => handleAdditionalNumberChange(index, e.target.value)}
                                                className="flex-grow p-3 border-b-2 border-green-300 focus:border-green-500 bg-white rounded-md outline-none transition-all"
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                type="button"
                                                onClick={() => handleRemoveNumber(index)}
                                                className="bg-red-500 text-white p-2 rounded-md flex items-center justify-center"
                                            >
                                                <Trash2 size={18} />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Add Another Number Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={handleAddNumber}
                                className="flex items-center justify-center space-x-2 w-full bg-green-100 text-green-700 p-3 rounded-lg border border-green-300 hover:bg-green-200 transition-all"
                            >
                                <Plus size={18} />
                                <span>Add Another Number</span>
                            </motion.button>

                            {/* Shift Timings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Shift Start */}
                                <motion.div whileHover={{ scale: 1.01 }} className="bg-gray-50 p-3 rounded-lg">
                                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <Clock size={16} />
                                        <span>Shift Start</span>
                                    </label>
                                    <input
                                        type="time"
                                        name="start"
                                        value={formData.shiftTimings.start}
                                        onChange={handleChange}
                                        className="w-full p-3 border-b-2 border-green-300 focus:border-green-500 bg-white rounded-md outline-none transition-all"
                                        required
                                    />
                                </motion.div>

                                {/* Shift End */}
                                <motion.div whileHover={{ scale: 1.01 }} className="bg-gray-50 p-3 rounded-lg">
                                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                        <Clock size={16} />
                                        <span>Shift End</span>
                                    </label>
                                    <input
                                        type="time"
                                        name="end"
                                        value={formData.shiftTimings.end}
                                        onChange={handleChange}
                                        className="w-full p-3 border-b-2 border-green-300 focus:border-green-500 bg-white rounded-md outline-none transition-all"
                                        required
                                    />
                                </motion.div>
                            </div>

                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <h3 className="text-md font-semibold text-green-800 mb-3 flex items-center">
                                    <Building size={18} className="mr-2" />
                                    Society Information
                                </h3>
                                
                                <div className="space-y-4">
                                    {/* Society ID */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Society ID</label>
                                        <input
                                            type="text"
                                            name="societyId"
                                            value={formData.societyId}
                                            className="w-full p-2 bg-white border border-gray-200 rounded-md text-gray-500"
                                            disabled
                                        />
                                    </div>

                                    {/* Society Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Society Name</label>
                                        <input
                                            type="text"
                                            name="societyName"
                                            value={formData.address.societyName || ""}
                                            className="w-full p-2 bg-white border border-gray-200 rounded-md text-gray-500"
                                            disabled
                                        />
                                    </div>

                                    {/* Security ID */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Security ID</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                name="securityId"
                                                value={formData.securityId}
                                                className="flex-grow p-2 bg-white border border-gray-200 rounded-md text-gray-500"
                                                disabled
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                type="button"
                                                onClick={handleCopy}
                                                className="bg-green-600 text-white p-2 rounded-md flex items-center justify-center"
                                            >
                                                {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                                    <MapPin size={18} className="mr-2" />
                                    Address Information
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Street */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                                        <input
                                            type="text"
                                            value={formData.address.street}
                                            className="w-full p-2 bg-white border border-gray-200 rounded-md text-gray-500"
                                            disabled
                                        />
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={formData.address.city}
                                            className="w-full p-2 bg-white border border-gray-200 rounded-md text-gray-500"
                                            disabled
                                        />
                                    </div>

                                    {/* State */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                        <input
                                            type="text"
                                            value={formData.address.state}
                                            className="w-full p-2 bg-white border border-gray-200 rounded-md text-gray-500"
                                            disabled
                                        />
                                    </div>

                                    {/* Pin Code */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                                        <input
                                            type="text"
                                            value={formData.address.pinCode}
                                            className="w-full p-2 bg-white border border-gray-200 rounded-md text-gray-500"
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            type="submit"
                            className="mt-6 w-full bg-green-600 text-white p-4 rounded-lg font-semibold flex items-center justify-center space-x-2 shadow-md hover:bg-green-700 transition-all"
                        >
                            <Edit size={18} />
                            <span>Preview Changes</span>
                        </motion.button>
                    </form>
                </motion.div>
            </main>

            {/* Preview Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl"
                        >
                            <h2 className="text-xl font-semibold text-green-700 mb-4 flex items-center">
                                <Edit size={20} className="mr-2" />
                                Preview Changes
                            </h2>
                            
                            <div className="space-y-3 max-h-80 overflow-y-auto p-2">
                                <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                                    <User size={18} className="text-green-600 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-500">Guard Name</p>
                                        <p className="font-medium">{formData.guardName}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                                    <Phone size={18} className="text-green-600 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-500">Primary Phone</p>
                                        <p className="font-medium">{formData.guardPhone}</p>
                                    </div>
                                </div>
                                
                                {formData.additionalNumbers.map((number, index) => (
                                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
                                        <Phone size={18} className="text-green-600 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-500">Additional Phone {index + 1}</p>
                                            <p className="font-medium">{number}</p>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                                    <Clock size={18} className="text-green-600 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-500">Shift Timings</p>
                                        <p className="font-medium">{formData.shiftTimings.start} - {formData.shiftTimings.end}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                                    <Building size={18} className="text-green-600 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-500">Society Details</p>
                                        <p className="font-medium">{formData.societyName || formData.address.societyName} (ID: {formData.societyId})</p>
                                        <p className="text-sm">Security ID: {formData.securityId}</p>
                                    </div>
                                </div>
                                
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <MapPin size={18} className="text-green-600 mr-3" />
                                        <p className="text-sm text-gray-500">Address Information</p>
                                    </div>
                                    <div className="mt-2 ml-7">
                                        <p>{formData.address.street}</p>
                                        <p>{formData.address.city}, {formData.address.state}</p>
                                        <p>PIN: {formData.address.pinCode}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg font-medium flex items-center justify-center"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={handleFinalSubmit}
                                    disabled={isSubmitting}
                                    className="flex-1 bg-green-600 text-white p-3 rounded-lg font-medium flex items-center justify-center space-x-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            <span>Confirm Changes</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Submit Loading Overlay */}
            <AnimatePresence>
                {isSubmitting && !showModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    >
                        <motion.div 
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full flex flex-col items-center"
                        >
                            <div className="h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-lg font-semibold text-green-700">Updating your profile...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}