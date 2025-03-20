import React, { useState, useRef } from 'react';
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from 'next/router';
import { Camera, X, CheckCircle } from 'lucide-react';

export default function NewRequest() {
    const router = useRouter();
    const [requestData, setRequestData] = useState({
        title: '',
        type: '',
        priority: '',
        description: '',
        preferredDate: '',
        preferredTime: '',
        contactPhone: '',
        contactEmail: ''
    });

    const [selectedImages, setSelectedImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(true);
    const [ticketNumber, setTicketNumber] = useState(null);
    const fileInputRef = useRef(null);

    // Event handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRequestData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);

        if (files.length + selectedImages.length > 5) {
            alert('You can only upload up to 5 images');
            return;
        }

        setSelectedImages(prev => [...prev, ...files]);

        // Create preview URLs
        const newPreviewUrls = files.map(file => URL.createObjectURL(file));
        setPreviewImages(prev => [...prev, ...newPreviewUrls]);
    };

    const removeImage = (index) => {
        const newSelectedImages = [...selectedImages];
        newSelectedImages.splice(index, 1);
        setSelectedImages(newSelectedImages);

        const newPreviewImages = [...previewImages];
        URL.revokeObjectURL(newPreviewImages[index]); // Clean up memory
        newPreviewImages.splice(index, 1);
        setPreviewImages(newPreviewImages);

        if (currentSlide >= newPreviewImages.length) {
            setCurrentSlide(Math.max(0, newPreviewImages.length - 1));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!requestData.title || !requestData.type || !requestData.priority) {
            alert('Please fill in all required fields');
            return;
        }

        // Generate a random ticket number
        const randomTicket = 'MNT-' + Math.floor(1000 + Math.random() * 9000);
        setTicketNumber(randomTicket);
        setIsSubmitting(false);
    };

    const createNewRequest = () => {
        setIsSubmitting(true);
        setTicketNumber(null);
        setSelectedImages([]);
        setPreviewImages([]);
        setCurrentSlide(0);
        setRequestData({
            title: '',
            type: '',
            priority: '',
            description: '',
            preferredDate: '',
            preferredTime: '',
            contactPhone: '',
            contactEmail: ''
        });
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div>
                <button onClick={() => router.back()} className="flex items-center p-4 md:p-6 space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors">
                    <FaArrowLeft size={18} />
                    <span className="text-base">Back</span>
                </button>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4 md:mb-8 text-center">House Maintenance Request</h1>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mb-8">
                {isSubmitting ? (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Submit Maintenance Request</h2>

                        <form onSubmit={handleSubmit}>
                            {/* Form fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Request Title*
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={requestData.title}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="e.g. Bathroom Leakage"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Request Type*
                                    </label>
                                    <select
                                        name="type"
                                        value={requestData.type}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Painting">Painting</option>
                                        <option value="Flooring">Flooring</option>
                                        <option value="Appliance">Appliance</option>
                                        <option value="Renovation">Renovation</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority*
                                </label>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value="High"
                                            checked={requestData.priority === "High"}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600"
                                            required
                                        />
                                        <span className="ml-2 text-gray-700">High</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value="Medium"
                                            checked={requestData.priority === "Medium"}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <span className="ml-2 text-gray-700">Medium</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value="Low"
                                            checked={requestData.priority === "Low"}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <span className="ml-2 text-gray-700">Low</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={requestData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    placeholder="Please describe the issue in detail..."
                                ></textarea>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Upload Images
                                </label>
                                <div className="flex flex-wrap gap-4 mb-4">
                                    {previewImages.map((url, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={url}
                                                alt={`Issue ${index + 1}`}
                                                className="h-32 w-32 object-cover rounded-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}

                                    {selectedImages.length < 5 && (
                                        <div
                                            onClick={() => fileInputRef.current.click()}
                                            className="h-32 w-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-gray-400"
                                        >
                                            <Camera size={24} className="text-gray-400" />
                                            <span className="text-sm text-gray-500 mt-2">Add Photo</span>
                                        </div>)}
                                </div>
                                <input type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <p className="text-sm text-gray-500 mt-1">Add up to 5 images to help maintenance staff understand the issue.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Preferred Date
                                    </label>
                                    <input
                                        type="date"
                                        name="preferredDate"
                                        value={requestData.preferredDate}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Preferred Time
                                    </label>
                                    <select
                                        name="preferredTime"
                                        value={requestData.preferredTime}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">Select Time Slot</option>
                                        <option value="Morning (9AM-12PM)">Morning (9AM-12PM)</option>
                                        <option value="Afternoon (12PM-3PM)">Afternoon (12PM-3PM)</option>
                                        <option value="Evening (3PM-6PM)">Evening (3PM-6PM)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="contactPhone"
                                        value={requestData.contactPhone}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        name="contactEmail"
                                        value={requestData.contactEmail}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="example@email.com"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    // Success view after submission
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-center py-8">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted Successfully</h2>
                            <p className="text-gray-600 mb-6">Your maintenance request has been submitted. We'll get back to you soon.</p>
                            
                            <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-gray-700 mb-2">Your ticket number:</p>
                                <p className="text-xl font-bold text-blue-600">{ticketNumber}</p>
                                <p className="text-xs text-gray-500 mt-2">Please save this number for future reference</p>
                            </div>

                            <div className="text-left bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                                <h3 className="font-medium text-gray-900 mb-2">Request Details</h3>
                                <p className="text-sm mb-1"><span className="font-medium">Title:</span> {requestData.title}</p>
                                <p className="text-sm mb-1"><span className="font-medium">Type:</span> {requestData.type}</p>
                                <p className="text-sm mb-1"><span className="font-medium">Priority:</span> {requestData.priority}</p>
                                {requestData.preferredDate && (
                                    <p className="text-sm mb-1"><span className="font-medium">Preferred Date:</span> {requestData.preferredDate}</p>
                                )}
                                {requestData.preferredTime && (
                                    <p className="text-sm mb-1"><span className="font-medium">Preferred Time:</span> {requestData.preferredTime}</p>
                                )}
                            </div>

                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={createNewRequest}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700"
                                >
                                    Submit Another Request
                                </button>
                            </div>
                            
                            <button
                                onClick={() => router.push('/maintenance-history')}
                                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                            >
                                View All Maintenance Requests
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}