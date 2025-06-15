import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Phone, Mail, MapPin, Building, Copy, Plus, Trash2, Eye, Check } from 'lucide-react';

export default function Profile() {
    const [formData, setFormData] = useState({
        name: "",
        phone: "+91", // Default phone number with country code
        additionalNumbers: [], // Dynamic list for additional numbers
        email: "",
        address: {
            street: "",
            city: "",
            state: "",
            pinCode: "",
        },
        societyCode: "",
        societyId: "",
        societyName: "",
        residentId: "",
    });
    const [showModal, setShowModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("Resident");
                if (!token) {
                    router.push("/login");
                    return;
                }

                const response = await fetch("/api/Resident-Api/get-resident-details", {
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
                    address: data.address || { street: "", city: "", state: "", pinCode: "" },
                });
            } catch (error) {
                console.error("Error fetching profile:", error);
                router.push("/login");
            }
        };

        fetchProfile();
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    
    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            address: {
                ...formData.address,
                [name]: value,
            },
        });
    };

    const handleAddNumber = () => {
        if (formData.phone.length === 13 && formData.phone.startsWith("+91")) {
            if (formData.additionalNumbers.length < 3) {
                setFormData({
                    ...formData,
                    additionalNumbers: [...formData.additionalNumbers, "+91"],
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
        navigator.clipboard.writeText(formData.residentId);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("Resident");
            const response = await fetch("/api/Resident-Api/update-resident-profile", {
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

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    const modalVariants = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: { type: "spring", damping: 25, stiffness: 300 }
        },
        exit: { scale: 0.8, opacity: 0 }
    };

    return (
        <motion.div 
            className="min-h-screen bg-gradient-to-r from-indigo-100 to-purple-50 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Background pattern overlay */}
            <div className="absolute inset-0 z-0 opacity-10" 
                style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366F1' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px'
                }}>
            </div>

            {/* Header */}
            <motion.div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 px-4 shadow-lg"
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
            >
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <motion.button 
                        onClick={() => router.back()} 
                        className="flex items-center space-x-2 text-white bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/30 transition-colors transform hover:scale-105 duration-200"
                        whileTap={{ scale: 0.95 }}
                    >
                        <ChevronLeft size={20} />
                        <span className="text-base font-medium">Back</span>
                    </motion.button>
                    <motion.h1 
                        className="text-xl font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        Profile Settings
                    </motion.h1>
                    <div className="w-24"></div> {/* Spacer for alignment */}
                </div>
            </motion.div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
                {/* Profile Form */}
                <motion.div 
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-indigo-50"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-indigo-100">
                        <h2 className="text-xl font-semibold text-indigo-800 flex items-center">
                            <User size={20} className="mr-2 text-indigo-600" />
                            Edit Resident Profile
                        </h2>
                    </div>
                    
                    <form onSubmit={handlePreviewSubmit} className="p-6 space-y-8">
                        <motion.div 
                            className="space-y-8"
                            variants={containerVariants}
                        >
                            {/* Personal Information Section */}
                            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                                    <h2 className="text-lg font-semibold text-white flex items-center">
                                        <User size={20} className="mr-2" />
                                        Personal Information
                                    </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                            required
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Contact Information Section */}
                            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                                    <h2 className="text-lg font-semibold text-white flex items-center">
                                        <Phone size={20} className="mr-2" />
                                        Contact Information
                                    </h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Primary Phone</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                            required
                                        />
                                    </div>
                                    
                                    {/* Additional Phone Numbers */}
                                    {formData.additionalNumbers.map((number, index) => (
                                        <div key={index} className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Additional Phone {index + 1}
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={number}
                                                    onChange={(e) => handleAdditionalNumberChange(index, e.target.value)}
                                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                />
                                                <motion.button
                                                    type="button"
                                                    onClick={() => handleRemoveNumber(index)}
                                                    className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-colors flex items-center shadow-sm hover:shadow-md"
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <Trash2 size={20} />
                                                </motion.button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Phone Button */}
                                    {formData.additionalNumbers.length < 3 && (
                                        <motion.button
                                            type="button"
                                            onClick={handleAddNumber}
                                            className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 px-4 py-3 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Plus size={20} />
                                            Add Phone Number
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>

                            {/* Address Information Section */}
                            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                                    <h2 className="text-lg font-semibold text-white flex items-center">
                                        <MapPin size={20} className="mr-2" />
                                        Address Information
                                    </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Street</label>
                                        <input
                                            type="text"
                                            name="street"
                                            value={formData.address.street}
                                            onChange={handleAddressChange}
                                            className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.address.city}
                                            onChange={handleAddressChange}
                                            className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={formData.address.state}
                                            onChange={handleAddressChange}
                                            className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Pin Code</label>
                                        <input
                                            type="text"
                                            name="pinCode"
                                            value={formData.address.pinCode}
                                            onChange={handleAddressChange}
                                            className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Society Information Section */}
                            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                                    <h2 className="text-lg font-semibold text-white flex items-center">
                                        <Building size={20} className="mr-2" />
                                        Society Information
                                    </h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Society Code</label>
                                            <input
                                                type="text"
                                                name="societyCode"
                                                value={formData.societyCode}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Society Name</label>
                                            <input
                                                type="text"
                                                name="societyName"
                                                value={formData.societyName}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                                                disabled
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Resident ID</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                name="residentId"
                                                value={formData.residentId}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                                                disabled
                                            />
                                            <motion.button
                                                type="button"
                                                onClick={handleCopy}
                                                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {copySuccess ? <Check size={20} /> : <Copy size={20} />}
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Submit Button */}
                            <motion.div variants={itemVariants} className="pt-4">
                                <motion.button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-lg font-medium"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Eye size={20} />
                                    Preview Changes
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    </form>
                </motion.div>
            </main>

            {/* Preview Modal */}
            {showModal && (
                <motion.div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div 
                        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-indigo-50"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <h2 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center">
                            <Eye size={20} className="mr-2 text-indigo-600" />
                            Preview Changes
                        </h2>
                        
                        <div className="space-y-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
                            <motion.div 
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <motion.p variants={itemVariants} className="p-3 bg-white rounded-lg shadow-sm">
                                    <span className="font-semibold text-indigo-700">Name:</span> {formData.name}
                                </motion.p>
                                <motion.p variants={itemVariants} className="p-3 bg-white rounded-lg shadow-sm">
                                    <span className="font-semibold text-indigo-700">Primary Phone:</span> {formData.phone}
                                </motion.p>
                                
                                {formData.additionalNumbers.map((number, index) => (
                                    <motion.p key={index} variants={itemVariants} className="p-3 bg-white rounded-lg shadow-sm">
                                        <span className="font-semibold text-indigo-700">Additional Phone {index + 1}:</span> {number}
                                    </motion.p>
                                ))}
                                
                                <motion.p variants={itemVariants} className="p-3 bg-white rounded-lg shadow-sm">
                                    <span className="font-semibold text-indigo-700">Email:</span> {formData.email}
                                </motion.p>
                                <motion.p variants={itemVariants} className="p-3 bg-white rounded-lg shadow-sm">
                                    <span className="font-semibold text-indigo-700">Address:</span> {formData.address.street}, {formData.address.city}, {formData.address.state}, {formData.address.pinCode}
                                </motion.p>
                                <motion.p variants={itemVariants} className="p-3 bg-white rounded-lg shadow-sm">
                                    <span className="font-semibold text-indigo-700">Society Code:</span> {formData.societyCode}
                                </motion.p>
                                <motion.p variants={itemVariants} className="p-3 bg-white rounded-lg shadow-sm">
                                    <span className="font-semibold text-indigo-700">Society Name:</span> {formData.societyName}
                                </motion.p>
                                <motion.p variants={itemVariants} className="p-3 bg-white rounded-lg shadow-sm md:col-span-2">
                                    <span className="font-semibold text-indigo-700">Resident ID:</span> {formData.residentId}
                                </motion.p>
                            </motion.div>
                        </div>
                        
                        <div className="mt-6 flex flex-col md:flex-row gap-3 justify-end">
                            <motion.button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-5 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center shadow-sm hover:shadow-md"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                                className={`bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-3 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center transform hover:scale-[1.02] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            >
                                {isSubmitting ? 'Updating...' : 'Confirm Changes'}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
}