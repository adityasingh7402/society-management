import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SocietyProfile() {
    const [formData, setFormData] = useState({
        societyId: '',
        societyName: '',
        societyType: '',
        managerName: '',
        managerPhone: '',
        managerEmail: '',
        street: '',
        city: '',
        state: '',
        pinCode: '',
        description: '',
    });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('Society');
                if (!token) {
                    router.push('/societyLogin');
                    return;
                }

                const response = await fetch('/api/Society-Api/get-society-details', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }

                const data = await response.json();
                setFormData(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
                if (error.message === 'Failed to fetch profile') {
                    router.push('/societyLogin');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePreviewSubmit = (e) => {
        e.preventDefault();
        setShowModal(true);
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('Society');
            const response = await fetch('/api/Society-Api/update-society-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await response.json();
            alert('Profile updated successfully!');
            setFormData(data.data); // Update form data with the response data
            setShowModal(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Society Profile</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Society Profile</h2>
                    <form onSubmit={handlePreviewSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Society ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Society ID</label>
                                <input
                                    type="text"
                                    name="societyId"
                                    value={formData.societyId}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md outline-0 hover:border-b hover:border-blue-500 focus:border-b border-gray-300 px-1 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                                    className="mt-1 block w-full rounded-md outline-0 hover:border-b hover:border-blue-500 focus:border-b border-gray-300 px-1 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Society Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Society Type</label>
                                <input
                                    type="text"
                                    name="societyType"
                                    value={formData.societyType}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md outline-0 hover:border-b hover:border-blue-500 focus:border-b border-gray-300 px-1 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Manager Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Manager Name</label>
                                <input
                                    type="text"
                                    name="managerName"
                                    value={formData.managerName}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md outline-0 hover:border-b hover:border-blue-500 focus:border-b border-gray-300 px-1 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Manager Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Manager Phone</label>
                                <input
                                    type="text"
                                    name="managerPhone"
                                    value={formData.managerPhone}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md outline-0 hover:border-b hover:border-blue-500 focus:border-b border-gray-300 px-1 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Manager Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Manager Email</label>
                                <input
                                    type="email"
                                    name="managerEmail"
                                    value={formData.managerEmail}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md outline-0 hover:border-b hover:border-blue-500 focus:border-b border-gray-300 px-1 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Street */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Street</label>
                                <input
                                    type="text"
                                    name="street"
                                    value={formData.street}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md outline-0 hover:border-b hover:border-blue-500 focus:border-b border-gray-300 px-1 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* City */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md outline-0 hover:border-b hover:border-blue-500 focus:border-b border-gray-300 px-1 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* State */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md outline-0 hover:border-b hover:border-blue-500 focus:border-b border-gray-300 px-1 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Pin Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Pin Code</label>
                                <input
                                    type="text"
                                    name="pinCode"
                                    value={formData.pinCode}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md outline-0 hover:border-b hover:border-blue-500 focus:border-b border-gray-300 px-1 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md outline-0 hover:border-b hover:border-blue-500 focus:border-b border-gray-300 px-1 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    rows="4"
                                    required
                                />
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                Preview Changes
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Preview Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview Changes</h2>
                        <div className="space-y-4">
                            <p><strong>Society ID:</strong> {formData.societyId}</p>
                            <p><strong>Society Name:</strong> {formData.societyName}</p>
                            <p><strong>Society Type:</strong> {formData.societyType}</p>
                            <p><strong>Manager Name:</strong> {formData.managerName}</p>
                            <p><strong>Manager Phone:</strong> {formData.managerPhone}</p>
                            <p><strong>Manager Email:</strong> {formData.managerEmail}</p>
                            <p><strong>Street:</strong> {formData.street}</p>
                            <p><strong>City:</strong> {formData.city}</p>
                            <p><strong>State:</strong> {formData.state}</p>
                            <p><strong>Pin Code:</strong> {formData.pinCode}</p>
                            <p><strong>Description:</strong> {formData.description}</p>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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