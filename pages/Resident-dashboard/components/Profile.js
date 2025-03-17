import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft } from "react-icons/fa";

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
        unitNumber: "",
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
                    address: data.address || { street: "", city: "", state: "", pinCode: "" }, // Ensure address object exists
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
        // Add another number only if the first number is valid (starts with +91 and has 10 digits)
        if (formData.phone.length === 13 && formData.phone.startsWith("+91")) {
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

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="classss">
                <button onClick={() => router.back()} className="flex items-center p-4 md:p-6 space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors">
                    <FaArrowLeft size={18} />
                    <span className="text-base">Back</span>
                </button>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4 md:mb-8 text-center">Resident Profile</h1>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 md:py-8">
                {/* Profile Form */}
                <div className="bg-white rounded-lg shadow p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Edit Resident Profile</h2>
                    <form onSubmit={handlePreviewSubmit}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Primary Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Primary Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Additional Phone Numbers */}
                            {formData.additionalNumbers.map((number, index) => (
                                <div key={index}>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Additional Phone {index + 1}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={number}
                                            onChange={(e) => handleAdditionalNumberChange(index, e.target.value)}
                                            className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveNumber(index)}
                                            className="mt-1 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add Another Number Button */}
                            <div className="col-span-1 md:col-span-2">
                                <button
                                    type="button"
                                    onClick={handleAddNumber}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full md:w-auto"
                                >
                                    Add Another Number
                                </button>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Street</label>
                                <input
                                    type="text"
                                    name="street"
                                    value={formData.address.street}
                                    onChange={handleAddressChange}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                    disabled
                                />
                            </div>

                            {/* City */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.address.city}
                                    onChange={handleAddressChange}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                    disabled
                                />
                            </div>

                            {/* State */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.address.state}
                                    onChange={handleAddressChange}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                    disabled
                                />
                            </div>

                            {/* Pin Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Pin Code</label>
                                <input
                                    type="text"
                                    name="pinCode"
                                    value={formData.address.pinCode}
                                    onChange={handleAddressChange}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                    disabled
                                />
                            </div>

                            {/* Unit Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Unit Number</label>
                                <input
                                    type="text"
                                    name="unitNumber"
                                    value={formData.unitNumber}
                                    onChange={handleChange}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Society Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Society Code</label>
                                <input
                                    type="text"
                                    name="societyCode"
                                    value={formData.societyCode}
                                    onChange={handleChange}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Society ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Society ID</label>
                                <input
                                    type="text"
                                    name="societyId"
                                    value={formData.societyId}
                                    onChange={handleChange}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    disabled
                                />
                            </div>

                            {/* Society Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Society Name</label>
                                <input
                                    type="text"
                                    name="societyName"
                                    value={formData.societyName}
                                    onChange={handleChange}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    disabled
                                />
                            </div>

                            {/* Resident ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Resident ID</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="residentId"
                                        value={formData.residentId}
                                        onChange={handleChange}
                                        className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        disabled
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="mt-1 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                                    >
                                        {copySuccess ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full md:w-auto"
                            >
                                Preview Changes
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Preview Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 w-full max-w-2xl">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Preview Changes</h2>
                        <div className="space-y-4">
                            <p><strong>Name:</strong> {formData.name}</p>
                            <p><strong>Primary Phone:</strong> {formData.phone}</p>
                            {formData.additionalNumbers.map((number, index) => (
                                <p key={index}>
                                    <strong>Additional Phone {index + 1}:</strong> {number}
                                </p>
                            ))}
                            <p><strong>Email:</strong> {formData.email}</p>
                            <p><strong>Street:</strong> {formData.street}</p>
                            <p><strong>City:</strong> {formData.city}</p>
                            <p><strong>State:</strong> {formData.state}</p>
                            <p><strong>Pin Code:</strong> {formData.pinCode}</p>
                            <p><strong>Unit Number:</strong> {formData.unitNumber}</p>
                            <p><strong>Society Code:</strong> {formData.societyCode}</p>
                            <p><strong>Society ID:</strong> {formData.societyId}</p>
                            <p><strong>Society Name:</strong> {formData.societyName}</p>
                            <p><strong>Resident ID:</strong> {formData.residentId}</p>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 w-full md:w-auto"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full md:w-auto"
                            >
                                {isSubmitting ? 'Submitting...' : 'Confirm Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}