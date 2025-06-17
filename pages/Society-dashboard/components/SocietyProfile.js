import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';
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
  Save,
  Briefcase,
  Clock,
  Globe,
  Info,
  ArrowLeft,
  Image,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2
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
    const [editMode, setEditMode] = useState(false);
    const [societyImages, setSocietyImages] = useState([
        '/images/default-society-1.jpg',
        '/images/default-society-2.jpg'
    ]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [newImageURL, setNewImageURL] = useState('');
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
                
                // In a real app, you'd fetch society images here
                // Example: if (data.images && data.images.length > 0) setSocietyImages(data.images);
                
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
            setEditMode(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleEditMode = () => {
        setEditMode(!editMode);
    };
    
    const nextImage = () => {
        setCurrentImageIndex((prevIndex) => 
            prevIndex === societyImages.length - 1 ? 0 : prevIndex + 1
        );
    };
    
    const prevImage = () => {
        setCurrentImageIndex((prevIndex) => 
            prevIndex === 0 ? societyImages.length - 1 : prevIndex - 1
        );
    };
    
    const addNewImage = () => {
        if (newImageURL.trim() !== '') {
            setSocietyImages([...societyImages, newImageURL]);
            setNewImageURL('');
            setShowImageModal(false);
            
            // In a real app, you'd make an API call to save the image to the backend
            // Example: saveImageToBackend(newImageURL);
        }
    };
    
    const removeImage = (index) => {
        if (societyImages.length > 1) {
            const newImages = [...societyImages];
            newImages.splice(index, 1);
            setSocietyImages(newImages);
            
            if (currentImageIndex >= newImages.length) {
                setCurrentImageIndex(newImages.length - 1);
            }
            
            // In a real app, you'd make an API call to remove the image from the backend
            // Example: removeImageFromBackend(societyImages[index]);
        } else {
            alert('At least one society image is required');
        }
    };

    if (loading) return <PreloaderSociety />;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                            <Building className="mr-3" size={32} />
                            Society Management Hub
                        </h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Society Image Slider */}
                <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200 mb-8">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            <Image className="mr-2 text-blue-600" size={20} />
                            Society Image Gallery
                        </h2>
                        <button 
                            onClick={() => setShowImageModal(true)}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm transition duration-200"
                        >
                            <Plus size={16} className="mr-1" />
                            Add New Image
                        </button>
                    </div>
                    
                    <div className="relative h-80 bg-gray-900">
                        {societyImages.length > 0 ? (
                            <>
                                <img 
                                    src={societyImages[currentImageIndex]} 
                                    alt={`Society Image ${currentImageIndex + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                
                                {/* Image Navigation */}
                                <div className="absolute inset-0 flex items-center justify-between px-4">
                                    <button 
                                        onClick={prevImage}
                                        className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition duration-200"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button 
                                        onClick={nextImage}
                                        className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition duration-200"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                                
                                {/* Image Counter and Delete Button */}
                                <div className="absolute bottom-4 left-0 right-0 flex justify-between items-center px-4">
                                    <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                                        {currentImageIndex + 1} / {societyImages.length}
                                    </div>
                                    <button 
                                        onClick={() => removeImage(currentImageIndex)}
                                        className="bg-red-500 bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition duration-200"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white">
                                <div className="text-center">
                                    <Image size={48} className="mx-auto mb-3 opacity-40" />
                                    <p>No society images available</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Image Thumbnails */}
                    <div className="p-4 bg-gray-50 overflow-x-auto">
                        <div className="flex space-x-3">
                            {societyImages.map((image, index) => (
                                <div 
                                    key={index} 
                                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer ${
                                        index === currentImageIndex ? 'border-blue-500' : 'border-transparent'
                                    }`}
                                    onClick={() => setCurrentImageIndex(index)}
                                >
                                    <img 
                                        src={image} 
                                        alt={`Thumbnail ${index + 1}`} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="flex-1">
                                <div className="flex items-center">
                                    <div className="bg-white p-3 rounded-lg shadow-md mr-4">
                                        <Building className="text-blue-700" size={36} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold">{formData.societyName}</h2>
                                        <p className="text-blue-100 flex items-center">
                                            <Calendar className="mr-1" size={16} />
                                            ID: {formData.societyId}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <button
                                    onClick={toggleEditMode}
                                    className={`px-5 py-2 rounded-lg font-medium flex items-center shadow-lg transition duration-200 ${
                                        editMode
                                            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                            : 'bg-white text-blue-600 hover:bg-blue-50'
                                    }`}
                                >
                                    {editMode ? (
                                        <>
                                            <XCircle className="mr-2" size={18} />
                                            Cancel Editing
                                        </>
                                    ) : (
                                        <>
                                            <Edit3 className="mr-2" size={18} />
                                            Edit Profile
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Profile Content */}
                    {!editMode ? (
                        <div className="p-6">
                            {/* View Mode */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Society Information Card */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                        <Briefcase className="mr-2 text-blue-600" size={20} />
                                        Society Details
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-start">
                                            <Building className="mr-3 text-blue-600 mt-1 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">Society Name</p>
                                                <p className="font-semibold text-gray-800">{formData.societyName}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <FileText className="mr-3 text-blue-600 mt-1 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">Society Type</p>
                                                <p className="font-semibold text-gray-800">{formData.societyType}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <Info className="mr-3 text-blue-600 mt-1 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">Description</p>
                                                <p className="text-gray-800">{formData.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Manager Information Card */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                        <User className="mr-2 text-blue-600" size={20} />
                                        Manager Information
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-start">
                                            <User className="mr-3 text-blue-600 mt-1 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">Manager Name</p>
                                                <p className="font-semibold text-gray-800">{formData.managerName}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <Phone className="mr-3 text-blue-600 mt-1 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">Phone Number</p>
                                                <p className="font-semibold text-gray-800">{formData.managerPhone}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <Mail className="mr-3 text-blue-600 mt-1 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">Email Address</p>
                                                <p className="font-semibold text-gray-800">{formData.managerEmail}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Address Information Card */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                        <Globe className="mr-2 text-blue-600" size={20} />
                                        Location Information
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-start">
                                            <Home className="mr-3 text-blue-600 mt-1 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">Street</p>
                                                <p className="font-semibold text-gray-800">{formData.street}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <MapPin className="mr-3 text-blue-600 mt-1 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">City</p>
                                                <p className="font-semibold text-gray-800">{formData.city}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <MapPin className="mr-3 text-blue-600 mt-1 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">State</p>
                                                <p className="font-semibold text-gray-800">{formData.state}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <MapPin className="mr-3 text-blue-600 mt-1 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">Pin Code</p>
                                                <p className="font-semibold text-gray-800">{formData.pinCode}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6">
                            {/* Edit Mode */}
                            <form onSubmit={handlePreviewSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Society Information */}
                                    <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                            <Briefcase className="mr-2 text-blue-600" size={20} />
                                            Society Details
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <Calendar className="mr-1 text-blue-600" size={16} />
                                                    Society ID
                                                </label>
                                                <input
                                                    type="text"
                                                    name="societyId"
                                                    value={formData.societyId}
                                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                                                    disabled
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <Building className="mr-1 text-blue-600" size={16} />
                                                    Society Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="societyName"
                                                    value={formData.societyName}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <FileText className="mr-1 text-blue-600" size={16} />
                                                    Society Type
                                                </label>
                                                <input
                                                    type="text"
                                                    name="societyType"
                                                    value={formData.societyType}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <FileText className="mr-1 text-blue-600" size={16} />
                                                    Description
                                                </label>
                                                <textarea
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                                                    rows="4"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Manager Information */}
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                            <User className="mr-2 text-blue-600" size={20} />
                                            Manager Information
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <User className="mr-1 text-blue-600" size={16} />
                                                    Manager Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="managerName"
                                                    value={formData.managerName}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <Phone className="mr-1 text-blue-600" size={16} />
                                                    Manager Phone
                                                </label>
                                                <input
                                                    type="text"
                                                    name="managerPhone"
                                                    value={formData.managerPhone}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <Mail className="mr-1 text-blue-600" size={16} />
                                                    Manager Email
                                                </label>
                                                <input
                                                    type="email"
                                                    name="managerEmail"
                                                    value={formData.managerEmail}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Address Information */}
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                            <Globe className="mr-2 text-blue-600" size={20} />
                                            Location Information
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <Home className="mr-1 text-blue-600" size={16} />
                                                    Street
                                                </label>
                                                <input
                                                    type="text"
                                                    name="street"
                                                    value={formData.street}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <MapPin className="mr-1 text-blue-600" size={16} />
                                                    City
                                                </label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <MapPin className="mr-1 text-blue-600" size={16} />
                                                    State
                                                </label>
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <MapPin className="mr-1 text-blue-600" size={16} />
                                                    Pin Code
                                                </label>
                                                <input
                                                    type="text"
                                                    name="pinCode"
                                                    value={formData.pinCode}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-lg border-gray-200 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="mt-8 flex justify-center">
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-lg transition-all duration-200 flex items-center w-full md:w-auto justify-center"
                                    >
                                        <Edit3 className="mr-2" size={18} />
                                        Preview Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </main>

            {/* Preview Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xl md:max-w-2xl">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center border-b pb-3">
                            <CheckCircle className="mr-2 text-blue-600" size={22} />
                            Confirm Changes
                        </h2>
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Society Details</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs text-gray-500">Society ID</p>
                                            <p className="font-medium">{formData.societyId}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Society Name</p>
                                            <p className="font-medium">{formData.societyName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Society Type</p>
                                            <p className="font-medium">{formData.societyType}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Manager Information</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs text-gray-500">Name</p>
                                            <p className="font-medium">{formData.managerName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="font-medium">{formData.managerPhone}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="font-medium">{formData.managerEmail}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Location</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs text-gray-500">Street</p>
                                            <p className="font-medium">{formData.street}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">City</p>
                                            <p className="font-medium">{formData.city}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">State</p>
                                            <p className="font-medium">{formData.state}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Pin Code</p>
                                            <p className="font-medium">{formData.pinCode}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                                    <p className="text-sm">{formData.description}</p>
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
            
            {/* Add Image Modal */}
            {showImageModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center border-b pb-3">
                            <Image className="mr-2 text-blue-600" size={22} />
                            Add Society Image
                        </h2>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Image URL
                            </label>
                            <input
                                type="text"
                                value={newImageURL}
                                onChange={(e) => setNewImageURL(e.target.value)}
                                placeholder="Enter image URL"
                                className="block w-full rounded-lg border-gray-200 border px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Please enter a valid image URL. Supported formats: JPG, PNG, GIF.
                            </p>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Image
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition duration-200">
                                <Image className="mx-auto mb-2 text-gray-400" size={36} />
                                <p className="text-sm text-gray-500">
                                    Drag and drop an image here, or click to select
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Max file size: 5MB
                                </p>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    // This would typically connect to an upload handler
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowImageModal(false)}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 border border-gray-300 flex items-center justify-center"
                            >
                                <XCircle className="mr-2" size={18} />
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={addNewImage}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md flex items-center justify-center"
                                disabled={!newImageURL.trim()}
                            >
                                <Plus className="mr-2" size={18} />
                                Add Image
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}