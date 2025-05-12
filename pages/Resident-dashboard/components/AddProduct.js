import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { 
  Upload, X, Camera, Plus, CheckCircle, AlertTriangle, ArrowLeft, Tag
} from 'lucide-react';

const AddProduct = () => {
  const router = useRouter();
  const [residentData, setResidentData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'Good',
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
        router.push('/Login');
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
      router.push('/Login');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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
    if (!formData.category) {
      setErrorMessage('Please select a category');
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
    } else if (step === 3) {
      setConfirmPublish(true);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const createProduct = async () => {
    if (!residentData) {
      setErrorMessage('You must be logged in to list a product');
      return;
    }

    // Final validation
    if (!formData.title.trim() || !formData.description.trim() || !formData.price || 
        !formData.category || !formData.condition) {
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
        imageUrls = uploadData.imageUrls;
      }
      
      // Create product data
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        condition: formData.condition,
        images: imageUrls,
        sellerId: residentData._id,
        societyId: residentData.societyId
      };
      
      // Submit the form
      const token = localStorage.getItem('Resident');
      const response = await axios.post('/api/Product-Api/product', productData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });
      
      // Handle success
      setSuccessMessage('Product listed successfully!');
      
      // Reset form and redirect after a short delay
      setTimeout(() => {
        router.push('/Resident-dashboard/components/Marketplace');
      }, 2000);
      
    } catch (error) {
      console.error('Error listing product:', error);
      setErrorMessage(error.response?.data?.message || 'An error occurred while listing your product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (confirmPublish) {
      createProduct();
    } else {
      setConfirmPublish(true);
    }
  };

  const resetConfirmation = () => {
    setConfirmPublish(false);
  };

  const categories = [
    { value: 'Electronics', label: 'Electronics', icon: '📱' },
    { value: 'Furniture', label: 'Furniture', icon: '🪑' },
    { value: 'Clothing', label: 'Clothing', icon: '👕' },
    { value: 'Books', label: 'Books', icon: '📚' },
    { value: 'Sports', label: 'Sports', icon: '🏀' },
    { value: 'Home Appliances', label: 'Home Appliances', icon: '🧹' },
    { value: 'Vehicles', label: 'Vehicles', icon: '🚗' },
    { value: 'Others', label: 'Others', icon: '📦' }
  ];

  const conditionOptions = [
    { value: 'New', label: 'New', description: 'Brand new, unused, unopened' },
    { value: 'Like New', label: 'Like New', description: 'Used once or twice, as good as new' },
    { value: 'Good', label: 'Good', description: 'Used with minor signs of wear' },
    { value: 'Fair', label: 'Fair', description: 'Used with noticeable signs of wear' },
    { value: 'Poor', label: 'Poor', description: 'Heavily used, still functional' }
  ];

  const goBack = () => {
    router.push('/Resident-dashboard/components/Marketplace');
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Basic Details</h2>
              <p className="text-gray-600 text-sm">Tell us about what you're selling</p>
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
                placeholder="e.g. iPhone 12 Pro Max 128GB"
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
                placeholder="Describe your item in detail (condition, features, reason for selling)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/1000 characters
              </p>
            </div>
            
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Additional Details</h2>
              <p className="text-gray-600 text-sm">Help buyers find your item</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                      formData.category === category.value ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500' : 'border-gray-200'
                    }`}
                    onClick={() => setFormData({...formData, category: category.value})}
                  >
                    <span className="text-2xl mb-1">{category.icon}</span>
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Condition <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {conditionOptions.map((option) => (
                  <div 
                    key={option.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.condition === option.value ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setFormData({...formData, condition: option.value})}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                      formData.condition === option.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {formData.condition === option.value && (
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
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Add Photos</h2>
              <p className="text-gray-600 text-sm">Add up to 5 photos</p>
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
                <h3 className="text-sm font-medium text-blue-800">Listing Tips</h3>
                <ul className="mt-1 text-xs text-blue-700 list-disc pl-5 space-y-1">
                  <li>Clear, well-lit photos get more interest</li>
                  <li>Add photos from multiple angles</li>
                  <li>Include photos of any defects or wear</li>
                  <li>Avoid using stock photos; show the actual item</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Product Preview</h3>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                  {imagePreviewUrls.length > 0 ? (
                    <img
                      src={imagePreviewUrls[0]}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tag size={24} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800 line-clamp-1">{formData.title || 'Product Title'}</p>
                  <p className="text-blue-600 font-bold">
                    ₹{formData.price ? parseFloat(formData.price).toLocaleString('en-IN') : '0'}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                      {formData.condition}
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

  if (!residentData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      {/* Header */}
      <div className="bg-white shadow-md py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 flex items-center">
          <button
            onClick={goBack}
            className="p-2 rounded-full hover:bg-gray-100 mr-4"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">List Your Product</h1>
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
                <span className="text-xs">Category</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </div>
                <span className="text-xs">Photos</span>
              </div>
            </div>
          </div>
          
          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6">
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
                          alt="Product preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tag size={32} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800">{formData.title}</h3>
                      <p className="text-blue-600 font-bold text-xl">
                        ₹{formData.price ? parseFloat(formData.price).toLocaleString('en-IN') : '0'}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                          {formData.category}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                          {formData.condition}
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
                </div>
                
                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Once published, your listing will be visible to all residents in your society. You can delete it later if needed.
                  </p>
                </div>
              </div>
            ) : (
              renderStepContent()
            )}
            
            {/* Error and Success Messages */}
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
                {errorMessage}
              </div>
            )}
            
            {successMessage && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100 flex items-center">
                <CheckCircle size={18} className="text-green-500 mr-2" />
                {successMessage}
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              {confirmPublish ? (
                <>
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
                        Listing...
                      </>
                    ) : (
                      'Confirm & Publish'
                    )}
                  </button>
                </>
              ) : (
                <>
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
                      type="button"
                      onClick={() => setConfirmPublish(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Publish Listing
                    </button>
                  )}
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct; 