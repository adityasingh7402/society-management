import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { 
  Upload, X, Camera, Plus, CheckCircle, AlertTriangle, ArrowLeft, Home
} from 'lucide-react';

const AddProperty = () => {
  const router = useRouter();
  const [residentData, setResidentData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    priceUnit: 'lakh',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    furnishingStatus: '',
    amenities: [],
    location: {
      block: '',
      floor: '',
      flatNumber: ''
    },
    images: []
  });
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [step, setStep] = useState(1);
  const [confirmPublish, setConfirmPublish] = useState(false);

  useEffect(() => {
    fetchResidentData();
  }, [router]);

  const fetchResidentData = async () => {
    try {
      const token = localStorage.getItem('Resident');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/Resident-Api/get-resident-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resident details');
      }

      const data = await response.json();
      setResidentData(data);
    } catch (error) {
      console.error('Error fetching resident details:', error);
      router.push('/login');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + selectedImages.length > 5) {
      setErrorMessage('You can only upload a maximum of 5 images');
      return;
    }
    
    const newSelectedImages = [...selectedImages, ...files];
    setSelectedImages(newSelectedImages);
    
    // Create preview URLs
    const newImagePreviewUrls = [];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImagePreviewUrls.push(reader.result);
        if (newImagePreviewUrls.length === files.length) {
          setImagePreviewUrls([...imagePreviewUrls, ...newImagePreviewUrls]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const updatedImages = [...selectedImages];
    const updatedPreviewUrls = [...imagePreviewUrls];
    
    updatedImages.splice(index, 1);
    updatedPreviewUrls.splice(index, 1);
    
    setSelectedImages(updatedImages);
    setImagePreviewUrls(updatedPreviewUrls);
  };

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      setErrorMessage('Please enter a title');
      return false;
    }
    
    if (!formData.description.trim()) {
      setErrorMessage('Please enter a description');
      return false;
    }
    
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      setErrorMessage('Please enter a valid price');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!formData.propertyType) {
      setErrorMessage('Please select a property type');
      return false;
    }
    
    if (!formData.bedrooms || !formData.bathrooms || !formData.area) {
      setErrorMessage('Please fill in all property details');
      return false;
    }

    if (!formData.location.block || !formData.location.floor || !formData.location.flatNumber) {
      setErrorMessage('Please fill in location details');
      return false;
    }

    if (!formData.furnishingStatus) {
      setErrorMessage('Please select furnishing status');
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    setErrorMessage('');
    
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const calculateActualPrice = (price, unit) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return 0;
    return unit === 'lakh' ? numPrice * 100000 : numPrice * 10000000;
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handlePropertyTypeSelect = (type) => {
    setFormData(prev => ({
      ...prev,
      propertyType: type
    }));
  };

  const createProperty = async () => {
    if (!residentData) {
      setErrorMessage('You must be logged in to list a property');
      return;
    }

    // Final validation
    if (!formData.title.trim() || !formData.description.trim() || !formData.price || 
        !formData.propertyType || !formData.bedrooms || !formData.bathrooms || 
        !formData.area || !formData.furnishingStatus || 
        !formData.location.block || !formData.location.floor || !formData.location.flatNumber) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Upload images first if there are any
      let imageUrls = [];
      if (selectedImages.length > 0) {
        const token = localStorage.getItem('Resident');
        const formData = new FormData();
        selectedImages.forEach(file => {
          formData.append('image', file);
        });

        const uploadResponse = await fetch('/api/Announcement-Api/upload-images', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload images');
        }

        const uploadData = await uploadResponse.json();
        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload images');
        }
        imageUrls = uploadData.imageUrls;
      }
      
      // Create property data
      const actualPrice = calculateActualPrice(formData.price, formData.priceUnit);
      const propertyData = {
        ...formData,
        price: actualPrice,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area: parseFloat(formData.area),
        images: imageUrls,
        sellerId: residentData._id,
        societyId: residentData.societyId
      };
      
      // Submit the form
      const token = localStorage.getItem('Resident');
      const response = await axios.post('/api/Property-Api/property', propertyData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });
      
      // Handle success
      setSuccessMessage('Property listed successfully!');
      
      // Reset form and redirect after a short delay
      setTimeout(() => {
        router.push('/Resident-dashboard/components/PropertyMarketplace');
      }, 2000);
      
    } catch (error) {
      console.error('Error listing property:', error);
      setErrorMessage(error.response?.data?.message || 'An error occurred while listing your property');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (confirmPublish) {
      createProperty();
    } else if (step === 3) {
      // Validate images before showing confirmation
      if (selectedImages.length === 0) {
        setErrorMessage('Please upload at least one image');
        return;
      }
      setConfirmPublish(true);
    }
  };

  const resetConfirmation = () => {
    setConfirmPublish(false);
    setStep(3); // Ensure we go back to the image step
  };

  const propertyTypes = [
    { value: 'Apartment', label: 'Apartment', icon: '🏠' },
    { value: 'Studio', label: 'Studio', icon: '🏠' },
    { value: 'Garage', label: 'Garage', icon: '🚗' },
    { value: 'Single Room', label: 'Single Room', icon: '🛏️' },
    { value: 'Shop', label: 'Shop', icon: '🏪' },
    { value: 'Office Space', label: 'Office Space', icon: '💼' }
  ];

  const furnishingOptions = [
    { value: 'Fully Furnished', label: 'Fully Furnished', description: 'Complete with all furniture and appliances' },
    { value: 'Semi Furnished', label: 'Semi Furnished', description: 'Basic furniture and fixtures included' },
    { value: 'Unfurnished', label: 'Unfurnished', description: 'No furniture or appliances included' }
  ];

  const amenityOptions = [
    'Parking',
    'Security',
    'Garden',
    'Gym',
    'Swimming Pool',
    'Power Backup',
    'Lift',
    'Club House',
    'Children\'s Play Area',
    'Sports Facilities'
  ];

  const goBack = () => {
    router.push('/Resident-dashboard/components/PropertyMarketplace');
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Basic Details</h2>
              <p className="text-gray-600 text-sm">Tell us about your property</p>
            </div>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Spacious 3BHK Apartment with Garden View"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your property in detail (features, condition, reason for selling)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/1000 characters
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">₹</span>
                  </div>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="block w-full pl-7 pr-12 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <select
                  name="priceUnit"
                  value={formData.priceUnit}
                  onChange={handleInputChange}
                  className="w-24 py-2 px-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="lakh">Lakh</option>
                  <option value="crore">Crore</option>
                </select>
              </div>
              {formData.price && (
                <p className="mt-1 text-sm text-gray-500">
                  {`${formData.price} ${formData.priceUnit}(s) = ₹${formatPrice(calculateActualPrice(formData.price, formData.priceUnit))}`}
                </p>
              )}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Property Details</h2>
              <p className="text-gray-600 text-sm">Tell us more about your property</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {propertyTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handlePropertyTypeSelect(type.value)}
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${
                      formData.propertyType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <span className="text-2xl mb-2">{type.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrooms <span className="text-red-500">*</span>
                </label>
                <select
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {[1,2,3,4,5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                  <option value="6">6+</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  Bathrooms <span className="text-red-500">*</span>
                </label>
                <select
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {[1,2,3,4].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                  <option value="5">5+</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                  Area (sq.ft) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="area"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Block*</label>
                <input
                  type="text"
                  name="location.block"
                  value={formData.location.block}
                  onChange={handleInputChange}
                  className="block w-full py-2 px-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. A, B, C"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor*</label>
                <input
                  type="text"
                  name="location.floor"
                  value={formData.location.floor}
                  onChange={handleInputChange}
                  className="block w-full py-2 px-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Ground, 1st, 2nd"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flat Number*</label>
                <input
                  type="text"
                  name="location.flatNumber"
                  value={formData.location.flatNumber}
                  onChange={handleInputChange}
                  className="block w-full py-2 px-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 101, 102"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Furnishing Status <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {furnishingOptions.map((option) => (
                  <div 
                    key={option.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.furnishingStatus === option.value ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setFormData({...formData, furnishingStatus: option.value})}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                      formData.furnishingStatus === option.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {formData.furnishingStatus === option.value && (
                        <CheckCircle size={14} className="text-white" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-gray-800">{option.label}</p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {amenityOptions.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    className={`p-2 border rounded-lg text-sm ${
                      formData.amenities.includes(amenity)
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      const newAmenities = formData.amenities.includes(amenity)
                        ? formData.amenities.filter(a => a !== amenity)
                        : [...formData.amenities, amenity];
                      setFormData({...formData, amenities: newAmenities});
                    }}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Property Images</h2>
              <p className="text-gray-600 text-sm">Add up to 5 images of your property</p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
              
              {imagePreviewUrls.length < 5 && (
                <label 
                  htmlFor="images"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <Upload size={48} className="text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Click to upload images</p>
                  <p className="text-xs text-gray-500">JPG, PNG or WEBP (max. 5 images)</p>
                </label>
              )}
              
              {imagePreviewUrls.length > 0 && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="h-32 w-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      >
                        <X size={16} className="text-gray-700" />
                      </button>
                    </div>
                  ))}
                  
                  {imagePreviewUrls.length < 5 && (
                    <label 
                      htmlFor="images"
                      className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                    >
                      <Plus size={24} className="text-gray-400 mb-1" />
                      <span className="text-sm text-gray-500">Add More</span>
                    </label>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle size={20} className="text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Photo Tips</h3>
                <ul className="mt-1 text-xs text-blue-700 list-disc pl-5 space-y-1">
                  <li>Clear, well-lit photos get more interest</li>
                  <li>Add photos from multiple angles</li>
                  <li>Include photos of any defects or wear</li>
                  <li>Avoid using stock photos; show the actual property</li>
                </ul>
              </div>
            </div>
            
            {/* Preview */}
            <div className="mt-8 border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
                  {imagePreviewUrls.length > 0 ? (
                    <img
                      src={imagePreviewUrls[0]}
                      alt="Property preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 line-clamp-1">{formData.title || 'Property Title'}</h4>
                  <p className="text-blue-600 font-bold text-lg">
                    ₹{formData.price ? parseFloat(formData.price).toLocaleString('en-IN') : '0'}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                      {formData.propertyType || 'Property Type'}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                      {formData.bedrooms ? `${formData.bedrooms} Beds` : 'Beds'}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                      {formData.bathrooms ? `${formData.bathrooms} Baths` : 'Baths'}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                      {formData.area ? `${formData.area} sq.ft` : 'Area'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">
                Click the "Publish Listing" button below to finalize your listing and make it available to other residents.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <div className="bg-white shadow-md py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="p-2">
            <button
              onClick={goBack}
              className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-base">Back</span>
            </button>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mt-2">List Your Property</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Progress Bar */}
          <div className="w-full h-1 bg-gray-200">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-center p-4 border-b">
            <div className="flex items-center justify-between w-2/3 max-w-sm">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  1
                </div>
                <span className="text-xs">Details</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <span className="text-xs">Property Info</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </div>
                <span className="text-xs">Images</span>
              </div>
            </div>
          </div>
          
          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={18} className="text-red-500" />
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              </div>
            )}
            
            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle size={18} className="text-green-500" />
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              </div>
            )}
            
            {/* Main Content */}
            {confirmPublish ? (
              <div className="space-y-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Confirm Listing</h2>
                  <p className="text-gray-600 text-sm">Review your listing before publishing</p>
                </div>
                
                <div className="bg-blue-50 p-5 rounded-lg">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
                      {imagePreviewUrls.length > 0 ? (
                        <img
                          src={imagePreviewUrls[0]}
                          alt="Property preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home size={32} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800">{formData.title}</h3>
                      <p className="text-blue-600 font-bold text-xl">
                        ₹{formData.price ? calculateActualPrice(formData.price, formData.priceUnit).toLocaleString('en-IN') : '0'}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                          {formData.propertyType}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                          {formData.bedrooms} Beds
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                          {formData.bathrooms} Baths
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                          {formData.area} sq.ft
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{formData.description}</p>
                    </div>
                  </div>
                  
                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Photos ({imagePreviewUrls.length})</p>
                      <div className="flex space-x-2 overflow-x-auto pb-2">
                        {imagePreviewUrls.map((url, index) => (
                          <img 
                            key={index}
                            src={url} 
                            alt={`Preview ${index + 1}`} 
                            className="h-16 w-16 object-cover rounded-md flex-shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Location</h4>
                      <p className="text-sm text-gray-600">
                        Block {formData.location.block}, Floor {formData.location.floor}, Flat {formData.location.flatNumber}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Furnishing</h4>
                      <p className="text-sm text-gray-600">{formData.furnishingStatus}</p>
                    </div>
                  </div>

                  {formData.amenities.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.amenities.map((amenity, index) => (
                          <span key={index} className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Once published, your listing will be visible to all residents in your society. You can edit or remove it later if needed.
                  </p>
                </div>
                
                {/* Confirmation Navigation */}
                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={resetConfirmation}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Edit Listing
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-2 rounded-lg ${
                      loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    } text-white flex items-center`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Publishing...
                      </>
                    ) : (
                      'Confirm & Publish'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {renderStepContent()}
                
                {/* Step Navigation */}
                <div className="mt-8 flex justify-between">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={goBack}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                  
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Publish Listing
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProperty; 