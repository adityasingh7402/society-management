import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FaArrowLeft } from "react-icons/fa";
import { FiCopy } from "react-icons/fi";

export default function Profile() {
    const [formData, setFormData] = useState({
        name: "",
        phone: "+91", // Default phone number with country code
        additionalNumbers: [], // Dynamic list for additional numbers
        email: "",
        address: "",
        unitNumber: "",
        societyCode: "",
        societyId: "",
        societyName: "",
        tenantId: "", // Change to tenantId
    });
    const [showModal, setShowModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("Tenant");
                if (!token) {
                    router.push("/login");
                    return;
                }

                const response = await fetch("/api/Tenant-Api/get-tenant-details", {
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
        navigator.clipboard.writeText(formData.tenantId); // Copy tenantId instead of residentId
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("Tenant");
            const response = await fetch("/api/Tenant-Api/update-tenant-profile", {
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
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-4">
                <button
                    onClick={() => router.back()} // Navigate back to the previous page
                    className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors"
                >
                    <FaArrowLeft size={18} />
                    <span className="text-base">Back</span>
                </button>
            </div>
            <h1 className="text-4xl font-bold text-blue-600 mb-8 text-center">Tenant Profile</h1>

            <form
                onSubmit={handlePreviewSubmit}
                className="space-y-6 bg-white p-8 shadow-md rounded-lg max-w-4xl mx-auto"
            >
                {/* Read-only fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <label className="font-semibold text-gray-700">Tenant ID:</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="tenantId" // Use tenantId instead of residentId
                                value={formData.tenantId}
                                readOnly
                                className="border-gray-300 rounded-md p-3 bg-gray-100 text-gray-500 focus:outline-none w-full"
                            />
                            {/* <button
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent form submission
                                    handleCopy();
                                }}
                                className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800"
                                title="Copy Tenant ID"
                            >
                                <FiCopy size={20} />
                            </button> */}
                        </div>
                        {/* {copySuccess && (
                            <span className="text-blue-700 text-sm mt-1">Copied!</span>
                        )} */}
                    </div>
                    <div className="flex flex-col">
                        <label className="font-semibold text-gray-700">Society ID:</label>
                        <input
                            type="text"
                            name="societyId"
                            value={formData.societyCode}
                            readOnly
                            className="border-gray-300 rounded-md p-3 bg-gray-100 text-gray-500 focus:outline-none"
                        />
                    </div>
                    {formData.residentCode && (
                        <div className="flex flex-col">
                            <label className="font-semibold text-gray-700">Resident ID:</label>
                            <input
                                type="text"
                                name="societyId"
                                value={formData.residentCode}
                                readOnly
                                className="border-gray-300 rounded-md p-3 bg-gray-100 text-gray-500 focus:outline-none"
                            />
                        </div>
                    )}
                    <div className="flex flex-col">
                        <label className="font-semibold text-gray-700">Society Name:</label>
                        <input
                            type="text"
                            name="societyName"
                            value={formData.societyName}
                            readOnly
                            className="border-gray-300 rounded-md p-3 bg-gray-100 text-gray-500 focus:outline-none"
                        />
                    </div>
                    {formData.parentName && (<div className="flex flex-col">
                        <label className="font-semibold text-gray-700">Onwer Name:</label>
                        <input
                            type="text"
                            name="societyName"
                            value={formData.parentName}
                            readOnly
                            className="border-gray-300 rounded-md p-3 bg-gray-100 text-gray-500 focus:outline-none"
                        />
                    </div>)}
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {["name", "phone", "email", "address", "unitNumber"].map((field) => (
                        <div key={field} className="flex flex-col">
                            <label className="font-semibold text-gray-700 capitalize">{field}:</label>
                            <input
                                type="text"
                                name={field}
                                value={formData[field]}
                                onChange={handleChange}
                                placeholder={`Enter ${field}`}
                                required
                                className="border border-gray-300 rounded-md p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ))}

                    {/* Additional phone numbers */}
                    {formData.additionalNumbers.map((number, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <div className="flex flex-col w-full">
                                <label className="font-semibold text-gray-700">Additional No {index + 1}</label>
                                <input
                                    type="text"
                                    value={number}
                                    onChange={(e) => handleAdditionalNumberChange(index, e.target.value)}
                                    className="border border-gray-300 rounded-md p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                                    placeholder="+913847384738" // Placeholder for additional numbers
                                />
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={handleAddNumber}
                        className="w-full bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 transition-colors"
                    >
                        Add Another Number
                    </button>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-3 px-6 rounded-md hover:bg-blue-600 transition-colors"
                >
                    Preview & Update
                </button>
            </form>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Confirm & Update</h2>
                        <form onSubmit={handleFinalSubmit} className="space-y-4">
                            {["name", "phone", "email", "address", "unitNumber"].map((key) => (
                                <div key={key} className="flex flex-col">
                                    <label className="font-semibold text-gray-700 capitalize">{key}:</label>
                                    <input
                                        type="text"
                                        name={key}
                                        value={formData[key]}
                                        onChange={handleChange}
                                        className="border border-gray-300 rounded-md p-3"
                                    />
                                </div>
                            ))}
                            {/* Additional phone numbers in modal */}
                            {formData.additionalNumbers.map((number, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={number}
                                        onChange={(e) => handleAdditionalNumberChange(index, e.target.value)}
                                        className="border p-3 border-gray-300 rounded-md flex-1"
                                        placeholder="+913847384738"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveNumber(index)}
                                        className="text-red-500"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="bg-gray-300 text-gray-700 py-2 px-6 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-500 text-white py-2 px-6 rounded-md"
                                >
                                    Confirm Update
                                </button>
                            </div>
                        </form>
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
