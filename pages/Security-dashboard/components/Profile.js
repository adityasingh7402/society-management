import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft } from "react-icons/fa";

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
                    router.push("/Login");
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
                router.push("/Login");
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
        <div className="min-h-screen bg-gray-100">
            <div className="classss">
                <button onClick={() => router.back()} className="flex items-center p-4 md:p-6 space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors">
                    <FaArrowLeft size={18} />
                    <span className="text-base">Back</span>
                </button>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4 md:mb-8 text-center">Security Guard Profile</h1>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 md:py-8">
                {/* Profile Form */}
                <div className="bg-white rounded-lg shadow p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Edit Security Guard Profile</h2>
                    <form onSubmit={handlePreviewSubmit}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                            {/* Guard Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Guard Name</label>
                                <input
                                    type="text"
                                    name="guardName"
                                    value={formData.guardName}
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
                                    name="guardPhone"
                                    value={formData.guardPhone}
                                    onChange={handleChange}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Additional Phone Numbers */}
                            {formData.additionalNumbers && formData.additionalNumbers.map((number, index) => (
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

                            {/* Shift Start */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Shift Start</label>
                                <input
                                    type="time"
                                    name="start"
                                    value={formData.shiftTimings.start}
                                    onChange={handleChange}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Shift End */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Shift End</label>
                                <input
                                    type="time"
                                    name="end"
                                    value={formData.shiftTimings.end}
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
                                    value={formData.societyName || ""}
                                    className="mt-1 block w-full outline-0 hover:border-b hover:border-blue-500 focus:border-b px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    disabled
                                />
                            </div>

                            {/* Security ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Security ID</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="securityId"
                                        value={formData.securityId}
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

                            {/* Address Section - All fields uneditable */}
                            <div className="col-span-1 md:col-span-2 mt-4">
                                <h3 className="text-md font-semibold text-gray-700 mb-3">Address Information</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                                    {/* Street */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Street</label>
                                        <input
                                            type="text"
                                            value={formData.address.street}
                                            className="mt-1 block w-full outline-0 bg-gray-50 px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm sm:text-sm"
                                            disabled
                                        />
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">City</label>
                                        <input
                                            type="text"
                                            value={formData.address.city}
                                            className="mt-1 block w-full outline-0 bg-gray-50 px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm sm:text-sm"
                                            disabled
                                        />
                                    </div>

                                    {/* State */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">State</label>
                                        <input
                                            type="text"
                                            value={formData.address.state}
                                            className="mt-1 block w-full outline-0 bg-gray-50 px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm sm:text-sm"
                                            disabled
                                        />
                                    </div>

                                    {/* Pin Code */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">PIN Code</label>
                                        <input
                                            type="text"
                                            value={formData.address.pinCode}
                                            className="mt-1 block w-full outline-0 bg-gray-50 px-1 py-2 md:py-3 rounded-md border-gray-300 shadow-sm sm:text-sm"
                                            disabled
                                        />
                                    </div>
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
                            <p><strong>Guard Name:</strong> {formData.guardName}</p>
                            <p><strong>Primary Phone:</strong> {formData.guardPhone}</p>
                            {formData.additionalNumbers && formData.additionalNumbers.map((number, index) => (
                                <p key={index}>
                                    <strong>Additional Phone {index + 1}:</strong> {number}
                                </p>
                            ))}
                            <p><strong>Shift Start:</strong> {formData.shiftTimings.start}</p>
                            <p><strong>Shift End:</strong> {formData.shiftTimings.end}</p>
                            <p><strong>Society ID:</strong> {formData.societyId}</p>
                            <p><strong>Society Name:</strong> {formData.societyName || ""}</p>
                            <p><strong>Security ID:</strong> {formData.securityId}</p>
                            
                            {/* Address section in preview */}
                            <div className="mt-4">
                                <p className="font-semibold">Address Information:</p>
                                <p><strong>Street:</strong> {formData.address.street}</p>
                                <p><strong>City:</strong> {formData.address.city}</p>
                                <p><strong>State:</strong> {formData.address.state}</p>
                                <p><strong>PIN Code:</strong> {formData.address.pinCode}</p>
                            </div>
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

            {/* Submit state */}
            {isSubmitting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                        <p className="text-lg font-semibold text-blue-600">Submitting...</p>
                    </div>
                </div>
            )}
        </div>
    );
}