import { useState, useEffect } from 'react';
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
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-4xl font-bold text-blue-600 mb-8 text-center">Society Profile</h1>

            <form
                onSubmit={handlePreviewSubmit}
                className="space-y-6 bg-white p-8 shadow-md rounded-lg max-w-4xl mx-auto"
            >
                {/* Read-only Society ID */}
                <div className="flex flex-col mb-6">
                    <label className="font-semibold text-gray-700">Society ID:</label>
                    <input
                        type="text"
                        name="societyId"
                        value={formData.societyId}
                        readOnly
                        className="border-gray-300 rounded-md p-3 bg-gray-100 text-gray-500 focus:outline-none"
                    />
                </div>

                {/* Two inputs per row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['societyName', 'societyType', 'managerName', 'managerPhone', 'managerEmail', 'street', 'city', 'state', 'pinCode'].map((field) => (
                        <div key={field} className="flex flex-col">
                            <label className="font-semibold text-gray-700 capitalize">
                                {field.replace(/([A-Z])/g, ' $1')}:
                            </label>
                            <input
                                type={field === 'managerEmail' ? 'email' : 'text'}
                                name={field}
                                value={formData[field]}
                                onChange={handleChange}
                                placeholder={`Enter ${field}`}
                                required
                                className="border border-gray-300 rounded-md p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ))}
                </div>

                {/* Description */}
                <div className="flex flex-col">
                    <label className="font-semibold text-gray-700">Description:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter a brief description"
                        required
                        className="border border-gray-300 rounded-md p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Confirm & Update</h2>
                        <p className="text-gray-600 mb-4">Make changes if needed before updating.</p>

                        <form onSubmit={handleFinalSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['societyName', 'societyType', 'managerName', 'managerPhone', 'managerEmail', 'street', 'city', 'state', 'pinCode', 'description'].map((key) => (
                                <div key={key} className="flex flex-col">
                                    <label className="font-semibold text-gray-700 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1')}:
                                    </label>
                                    <input
                                        type="text"
                                        name={key}
                                        value={formData[key]}
                                        onChange={handleChange}
                                        className="border border-gray-300 rounded-md p-3"
                                    />
                                </div>
                            ))}
                            <div className="col-span-1 md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-3 px-6 text-white rounded-md ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                                        }`}
                                >
                                    {isSubmitting ? 'Updating...' : 'Update Profile'}
                                </button>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full bg-gray-300 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
