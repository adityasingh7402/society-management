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
        societyAddress: '',
        zipCode: '',
        description: '',
        societyImages: [],
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
        const { name, value, files } = e.target;
        if (name === 'image') {
            setFormData({ ...formData, societyImages: files });
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

        const form = new FormData();
        Object.keys(formData).forEach((key) => {
            if (key === 'societyImages') {
                Array.from(formData[key]).forEach((image) => form.append('societyImages', image));
            } else {
                form.append(key, formData[key]);
            }
        });

        try {
            const token = localStorage.getItem('Society');
            const response = await fetch('/api/Society-Api/update-society-profile', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: form,
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await response.json();
            alert('Profile updated successfully!');
            setFormData(data);
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
                    {['societyName', 'societyType', 'managerName', 'managerPhone', 'managerEmail', 'societyAddress', 'zipCode'].map((field) => (
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

                {/* Upload Images */}
                <div className="flex flex-col">
                    <label className="font-semibold text-gray-700">Upload Society Images:</label>
                    <input
                        type="file"
                        name="image"
                        accept="image/*"
                        multiple
                        onChange={(e) => setFormData({ ...formData, societyImages: e.target.files })}
                        className="mt-2 border border-gray-300 p-3 rounded-md focus:outline-none"
                    />
                </div>

                {/* Image Preview */}
                {formData.societyImages.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Image Preview:</h3>
                        <div className="flex flex-wrap gap-4">
                            {Array.from(formData.societyImages).map((image, index) => (
                                <img
                                    key={index}
                                    src={URL.createObjectURL(image)}
                                    alt={`Preview ${index}`}
                                    className="w-20 h-20 object-cover rounded-md border"
                                />
                            ))}
                        </div>
                    </div>
                )}

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
                        <p className="text-gray-600 mb-4">Make changes if needed before updating.</p>

                        <form onSubmit={handleFinalSubmit} className="space-y-4">
                            {['societyName', 'societyType', 'managerName', 'managerPhone', 'managerEmail', 'societyAddress', 'zipCode', 'description'].map((key) => (
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
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-3 px-6 text-white rounded-md ${
                                    isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                                }`}
                            >
                                {isSubmitting ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                        <button
                            onClick={() => setShowModal(false)}
                            className="w-full mt-4 bg-gray-300 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-400 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
