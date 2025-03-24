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
                    router.push("/Login");
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
                router.push("/Login");
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
            className="min-h-screen bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <motion.div 
                className="bg-blue-600 text-white py-4 px-4 shadow-md"
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
            >
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <motion.button 
                        onClick={() => router.back()} 
                        className="flex items-center space-x-2 text-white"
                        whileTap={{ scale: 0.95 }}
                    >
                        <ChevronLeft size={24} />
                        <span className="text-base font-medium">Back</span>
                    </motion.button>
                    <motion.h1 
                        className="text-xl font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        My Profile
                    </motion.h1>
                    <div className="w-10"></div> {/* Spacer for alignment */}
                </div>
            </motion.div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Profile Form */}
                <motion.div 
                    className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                        <h2 className="text-xl font-semibold text-blue-800 flex items-center">
                            <User size={20} className="mr-2 text-blue-600" />
                            Edit Resident Profile
                        </h2>
                    </div>
                    
                    <form onSubmit={handlePreviewSubmit} className="p-6">
                        <motion.div 
                            className="grid grid-cols-1 gap-6 md:grid-cols-2"
                            variants={containerVariants}
                        >
                            {/* Name */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <User size={16} className="mr-2 text-blue-500" />
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                                    required
                                />
                            </motion.div>

                            {/* Primary Phone */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Phone size={16} className="mr-2 text-blue-500" />
                                    Primary Phone
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                                    required
                                />
                            </motion.div>

                            {/* Additional Phone Numbers */}
                            {formData.additionalNumbers.map((number, index) => (
                                <motion.div 
                                    key={index} 
                                    variants={itemVariants}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <Phone size={16} className="mr-2 text-blue-500" />
                                        Additional Phone {index + 1}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={number}
                                            onChange={(e) => handleAdditionalNumberChange(index, e.target.value)}
                                            className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                                        />
                                        <motion.button
                                            type="button"
                                            onClick={() => handleRemoveNumber(index)}
                                            className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center"
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Trash2 size={18} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Add Another Number Button */}
                            <motion.div 
                                className="col-span-1 md:col-span-2"
                                variants={itemVariants}
                            >
                                <motion.button
                                    type="button"
                                    onClick={handleAddNumber}
                                    className="bg-blue-100 text-blue-800 px-4 py-3 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center w-full md:w-auto"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Plus size={18} className="mr-2" />
                                    Add Another Number
                                </motion.button>
                            </motion.div>

                            {/* Email */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Mail size={16} className="mr-2 text-blue-500" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                                    required
                                />
                            </motion.div>

                            {/* Address Fields */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <MapPin size={16} className="mr-2 text-blue-500" />
                                    Street
                                </label>
                                <input
                                    type="text"
                                    name="street"
                                    value={formData.address.street}
                                    onChange={handleAddressChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                                    disabled
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <MapPin size={16} className="mr-2 text-blue-500" />
                                    City
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.address.city}
                                    onChange={handleAddressChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                                    disabled
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <MapPin size={16} className="mr-2 text-blue-500" />
                                    State
                                </label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.address.state}
                                    onChange={handleAddressChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                                    disabled
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <MapPin size={16} className="mr-2 text-blue-500" />
                                    Pin Code
                                </label>
                                <input
                                    type="text"
                                    name="pinCode"
                                    value={formData.address.pinCode}
                                    onChange={handleAddressChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                                    disabled
                                />
                            </motion.div>

                            {/* Society Information */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Building size={16} className="mr-2 text-blue-500" />
                                    Society Code
                                </label>
                                <input
                                    type="text"
                                    name="societyCode"
                                    value={formData.societyCode}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                                    required
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Building size={16} className="mr-2 text-blue-500" />
                                    Society ID
                                </label>
                                <input
                                    type="text"
                                    name="societyId"
                                    value={formData.societyId}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                                    disabled
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Building size={16} className="mr-2 text-blue-500" />
                                    Society Name
                                </label>
                                <input
                                    type="text"
                                    name="societyName"
                                    value={formData.societyName}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed"
                                    disabled
                                />
                            </motion.div>

                            {/* Resident ID */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <User size={16} className="mr-2 text-blue-500" />
                                    Resident ID
                                </label>
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
                                        className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Form Actions */}
                        <motion.div 
                            className="mt-8 flex justify-center md:justify-end"
                            variants={itemVariants}
                        >
                            <motion.button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center w-full md:w-auto"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Eye size={18} className="mr-2" />
                                Preview Changes
                            </motion.button>
                        </motion.div>
                    </form>
                </motion.div>
            </main>

            {/* Preview Modal */}
            {showModal && (
                <motion.div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div 
                        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                            <Eye size={20} className="mr-2 text-blue-600" />
                            Preview Changes
                        </h2>
                        
                        <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                            <motion.div 
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <motion.p variants={itemVariants} className="p-2 bg-white rounded-lg shadow-sm">
                                    <span className="font-semibold text-blue-700">Name:</span> {formData.name}
                                </motion.p>
                                <motion.p variants={itemVariants} className="p-2 bg-white rounded-lg shadow-sm">
                                    <span className="font-semibold text-blue-700">Primary Phone:</span> {formData.phone}
                                </motion.p>
                                
                                {formData.additionalNumbers.map((number, index) => (
                                    <motion.p key={index} variants={itemVariants} className="p-2 bg-white rounded-lg shadow-sm">
                                        <span className="font-semibold text-blue-700">Additional Phone {index + 1}:</span> {number}
                                    </motion.p>
                                ))}
                                
                                <motion.p variants={itemVariants} className="p-2 bg-white rounded-lg shadow-sm">
                                    <span className="font-semibold text-blue-700">Email:</span> {formData.email}
                                </motion.p>
                                <motion.p variants={itemVariants} className="p-2 bg-white rounded-lg shadow-sm">
                                    <span className="font-semibold text-blue-700">Address:</span> {formData.address.street}, {formData.address.city}, {formData.address.state}, {formData.address.pinCode}
                                </motion.p>
                                <motion.p variants={itemVariants} className="p-2 bg-white rounded-lg shadow-sm">
                                    <span className="font-semibold text-blue-700">Society Code:</span> {formData.societyCode}
                                </motion.p>
                                <motion.p variants={itemVariants} className="p-2 bg-white rounded-lg shadow-sm">
                                    <span className="font-semibold text-blue-700">Society Name:</span> {formData.societyName}
                                </motion.p>
                                <motion.p variants={itemVariants} className="p-2 bg-white rounded-lg shadow-sm md:col-span-2">
                                    <span className="font-semibold text-blue-700">Resident ID:</span> {formData.residentId}
                                </motion.p>
                            </motion.div>
                        </div>
                        
                        <div className="mt-6 flex flex-col md:flex-row gap-3 justify-end">
                            <motion.button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="bg-gray-200 text-gray-800 px-5 py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                                className={`bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center ${isSubmitting ? 'opacity-70' : ''}`}
                                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            >
                                {isSubmitting ? 'Submitting...' : 'Confirm Changes'}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
}