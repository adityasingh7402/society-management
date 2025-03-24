import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Preloader from '@/pages/components/Preloader';
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Home, 
  FileText, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Save
} from 'lucide-react';

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

    if (loading) return <Preloader />;

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-blue-600 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                            <Building className="mr-2" size={28} />
                            Society Profile
                        </h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Profile Form */}
                <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-blue-100">
                    <h2 className="text-xl font-semibold text-blue-800 mb-6 flex items-center">
                        <Edit3 className="mr-2" size={20} />
                        Edit Society Profile
                    </h2>
                    <form onSubmit={handlePreviewSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Society ID */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Calendar className="mr-1 text-blue-600" size={16} />
                                    Society ID
                                </label>
                                <input
                                    type="text"
                                    name="societyId"
                                    value={formData.societyId}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-500 bg-gray-50"
                                    disabled
                                />
                            </div>

                            {/* Society Name */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Building className="mr-1 text-blue-600" size={16} />
                                    Society Name
                                </label>
                                <input
                                    type="text"
                                    name="societyName"
                                    value={formData.societyName}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 hover:border-blue-300"
                                    required
                                />
                            </div>

                            {/* Society Type */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <FileText className="mr-1 text-blue-600" size={16} />
                                    Society Type
                                </label>
                                <input
                                    type="text"
                                    name="societyType"
                                    value={formData.societyType}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 hover:border-blue-300"
                                    required
                                />
                            </div>

                            {/* Manager Name */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <User className="mr-1 text-blue-600" size={16} />
                                    Manager Name
                                </label>
                                <input
                                    type="text"
                                    name="managerName"
                                    value={formData.managerName}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 hover:border-blue-300"
                                    required
                                />
                            </div>

                            {/* Manager Phone */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Phone className="mr-1 text-blue-600" size={16} />
                                    Manager Phone
                                </label>
                                <input
                                    type="text"
                                    name="managerPhone"
                                    value={formData.managerPhone}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 hover:border-blue-300"
                                    required
                                />
                            </div>

                            {/* Manager Email */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Mail className="mr-1 text-blue-600" size={16} />
                                    Manager Email
                                </label>
                                <input
                                    type="email"
                                    name="managerEmail"
                                    value={formData.managerEmail}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 hover:border-blue-300"
                                    required
                                />
                            </div>

                            {/* Street */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Home className="mr-1 text-blue-600" size={16} />
                                    Street
                                </label>
                                <input
                                    type="text"
                                    name="street"
                                    value={formData.street}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 hover:border-blue-300"
                                    required
                                />
                            </div>

                            {/* City */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <MapPin className="mr-1 text-blue-600" size={16} />
                                    City
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 hover:border-blue-300"
                                    required
                                />
                            </div>

                            {/* State */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <MapPin className="mr-1 text-blue-600" size={16} />
                                    State
                                </label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 hover:border-blue-300"
                                    required
                                />
                            </div>

                            {/* Pin Code */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <MapPin className="mr-1 text-blue-600" size={16} />
                                    Pin Code
                                </label>
                                <input
                                    type="text"
                                    name="pinCode"
                                    value={formData.pinCode}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 hover:border-blue-300"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <FileText className="mr-1 text-blue-600" size={16} />
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 hover:border-blue-300"
                                    rows="4"
                                    required
                                />
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="mt-6 flex justify-center md:justify-end">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 shadow-md transition-all duration-200 flex items-center w-full md:w-auto justify-center"
                            >
                                <Edit3 className="mr-2" size={18} />
                                Preview Changes
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Preview Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 w-full max-w-md md:max-w-2xl">
                        <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                            <CheckCircle className="mr-2" size={20} />
                            Preview Changes
                        </h2>
                        <div className="space-y-3 bg-blue-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                            <div className="flex items-start">
                                <Calendar className="mr-2 text-blue-600 mt-1 flex-shrink-0" size={16} />
                                <div>
                                    <p className="text-sm text-gray-500">Society ID</p>
                                    <p className="font-medium">{formData.societyId}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <Building className="mr-2 text-blue-600 mt-1 flex-shrink-0" size={16} />
                                <div>
                                    <p className="text-sm text-gray-500">Society Name</p>
                                    <p className="font-medium">{formData.societyName}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <FileText className="mr-2 text-blue-600 mt-1 flex-shrink-0" size={16} />
                                <div>
                                    <p className="text-sm text-gray-500">Society Type</p>
                                    <p className="font-medium">{formData.societyType}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <User className="mr-2 text-blue-600 mt-1 flex-shrink-0" size={16} />
                                <div>
                                    <p className="text-sm text-gray-500">Manager Name</p>
                                    <p className="font-medium">{formData.managerName}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <Phone className="mr-2 text-blue-600 mt-1 flex-shrink-0" size={16} />
                                <div>
                                    <p className="text-sm text-gray-500">Manager Phone</p>
                                    <p className="font-medium">{formData.managerPhone}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <Mail className="mr-2 text-blue-600 mt-1 flex-shrink-0" size={16} />
                                <div>
                                    <p className="text-sm text-gray-500">Manager Email</p>
                                    <p className="font-medium">{formData.managerEmail}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <Home className="mr-2 text-blue-600 mt-1 flex-shrink-0" size={16} />
                                <div>
                                    <p className="text-sm text-gray-500">Street</p>
                                    <p className="font-medium">{formData.street}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <MapPin className="mr-2 text-blue-600 mt-1 flex-shrink-0" size={16} />
                                <div>
                                    <p className="text-sm text-gray-500">City</p>
                                    <p className="font-medium">{formData.city}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <MapPin className="mr-2 text-blue-600 mt-1 flex-shrink-0" size={16} />
                                <div>
                                    <p className="text-sm text-gray-500">State</p>
                                    <p className="font-medium">{formData.state}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <MapPin className="mr-2 text-blue-600 mt-1 flex-shrink-0" size={16} />
                                <div>
                                    <p className="text-sm text-gray-500">Pin Code</p>
                                    <p className="font-medium">{formData.pinCode}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <FileText className="mr-2 text-blue-600 mt-1 flex-shrink-0" size={16} />
                                <div>
                                    <p className="text-sm text-gray-500">Description</p>
                                    <p className="font-medium">{formData.description}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 border border-gray-300 flex items-center justify-center"
                            >
                                <XCircle className="mr-2" size={18} />
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md flex items-center justify-center"
                            >
                                <Save className="mr-2" size={18} />
                                {isSubmitting ? 'Submitting...' : 'Confirm Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}