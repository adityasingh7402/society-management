import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FaArrowLeft } from "react-icons/fa";

export default function SecurityProfile() {
    const [formData, setFormData] = useState({
        guardName: "",
        guardPhone: "+91",
        societyId: "",
        securityId: "",
        shiftTimings: {
            start: "",
            end: "",
        },
    });
    const [showModal, setShowModal] = useState(false);
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
                    shiftTimings: data.shiftTimings || { start: "", end: "" },
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

    const handlePreviewSubmit = (e) => {
        e.preventDefault();
        setShowModal(true);
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
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors"
                >
                    <FaArrowLeft size={18} />
                    <span className="text-base">Back</span>
                </button>
            </div>
            <h1 className="text-4xl font-bold text-blue-600 mb-8 text-center">Security Guard Profile</h1>

            <form
                onSubmit={handlePreviewSubmit}
                className="space-y-6 bg-white p-8 shadow-md rounded-lg max-w-4xl mx-auto"
            >
                {/* Read-only fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <label className="font-semibold text-gray-700">Security ID:</label>
                        <input
                            type="text"
                            name="securityId"
                            value={formData.securityId}
                            readOnly
                            className="border-gray-300 rounded-md p-3 bg-gray-100 text-gray-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="font-semibold text-gray-700">Society ID:</label>
                        <input
                            type="text"
                            name="societyId"
                            value={formData.societyId}
                            readOnly
                            className="border-gray-300 rounded-md p-3 bg-gray-100 text-gray-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {["guardName", "guardPhone"].map((field) => (
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

                    <div className="flex flex-col">
                        <label className="font-semibold text-gray-700">Shift Start:</label>
                        <input
                            type="time"
                            name="start"
                            value={formData.shiftTimings.start}
                            onChange={handleChange}
                            required
                            className="border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="font-semibold text-gray-700">Shift End:</label>
                        <input
                            type="time"
                            name="end"
                            value={formData.shiftTimings.end}
                            onChange={handleChange}
                            required
                            className="border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
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
                            {["guardName", "guardPhone"].map((key) => (
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
                            <div className="flex flex-col">
                                <label className="font-semibold text-gray-700">Shift Start:</label>
                                <input
                                    type="time"
                                    name="start"
                                    value={formData.shiftTimings.start}
                                    onChange={handleChange}
                                    className="border border-gray-300 rounded-md p-3"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-semibold text-gray-700">Shift End:</label>
                                <input
                                    type="time"
                                    name="end"
                                    value={formData.shiftTimings.end}
                                    onChange={handleChange}
                                    className="border border-gray-300 rounded-md p-3"
                                />
                            </div>
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
