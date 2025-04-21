import React, { useState, useRef } from 'react';
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from 'next/router';

import { Camera, X, Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, Phone, Mail, Home } from 'lucide-react';

export default function SellProperty() {
    const router = useRouter();
    // State declarations - same as before
    const [propertyData, setPropertyData] = useState({
        title: '',
        price: '',
        location: '',
        bedrooms: '',
        bathrooms: '',
        area: '',
        description: '',
        contactPhone: '',
        contactEmail: ''
    });

    const [selectedImages, setSelectedImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isCreating, setIsCreating] = useState(true);
    const [showResponses, setShowResponses] = useState(false);
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'responses'
    const [selectedListing, setSelectedListing] = useState(null);

    // Sample listings data
    const [myListings, setMyListings] = useState([
        {
            id: 101,
            title: "Luxurious 3BHK Apartment with Garden View",
            price: "85,00,000",
            location: "Koramangala, Bangalore",
            bedrooms: 3,
            bathrooms: 2,
            area: "1850",
            description: "Spacious 3BHK apartment with modern amenities, 24/7 security, power backup, and beautiful garden view.",
            contactPhone: "+91 98765 12345",
            contactEmail: "contact@example.com",
            images: ["/api/placeholder/400/300", "/api/placeholder/400/300", "/api/placeholder/400/300"],
            postedDate: "2025-03-01",
            likes: 24,
            responses: 8,
            status: "Active"
        },
        {
            id: 102,
            title: "2BHK Villa in Gated Community",
            price: "65,00,000",
            location: "Whitefield, Bangalore",
            bedrooms: 2,
            bathrooms: 2,
            area: "1200",
            description: "Beautiful 2BHK villa in a premium gated community with swimming pool, gym, and children's play area.",
            contactPhone: "+91 98765 12345",
            contactEmail: "contact@example.com",
            images: ["/api/placeholder/400/300", "/api/placeholder/400/300"],
            postedDate: "2025-02-15",
            likes: 18,
            responses: 5,
            status: "Active"
        },
    ]);

    // Sample data for preview after submit
    const [postedListing, setPostedListing] = useState(null);

    // Dummy data for responses across all listings
    const [allResponses, setAllResponses] = useState([
        {
            id: 1,
            propertyId: 101,
            propertyTitle: "Luxurious 3BHK Apartment with Garden View",
            buyer: {
                name: "Vikram Singh",
                phone: "+91 87654 98765",
                email: "vikram.s@example.com"
            },
            message: "I'm very interested in your property. Can we schedule a viewing this Saturday?",
            responseDate: "2025-03-17",
            status: "New"
        },
        {
            id: 2,
            propertyId: 102,
            propertyTitle: "2BHK Villa in Gated Community",
            buyer: {
                name: "Anjali Desai",
                phone: "+91 76543 87654",
                email: "anjali.d@example.com"
            },
            message: "Hello, I would like to know if there are any additional maintenance charges for this property.",
            responseDate: "2025-03-16",
            status: "Read"
        },
        {
            id: 3,
            propertyId: 101,
            propertyTitle: "Luxurious 3BHK Apartment with Garden View",
            buyer: {
                name: "Suresh Menon",
                phone: "+91 65432 76543",
                email: "suresh.m@example.com"
            },
            message: "Is there parking available with this property? I have two cars and need space for both.",
            responseDate: "2025-03-15",
            status: "Replied"
        }
    ]);

    // Event handlers - same as before
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPropertyData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);

        if (files.length + selectedImages.length > 10) {
            alert('You can only upload up to 10 images');
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

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % previewImages.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + previewImages.length) % previewImages.length);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!propertyData.title || !propertyData.price || selectedImages.length === 0) {
            alert('Please fill in all required fields and upload at least one image');
            return;
        }

        // Create new listing
        const newListing = {
            ...propertyData,
            id: Math.floor(Math.random() * 1000),
            images: previewImages,
            postedDate: new Date().toISOString().split('T')[0],
            likes: 0,
            responses: 0,
            status: "Active"
        };

        // Update myListings and display the preview
        setMyListings(prev => [...prev, newListing]);
        setPostedListing(newListing);
        setIsCreating(false);
    };

    const createNewListing = () => {
        setIsCreating(true);
        setPostedListing(null);
        setSelectedImages([]);
        setPreviewImages([]);
        setCurrentSlide(0);
        setPropertyData({
            title: '',
            price: '',
            location: '',
            bedrooms: '',
            bathrooms: '',
            area: '',
            description: '',
            contactPhone: '',
            contactEmail: ''
        });
    };

    // Get responses for a specific property
    const getPropertyResponses = (propertyId) => {
        return allResponses.filter(response => response.propertyId === propertyId);
    };

    // New function to handle listing selection
    const handleListingSelect = (listing) => {
        setSelectedListing(listing);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="classss">
                <button onClick={() => router.back()} className="flex items-center p-4 md:p-6 space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors">
                    <FaArrowLeft size={18} />
                    <span className="text-base">Back</span>
                </button>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4 md:mb-8 text-center">Sell Property</h1>

            {/* Tab Navigation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex border-b border-gray-200">
                    <button
                        className={`py-2 px-4 font-medium ${activeTab === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('list')}
                    >
                        List Property
                    </button>
                    <button
                        className={`py-2 px-4 font-medium ${activeTab === 'responses' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => {
                            setActiveTab('responses');
                            if (myListings.length > 0 && !selectedListing) {
                                setSelectedListing(myListings[0]);
                            }
                        }}
                    >
                        Responses
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {activeTab === 'list' ? (
                    isCreating ? (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Property Listing</h2>

                            <form onSubmit={handleSubmit}>
                                {/* Form fields remain the same as before */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Property Title*
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={propertyData.title}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            placeholder="e.g. 3BHK Premium Apartment"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Price (₹)*
                                        </label>
                                        <input
                                            type="text"
                                            name="price"
                                            value={propertyData.price}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            placeholder="e.g. 75,00,000"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={propertyData.location}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            placeholder="Area, City"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Bedrooms
                                            </label>
                                            <input
                                                type="number"
                                                name="bedrooms"
                                                value={propertyData.bedrooms}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                min="0"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Bathrooms
                                            </label>
                                            <input
                                                type="number"
                                                name="bathrooms"
                                                value={propertyData.bathrooms}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                min="0"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Area (sq.ft)
                                            </label>
                                            <input
                                                type="text"
                                                name="area"
                                                value={propertyData.area}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={propertyData.description}
                                        onChange={handleInputChange}
                                        rows="4"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="Describe your property..."
                                    ></textarea>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Property Images*
                                    </label>
                                    <div className="flex flex-wrap gap-4 mb-4">
                                        {previewImages.map((url, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={url}
                                                    alt={`Property ${index + 1}`}
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

                                        {selectedImages.length < 10 && (
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
                                    <p className="text-sm text-gray-500 mt-1">Add up to 10 images. First image will be the cover photo.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="contactPhone"
                                            value={propertyData.contactPhone}
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
                                            value={propertyData.contactEmail}
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
                                        Submit Listing
                                    </button>
                                    <a href="upi://pay?pa=7678458860@ybl&pn=aditya&am=1&cu=INR">
                                        Pay ₹1 via PhonePe
                                    </a>
                                </div>
                            </form>
                        </div>
                    ) : (
                        // Listing Preview after submission
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Listing Preview</h2>

                            {postedListing && (
                                <div>
                                    <div className="relative mb-6">
                                        {previewImages.length > 0 && (
                                            <div>
                                                <img
                                                    src={previewImages[currentSlide]}
                                                    alt={`Property ${currentSlide + 1}`}
                                                    className="w-full h-64 md:h-96 object-cover rounded-lg"
                                                />

                                                {previewImages.length > 1 && (
                                                    <>
                                                        <button
                                                            onClick={prevSlide}
                                                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-75"
                                                        >
                                                            <ChevronLeft size={20} />
                                                        </button>
                                                        <button
                                                            onClick={nextSlide}
                                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-75"
                                                        >
                                                            <ChevronRight size={20} />
                                                        </button>
                                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                                            <div className="flex space-x-2">
                                                                {previewImages.map((_, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className={`h-2 w-2 rounded-full ${currentSlide === index ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                                                                    ></div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-gray-900">{postedListing.title}</h3>
                                        <p className="text-xl font-medium text-blue-600 mt-1">₹ {postedListing.price}</p>
                                        <div className="flex items-center text-gray-600 mt-2">
                                            <Home size={16} className="mr-1" />
                                            <span>{postedListing.location}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="bg-gray-50 p-3 rounded-md text-center">
                                            <span className="block text-gray-600 text-sm">Bedrooms</span>
                                            <span className="block text-gray-900 font-medium">{postedListing.bedrooms || 'N/A'}</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-md text-center">
                                            <span className="block text-gray-600 text-sm">Bathrooms</span>
                                            <span className="block text-gray-900 font-medium">{postedListing.bathrooms || 'N/A'}</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-md text-center">
                                            <span className="block text-gray-600 text-sm">Area</span>
                                            <span className="block text-gray-900 font-medium">{postedListing.area ? `${postedListing.area} sq.ft` : 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="text-lg font-medium text-gray-900 mb-2">Description</h4>
                                        <p className="text-gray-700">{postedListing.description || 'No description provided.'}</p>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="text-lg font-medium text-gray-900 mb-2">Contact Information</h4>
                                        <div className="flex flex-col space-y-2">
                                            {postedListing.contactPhone && (
                                                <div className="flex items-center">
                                                    <Phone size={16} className="text-gray-600 mr-2" />
                                                    <span>{postedListing.contactPhone}</span>
                                                </div>
                                            )}
                                            {postedListing.contactEmail && (
                                                <div className="flex items-center">
                                                    <Mail size={16} className="text-gray-600 mr-2" />
                                                    <span>{postedListing.contactEmail}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6">
                                        <button
                                            onClick={createNewListing}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700"
                                        >
                                            Create New Listing
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    // Responses Tab
                    <div className="bg-white rounded-lg shadow">
                        {myListings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-4">
                                {/* Sidebar with listings */}
                                <div className="border-r border-gray-200 p-4">
                                    <h3 className="font-medium text-gray-700 mb-4">My Properties</h3>
                                    <div className="space-y-2">
                                        {myListings.map(listing => (
                                            <div
                                                key={listing.id}
                                                onClick={() => handleListingSelect(listing)}
                                                className={`cursor-pointer p-2 rounded-md ${selectedListing?.id === listing.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className="font-medium text-gray-900 truncate">{listing.title}</div>
                                                <div className="text-sm text-gray-500 flex items-center justify-between mt-1">
                                                    <span>₹ {listing.price}</span>
                                                    <span className="flex items-center">
                                                        <MessageCircle size={14} className="mr-1" />
                                                        {listing.responses}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Responses for selected listing */}
                                <div className="col-span-3 p-4">
                                    {selectedListing ? (
                                        <>
                                            <h3 className="font-medium text-gray-900 mb-1">{selectedListing.title}</h3>
                                            <p className="text-sm text-gray-500 mb-4">{selectedListing.location}</p>

                                            <div className="border-t border-gray-200 pt-4">
                                                <h4 className="font-medium text-gray-700 mb-4">Buyer Responses</h4>

                                                {getPropertyResponses(selectedListing.id).length > 0 ? (
                                                    <div className="space-y-4">
                                                        {getPropertyResponses(selectedListing.id).map(response => (
                                                            <div key={response.id} className="border border-gray-200 rounded-md p-4">
                                                                <div className="flex justify-between mb-2">
                                                                    <span className="font-medium">{response.buyer.name}</span>
                                                                    <span className={`text-xs px-2 py-1 rounded-full ${response.status === 'New' ? 'bg-green-100 text-green-800' :
                                                                        response.status === 'Read' ? 'bg-blue-100 text-blue-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                        {response.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-700 mb-3">{response.message}</p>
                                                                <div className="flex flex-col space-y-1 text-sm text-gray-500">
                                                                    <div className="flex items-center">
                                                                        <Phone size={14} className="mr-1" />
                                                                        <span>{response.buyer.phone}</span>
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <Mail size={14} className="mr-1" />
                                                                        <span>{response.buyer.email}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-2">
                                                                    Received: {response.responseDate}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <p className="text-gray-500">No responses yet for this property.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-64">
                                            <p className="text-gray-500">Select a property to view responses</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-gray-600 mb-4">You haven't listed any properties yet.</p>
                                <button
                                    onClick={() => setActiveTab('list')}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
                                >
                                    Create Your First Listing
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}