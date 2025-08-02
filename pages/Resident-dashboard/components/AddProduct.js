import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Upload, X, Camera, Plus, CheckCircle, AlertTriangle, ChevronLeft, Tag, ArrowRight, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

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
      toast.error('Error fetching resident details');
      router.push('/login');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setErrorMessage('');
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + selectedImages.length > 5) {
      toast.error('You can only upload a maximum of 5 images');
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
      toast.error('You must be logged in to list a product');
      return;
    }

    // Final validation
    if (!formData.title.trim() || !formData.description.trim() || !formData.price ||
      !formData.category || !formData.condition) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Upload images first if there are any
      let imageUrls = [];
      if (selectedImages.length > 0) {
        const token = localStorage.getItem('Resident');
        const formDataImages = new FormData();
        selectedImages.forEach(file => {
          formDataImages.append('image', file);
        });

        const uploadResponse = await fetch('/api/Announcement-Api/upload-images', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataImages,
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
      toast.success('Product listed successfully!');

      // Reset form and redirect after a short delay
      setTimeout(() => {
        router.push('/Resident-dashboard/components/Marketplace');
      }, 2000);

    } catch (error) {
      console.error('Error listing product:', error);
      const errorMsg = error.response?.data?.message || 'An error occurred while listing your product';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Only create product when explicitly confirmed
    createProduct();
  };

  const resetConfirmation = () => {
    setConfirmPublish(false);
  };

  const categories = [
    { value: 'Electronics', label: 'Electronics', icon: '📱', color: 'from-blue-400 to-blue-600' },
    { value: 'Furniture', label: 'Furniture', icon: '🪑', color: 'from-amber-400 to-amber-600' },
    { value: 'Clothing', label: 'Clothing', icon: '👕', color: 'from-pink-400 to-pink-600' },
    { value: 'Books', label: 'Books', icon: '📚', color: 'from-green-400 to-green-600' },
    { value: 'Sports', label: 'Sports', icon: '🏀', color: 'from-orange-400 to-orange-600' },
    { value: 'Home Appliances', label: 'Home Appliances', icon: '🧹', color: 'from-purple-400 to-purple-600' },
    { value: 'Vehicles', label: 'Vehicles', icon: '🚗', color: 'from-red-400 to-red-600' },
    { value: 'Others', label: 'Others', icon: '📦', color: 'from-gray-400 to-gray-600' }
  ];

  const conditionOptions = [
    { value: 'New', label: 'New', description: 'Brand new, unused, unopened', color: 'from-emerald-400 to-emerald-600' },
    { value: 'Like New', label: 'Like New', description: 'Used once or twice, as good as new', color: 'from-green-400 to-green-600' },
    { value: 'Good', label: 'Good', description: 'Used with minor signs of wear', color: 'from-blue-400 to-blue-600' },
    { value: 'Fair', label: 'Fair', description: 'Used with noticeable signs of wear', color: 'from-yellow-400 to-yellow-600' },
    { value: 'Poor', label: 'Poor', description: 'Heavily used, still functional', color: 'from-red-400 to-red-600' }
  ];

  const goBack = () => {
    router.push('/Resident-dashboard/components/Marketplace');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Basic Details
              </h2>
              <p className="text-gray-600">Tell us about what you're selling</p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. iPhone 12 Pro Max 128GB"
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/100 characters
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your item in detail (condition, features, reason for selling)"
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm resize-none"
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/1000 characters
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-gray-500 font-medium">₹</span>
                </div>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full pl-4 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm"
                  min="0"
                />
              </div>
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Additional Details
              </h2>
              <p className="text-gray-600">Help buyers find your item</p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <motion.button
                    key={category.value}
                    type="button"
                    className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-xl hover:shadow-lg transition-all duration-200 ${formData.category === category.value
                        ? 'border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg'
                        : 'border-gray-200 bg-white/80 backdrop-blur-sm hover:border-indigo-200'
                      }`}
                    onClick={() => setFormData({ ...formData, category: category.value })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {formData.category === category.value && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-xl"
                        layoutId="categorySelection"
                      />
                    )}
                    <span className="text-3xl mb-2">{category.icon}</span>
                    <span className="text-sm font-medium text-center">{category.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Condition <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {conditionOptions.map((option) => (
                  <motion.div
                    key={option.value}
                    className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.condition === option.value
                        ? 'border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg'
                        : 'border-gray-200 bg-white/80 backdrop-blur-sm hover:border-indigo-200 hover:shadow-md'
                      }`}
                    onClick={() => setFormData({ ...formData, condition: option.value })}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {formData.condition === option.value && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-xl"
                        layoutId="conditionSelection"
                      />
                    )}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${formData.condition === option.value
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-gray-300'
                      }`}>
                      {formData.condition === option.value && (
                        <CheckCircle size={16} className="text-white" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-800">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Add Photos
              </h2>
              <p className="text-gray-600">Add up to 5 photos to showcase your item</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center bg-gradient-to-r from-indigo-50/50 to-purple-50/50 backdrop-blur-sm"
            >
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
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                    <Upload size={32} className="text-white" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700 mb-2">Click to upload images</p>
                  <p className="text-sm text-gray-500">JPG, PNG or WEBP (max. 5 images)</p>
                </label>
              )}

              {imagePreviewUrls.length > 0 && (
                <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviewUrls.map((url, index) => (
                    <motion.div
                      key={index}
                      className="relative group"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="h-32 w-full object-cover rounded-xl shadow-lg"
                      />
                      <motion.button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X size={16} />
                      </motion.button>
                    </motion.div>
                  ))}

                  {imagePreviewUrls.length < 5 && (
                    <label
                      htmlFor="images"
                      className="h-32 border-2 border-dashed border-indigo-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors bg-white/50 backdrop-blur-sm"
                    >
                      <Plus size={24} className="text-indigo-400 mb-2" />
                      <span className="text-sm text-indigo-600 font-medium">Add More</span>
                    </label>
                  )}
                </div>
              )}
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-xl"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Sparkles size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">Listing Tips</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Clear, well-lit photos get more interest</li>
                    <li>• Add photos from multiple angles</li>
                    <li>• Include photos of any defects or wear</li>
                    <li>• Avoid using stock photos; show the actual item</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-sm border border-indigo-100 p-6 rounded-xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="mr-2 text-indigo-600" size={20} />
                Product Preview
              </h3>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl overflow-hidden">
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
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-lg line-clamp-1 mb-1">
                    {formData.title || 'Product Title'}
                  </p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {formData.price ? formatPrice(parseFloat(formData.price)) : '₹0'}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full">
                      {formData.category || 'Category'}
                    </span>
                    <span className="text-xs font-medium px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full">
                      {formData.condition}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {formData.description || 'Product description'}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
    }
  };

  if (!residentData) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-r from-indigo-100 to-purple-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-indigo-700 font-medium">Loading...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-r from-indigo-100 to-purple-50 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background pattern overlay */}
      <div className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366F1' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}>
      </div>

      {/* Header */}
      <motion.div
        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-6 px-4 shadow-lg relative z-10"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            {/* Back Button on the left */}
            <motion.button
              onClick={goBack}
              className="flex items-center space-x-2 text-white bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/30 transition-colors transform hover:scale-105 duration-200"
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Back</span>
            </motion.button>

            {/* Title aligned to right on small screens */}
            <motion.h1
              className="text-2xl font-bold text-right sm:text-center w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              List Your Product
            </motion.h1>

            {/* Empty space to maintain spacing */}
            <div className="w-[108px] hidden sm:block"></div>
          </div>


          {/* Progress Bar */}
          <motion.div
            className="w-full bg-white/20 backdrop-blur-sm rounded-full h-2 mb-4"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </motion.div>

          {/* Step Indicators */}
          <div className="flex justify-center">
            <div className="flex items-center justify-between w-full max-w-md">
              {[
                { number: 1, label: 'Details' },
                { number: 2, label: 'Category' },
                { number: 3, label: 'Photos' }
              ].map((stepItem, index) => (
                <motion.div
                  key={stepItem.number}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 font-semibold transition-all duration-300 ${step >= stepItem.number
                      ? 'bg-white text-indigo-600 shadow-lg'
                      : 'bg-white/30 text-white/70'
                    }`}>
                    {stepItem.number}
                  </div>
                  <span className="text-sm font-medium">{stepItem.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <motion.div
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-50 overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8">
            <AnimatePresence mode="wait">
              {confirmPublish ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  className="space-y-6"
                >
                  <div className="mb-6 text-center">
                    <motion.div
                      className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <CheckCircle size={32} className="text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      Confirm Your Listing
                    </h2>
                    <p className="text-gray-600">Review your listing before publishing</p>
                  </div>

                  <motion.div
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-6 rounded-xl"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0 w-32 h-32 bg-gray-200 rounded-xl overflow-hidden shadow-lg">
                        {imagePreviewUrls.length > 0 ? (
                          <img
                            src={imagePreviewUrls[0]}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200">
                            <Tag size={40} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-800 mb-2">{formData.title}</h3>
                        <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                          {formatPrice(parseFloat(formData.price))}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="text-sm font-medium px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full">
                            {formData.category}
                          </span>
                          <span className="text-sm font-medium px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full">
                            {formData.condition}
                          </span>
                        </div>
                        <p className="text-gray-600 line-clamp-3">{formData.description}</p>
                      </div>
                    </div>

                    {imagePreviewUrls.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          Photos ({imagePreviewUrls.length})
                        </p>
                        <div className="flex space-x-3 overflow-x-auto pb-2">
                          {imagePreviewUrls.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="h-20 w-20 object-cover rounded-lg flex-shrink-0 shadow-md"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 p-4 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center">
                      <AlertTriangle size={20} className="text-yellow-600 mr-3" />
                      <p className="text-sm text-yellow-800 font-medium">
                        Once published, your listing will be visible to all residents in your society. You can delete it later if needed.
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                renderStepContent()
              )}
            </AnimatePresence>

            {/* Error and Success Messages */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  className="mt-6 p-4 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-xl border border-red-200 flex items-center"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <AlertTriangle size={20} className="mr-3 text-red-500" />
                  {errorMessage}
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-100 text-green-700 rounded-xl border border-green-200 flex items-center"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CheckCircle size={20} className="text-green-500 mr-3" />
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <motion.div
              className="mt-8 flex justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {confirmPublish ? (
                <>
                  <motion.button
                    type="button"
                    onClick={resetConfirmation}
                    className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Edit Listing
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={createProduct}
                    disabled={loading}
                    className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center ${loading
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                    whileHover={!loading ? { scale: 1.02 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} className="mr-2" />
                        Confirm & Publish
                      </>
                    )}
                  </motion.button>
                </>
              ) : (
                <>
                  {step > 1 ? (
                    <motion.button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ChevronLeft size={20} className="inline mr-1" />
                      Back
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={goBack}
                      className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                  )}

                  {step < 3 ? (
                    <motion.button
                      type="button"
                      onClick={handleNextStep}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Continue
                      <ArrowRight size={20} className="inline ml-2" />
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={() => setConfirmPublish(true)}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Review Listing
                      <ArrowRight size={20} className="inline ml-2" />
                    </motion.button>
                  )}
                </>
              )}
            </motion.div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AddProduct;