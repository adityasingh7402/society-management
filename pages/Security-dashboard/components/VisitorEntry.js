import React, { useState, useCallback, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useRouter } from 'next/router';
import {
  Camera, User, Clock, LogOut, Home, Building,
  CheckCircle, XCircle, Layers, MessageSquare,
  Calendar, Shield, Loader, Package, Users, Tool,
  Briefcase, Heart, Coffee, Truck, ShoppingBag
} from 'lucide-react';
import { FaArrowLeft } from "react-icons/fa";

const VisitorEntry = () => {
  const router = useRouter();
  const [visitorName, setVisitorName] = useState('');
  const [visitorImage, setVisitorImage] = useState(null);
  const [visitorReason, setVisitorReason] = useState('');
  const [entryTime, setEntryTime] = useState(new Date().toISOString().split('.')[0]);
  const [showCamera, setShowCamera] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('pending');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [securityDetails, setSecurityDetails] = useState({});
  const [securityId, setSecurityId] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState('environment');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');

  // Structure and resident state 
  const [structuredResidents, setStructuredResidents] = useState({});
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [structureType, setStructureType] = useState('Block');
  const [selectedFlat, setSelectedFlat] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);
  const [activeStep, setActiveStep] = useState(1);

  // New states for matrix selection
  const [loadingBlock, setLoadingBlock] = useState(false);
  const [loadingFloor, setLoadingFloor] = useState(false);
  const [loadingFlat, setLoadingFlat] = useState(false);
  const [selectedVisitPurpose, setSelectedVisitPurpose] = useState('');
  const [selectedDeliveryBrand, setSelectedDeliveryBrand] = useState('');
  const [showDeliveryBrands, setShowDeliveryBrands] = useState(false);

  const webcamRef = useRef(null);

  // Visit purpose categories
  const visitPurposes = [
    { id: 'delivery', name: 'Delivery', icon: <Package size={24} /> },
    { id: 'family', name: 'Family Visit', icon: <Users size={24} /> },
    { id: 'maintenance', name: 'Maintenance', icon: <Tool size={24} /> },
    { id: 'official', name: 'Official', icon: <Briefcase size={24} /> },
    { id: 'medical', name: 'Medical', icon: <Heart size={24} /> },
    { id: 'housekeeping', name: 'Housekeeping', icon: <Home size={24} /> },
    { id: 'food', name: 'Food', icon: <Coffee size={24} /> },
    { id: 'courier', name: 'Courier', icon: <Truck size={24} /> },
    { id: 'shopping', name: 'Shopping', icon: <ShoppingBag size={24} /> }
  ];

  // Delivery brands
  const deliveryBrands = [
    { id: 'zomato', name: 'Zomato', logo: '/images/brands/zomato.png' },
    { id: 'swiggy', name: 'Swiggy', logo: '/images/brands/swiggy.png' },
    { id: 'dominos', name: 'Dominos', logo: '/images/brands/dominos.png' },
    { id: 'zepto', name: 'Zepto', logo: '/images/brands/zepto.png' },
    { id: 'blinkit', name: 'Blinkit', logo: '/images/brands/blinkit.png' },
    { id: 'amazon', name: 'Amazon', logo: '/images/brands/amazon.png' },
    { id: 'flipkart', name: 'Flipkart', logo: '/images/brands/flipkart.png' },
    { id: 'bigbasket', name: 'BigBasket', logo: '/images/brands/bigbasket.png' },
    { id: 'dunzo', name: 'Dunzo', logo: '/images/brands/dunzo.png' },
    { id: 'other', name: 'Other', logo: '/images/brands/other.png' }
  ];

  // Fetch security details on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("Security");
        if (!token) {
          router.push("/SecurityLogin");
          return;
        }

        const response = await fetch("/api/Security-Api/get-security-details", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setSecurityDetails(data);
        setSecurityId(data._id);
      } catch (error) {
        console.error("Error fetching profile:", error);
        showNotification("Failed to fetch security profile", "error");
      }
    };

    fetchProfile();
  }, [router]);

  // Fetch residents on component mount
  useEffect(() => {
    const fetchResidents = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/Security-Api/getAllResidents');
        if (response.ok) {
          const data = await response.json();
          organizeResidentsByStructure(data);
        } else {
          console.error('Failed to fetch residents');
        }
      } catch (error) {
        console.error('Error fetching residents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  // Show notification popup
  const showNotification = (message, type) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);

    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  // Organize residents by apartment structure
  const organizeResidentsByStructure = (residents) => {
    const structure = {};

    if (residents.length > 0) {
      // Look for the first resident with flatDetails
      const residentWithFlatDetails = residents.find(r => r.flatDetails && r.flatDetails.structureType);
      if (residentWithFlatDetails && residentWithFlatDetails.flatDetails.structureType) {
        setStructureType(residentWithFlatDetails.flatDetails.structureType);
      }
      // If none found, keep the default 'Block'
    }
    residents.forEach(resident => {
      if (!resident.flatDetails || !resident.flatDetails.flatNumber) return;

      // Parse flat number format (e.g., "A-101" where A is block and 101 is flat number) 
      const flatNumberParts = resident.flatDetails.flatNumber.split('-');
      if (flatNumberParts.length !== 2) return;

      const blockName = flatNumberParts[0];
      const flatNumber = flatNumberParts[1];
      const floorNumber = flatNumber.substring(0, 1); // Assuming first digit of flat number is floor

      // Initialize block if it doesn't exist 
      if (!structure[blockName]) {
        structure[blockName] = {};
      }

      // Initialize floor if it doesn't exist 
      if (!structure[blockName][floorNumber]) {
        structure[blockName][floorNumber] = {};
      }

      // Initialize flat if it doesn't exist 
      if (!structure[blockName][floorNumber][flatNumber]) {
        structure[blockName][floorNumber][flatNumber] = [];
      }

      // Add resident to the flat 
      structure[blockName][floorNumber][flatNumber].push(resident);
    });

    setStructuredResidents(structure);
  };

  // Handle block selection with loading animation
  const handleBlockSelect = (block) => {
    setLoadingBlock(true);
    setTimeout(() => {
      setSelectedBlock(block);
      setSelectedFloor('');
      setSelectedFlat('');
      setSelectedResident(null);
      setLoadingBlock(false);
    }, 500); // Simulate loading for 500ms
  };

  // Handle floor selection with loading animation
  const handleFloorSelect = (floor) => {
    setLoadingFloor(true);
    setTimeout(() => {
      setSelectedFloor(floor);
      setSelectedFlat('');
      setSelectedResident(null);
      setLoadingFloor(false);
    }, 500); // Simulate loading for 500ms
  };

  // Handle flat selection with loading animation
  const handleFlatSelect = (flat) => {
    setLoadingFlat(true);
    setTimeout(() => {
      setSelectedFlat(flat);

      // Auto-select the first resident in the flat
      if (selectedBlock && selectedFloor && flat) {
        const residents = structuredResidents[selectedBlock][selectedFloor][flat];
        if (residents && residents.length > 0) {
          setSelectedResident(residents[0]);
        } else {
          setSelectedResident(null);
        }
      }
      setLoadingFlat(false);
    }, 500); // Simulate loading for 500ms
  };

  // Handle visit purpose selection
  const handleVisitPurposeSelect = (purpose) => {
    setSelectedVisitPurpose(purpose);
    setVisitorReason(purpose.name);

    // Show delivery brands if delivery is selected
    if (purpose.id === 'delivery') {
      setShowDeliveryBrands(true);
    } else {
      setShowDeliveryBrands(false);
      setSelectedDeliveryBrand('');
    }
  };

  // Handle delivery brand selection
  const handleDeliveryBrandSelect = (brand) => {
    setSelectedDeliveryBrand(brand);
    setVisitorReason(`Delivery - ${brand.name}`);
  };

  // Handle step navigation
  const goToStep = (step) => {
    if (step === 2 && !selectedFlat) {
      showNotification("Please select a flat first", "error");
      return;
    }

    if (step === 3 && !selectedResident) {
      showNotification("Please ensure a resident is selected", "error");
      return;
    }

    setActiveStep(step);
  };

  // Camera and photo capture functions
  const requestCameraAccess = () => {
    setShowCamera(true);
  };

  const handleUserMedia = () => {
    setIsCameraReady(true);
    setPermissionStatus('granted');
  };

  const handleUserMediaError = () => {
    setPermissionStatus('denied');
    setIsCameraReady(false);
    showNotification("Camera access denied. Please check browser settings.", "error");
  };

  // Upload image after visitor entry is created
  const uploadImage = async (file, visitorId) => {
    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('visitorId', visitorId); // Use the actual visitor ID now
      formData.append('image', file);

      const imageUploadResponse = await fetch('/api/VisitorApi/Visitor-imageUpload', {
        method: 'POST',
        body: formData,
      });

      if (!imageUploadResponse.ok) {
        throw new Error('Image upload failed');
      }

      const imageData = await imageUploadResponse.json();
      showNotification("Image uploaded successfully", "success");

      return imageData;
    } catch (error) {
      console.error('Error uploading image:', error);
      showNotification(error.message || 'Error uploading image', "error");
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();

      // Convert base64 image to file object
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'visitor-photo.jpg', { type: 'image/jpeg' });
          setVisitorImage(file);
          setShowCamera(false);
        })
        .catch((err) => {
          console.error('Error converting image:', err);
          showNotification("Failed to capture photo", "error");
        });
    }
  }, [webcamRef]);

  // Handle form submission - First create visitor entry, then upload image
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedResident) {
      showNotification("Please select a valid flat with resident information", "error");
      return;
    }

    if (!visitorImage) {
      showNotification("Please take a photo of the visitor", "error");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create visitor entry first without image
      const visitorData = {
        societyId: securityDetails.societyId,
        blockName: selectedBlock,
        floorNumber: parseInt(selectedFloor),
        flatNumber: selectedFlat,
        residentId: selectedResident._id,
        ownerName: selectedResident.name,
        ownerMobile: selectedResident.phone,
        ownerEmail: selectedResident.email,
        visitorName,
        visitorReason,
        entryTime,
        CreatedBy: securityId,
        guardName: securityDetails.guardName,
        guardImage: securityDetails.guardImage,
        guardPhone: securityDetails.guardPhone
      };

      const entryResponse = await fetch('/api/VisitorApi/VisitorEntry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorData),
      });

      if (!entryResponse.ok) {
        throw new Error('Failed to create visitor entry');
      }

      const entryData = await entryResponse.json();
      const visitorId = entryData._id || entryData.visitorId;

      if (!visitorId) {
        throw new Error('No visitor ID returned from server');
      }

      // Step 2: Now upload the image with the actual visitor ID
      const imageData = await uploadImage(visitorImage, visitorId);

      // Step 3: Update visitor entry with image information if needed
      // Only if the API doesn't handle this internally
      if (imageData && imageData.imageId) {
        await fetch(`/api/VisitorApi/update-visitor/${visitorId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorImageId: imageData.imageId }),
        });
      }

      // Success!
      showNotification("Visitor entry created successfully!", "success");

      // Reset form
      setVisitorName('');
      setVisitorImage(null);
      setVisitorReason('');
      setSelectedBlock('');
      setSelectedFloor('');
      setSelectedFlat('');
      setSelectedResident(null);
      setEntryTime(new Date().toISOString().split('.')[0]);
      setActiveStep(1);
      setSelectedVisitPurpose('');
      setSelectedDeliveryBrand('');
      setShowDeliveryBrands(false);

    } catch (error) {
      console.error('Error creating visitor entry:', error);
      showNotification(error.message || 'Error creating visitor entry', "error");
    } finally {
      setLoading(false);
    }
  };

  // Render progress steps
  const renderProgressSteps = () => {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className="flex-1 relative"
              onClick={() => goToStep(step)}
            >
              <div className={`
                flex flex-col items-center cursor-pointer
                ${step < activeStep ? 'text-green-600' : step === activeStep ? 'text-blue-600' : 'text-gray-400'}
              `}>
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-1
                  ${step < activeStep
                    ? 'bg-green-100 border-2 border-green-500'
                    : step === activeStep
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-100 border-2 border-gray-300'}
                `}>
                  {step === 1 && <Building size={20} />}
                  {step === 2 && <User size={20} />}
                  {step === 3 && <Camera size={20} />}
                </div>
                <span className="text-xs font-medium mt-1 text-center">
                  {step === 1 && "Select Flat"}
                  {step === 2 && "Resident"}
                  {step === 3 && "Visitor"}
                </span>
              </div>

              {/* Connector line */}
              {step < 3 && (
                <div className={`absolute top-5 left-full w-full h-0.5 -ml-2.5 ${step < activeStep ? 'bg-green-500' : 'bg-gray-300'
                  }`} style={{ width: 'calc(100% - 20px)' }}></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render block matrix
  const renderBlockMatrix = () => {
    const blocks = Object.keys(structuredResidents).sort();

    return (
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
          <Building size={18} className="mr-2 text-blue-600" />
          Select {structureType}
        </h3>

        {loadingBlock ? (
          <div className="flex justify-center items-center py-8">
            <Loader size={30} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {blocks.map(block => (
              <button
                key={block}
                onClick={() => handleBlockSelect(block)}
                className={`
                  p-4 rounded-lg shadow-md text-center transition-all duration-200
                  ${selectedBlock === block
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-2'
                    : 'bg-white text-gray-800 hover:bg-blue-50 hover:shadow-lg'}
                `}
              >
                <Building size={24} className={`mx-auto mb-2 ${selectedBlock === block ? 'text-white' : 'text-blue-600'}`} />
                <span className="font-medium">{structureType} {block}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render floor matrix
  const renderFloorMatrix = () => {
    if (!selectedBlock) return null;

    const floors = Object.keys(structuredResidents[selectedBlock] || {}).sort();

    return (
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
          <Layers size={18} className="mr-2 text-blue-600" />
          Select Floor
        </h3>

        {loadingFloor ? (
          <div className="flex justify-center items-center py-8">
            <Loader size={30} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {floors.map(floor => (
              <button
                key={floor}
                onClick={() => handleFloorSelect(floor)}
                className={`
                  p-4 rounded-lg shadow-md text-center transition-all duration-200
                  ${selectedFloor === floor
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-2'
                    : 'bg-white text-gray-800 hover:bg-indigo-50 hover:shadow-lg'}
                `}
              >
                <Layers size={24} className={`mx-auto mb-2 ${selectedFloor === floor ? 'text-white' : 'text-indigo-600'}`} />
                <span className="font-medium">Floor {floor}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render flat matrix
  const renderFlatMatrix = () => {
    if (!selectedBlock || !selectedFloor) return null;

    const flats = Object.keys(structuredResidents[selectedBlock][selectedFloor] || {}).sort();

    return (
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
          <Home size={18} className="mr-2 text-blue-600" />
          Select Flat
        </h3>

        {loadingFlat ? (
          <div className="flex justify-center items-center py-8">
            <Loader size={30} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {flats.map(flat => (
              <button
                key={flat}
                onClick={() => handleFlatSelect(flat)}
                className={`
                  p-4 rounded-lg shadow-md text-center transition-all duration-200
                  ${selectedFlat === flat
                    ? 'bg-teal-600 text-white ring-2 ring-teal-300 ring-offset-2'
                    : 'bg-white text-gray-800 hover:bg-teal-50 hover:shadow-lg'}
                `}
              >
                <Home size={24} className={`mx-auto mb-2 ${selectedFlat === flat ? 'text-white' : 'text-teal-600'}`} />
                <span className="font-medium">Flat {flat}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render visit purpose matrix
  const renderVisitPurposeMatrix = () => {
    return (
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
          <MessageSquare size={18} className="mr-2 text-blue-600" />
          Purpose of Visit
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {visitPurposes.map(purpose => (
            <button
              key={purpose.id}
              onClick={() => handleVisitPurposeSelect(purpose)}
              className={`
                p-4 rounded-lg shadow-md text-center transition-all duration-200
                ${selectedVisitPurpose.id === purpose.id
                  ? 'bg-purple-600 text-white ring-2 ring-purple-300 ring-offset-2'
                  : 'bg-white text-gray-800 hover:bg-purple-50 hover:shadow-lg'}
              `}
            >
              <div className={`mx-auto mb-2 ${selectedVisitPurpose.id === purpose.id ? 'text-white' : 'text-purple-600'}`}>
                {purpose.icon}
              </div>
              <span className="font-medium">{purpose.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render delivery brands matrix
  const renderDeliveryBrandsMatrix = () => {
    if (!showDeliveryBrands) return null;

    return (
      <div className="mb-6 animate-fade-in">
        <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
          <Truck size={18} className="mr-2 text-blue-600" />
          Select Delivery Service
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {deliveryBrands.map(brand => (
            <button
              key={brand.id}
              onClick={() => handleDeliveryBrandSelect(brand)}
              className={`
                p-4 rounded-lg shadow-md text-center transition-all duration-200
                ${selectedDeliveryBrand.id === brand.id
                  ? 'bg-orange-50 ring-2 ring-orange-400 ring-offset-2'
                  : 'bg-white hover:bg-orange-50 hover:shadow-lg'}
              `}
            >
              <div className="h-12 w-12 mx-auto mb-2 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Fallback icon if image fails to load */}
                  <Package size={24} className="text-gray-400" />
                </div>
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-full w-full object-contain relative z-10"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <span className="font-medium text-gray-800">{brand.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header with security details */}
      <div className="mb-6">
        <button onClick={() => router.back()} className="flex items-center p-4 md:p-6 space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors">
          <FaArrowLeft size={18} />
          <span className="text-base">Back</span>
        </button>
      </div>
      <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4 md:mb-8 text-center">Visitor Entry System</h1>

      {/* Notification Popup */}
      {showPopup && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-xs animate-fade-in ${popupType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
          <div className="flex items-center">
            <span className="mr-2 flex-shrink-0">
              {popupType === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            </span>
            <p className="text-sm">{popupMessage}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="ml-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 flex-shrink-0"
              aria-label="Close notification"
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center">
            <Loader className="animate-spin h-8 w-8 text-blue-500 mb-2" />
            <p className="text-center">Processing...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        {/* Progress Steps */}
        {renderProgressSteps()}

        {/* Step 1: Select Flat */}
        <div className={`${activeStep === 1 ? 'block' : 'hidden'} mb-6 border-b pb-4`}>
          <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <Building className="mr-2 text-blue-600" size={20} />
            Select Apartment
          </h2>

          {/* Block Matrix */}
          {renderBlockMatrix()}

          {/* Floor Matrix - Only show if block is selected */}
          {selectedBlock && renderFloorMatrix()}

          {/* Flat Matrix - Only show if floor is selected */}
          {selectedBlock && selectedFloor && renderFlatMatrix()}

          {/* Navigation Button */}
          <div className="mt-6">
            <button
              type="button"
              disabled={!selectedFlat}
              onClick={() => goToStep(2)}
              className={`w-full py-3 rounded-md text-white font-medium flex items-center justify-center ${!selectedFlat
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              Continue
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Step 2: Resident Details Section */}
        <div className={`${activeStep === 2 ? 'block' : 'hidden'} mb-6 border-b pb-4`}>
          <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <User className="mr-2 text-blue-600" size={20} />
            Resident Details
          </h2>

          <div className="bg-blue-50 p-4 rounded-md shadow-sm">
            {selectedResident ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <User size={16} className="mr-1 text-blue-600" />
                      Resident Name
                    </label>
                    <div className="p-3 bg-white border border-gray-300 rounded-md shadow-sm">
                      {selectedResident.name || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Mobile Number
                    </label>
                    <div className="p-3 bg-white border border-gray-300 rounded-md shadow-sm">
                      {selectedResident.phone || 'N/A'}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </label>
                    <div className="p-3 bg-white border border-gray-300 rounded-md shadow-sm">
                      {selectedResident.email || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-2 mt-3 bg-blue-100 rounded-md">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-700">
                    Selected apartment: Block {selectedBlock}, Floor {selectedFloor}, Flat {selectedFlat}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center p-6 text-gray-500 flex flex-col items-center">
                <User size={40} className="text-gray-400 mb-2" />
                <p>Resident information will appear here after selecting a flat</p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between space-x-4">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="flex-1 py-3 border border-gray-300 rounded-md text-gray-700 font-medium bg-white hover:bg-gray-50 flex items-center justify-center"
            >
              <svg
                className="mr-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <button
              type="button"
              onClick={() => goToStep(3)}
              className="flex-1 py-3 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
            >
              Continue
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Step 3: Visitor Details Section */}
        <div className={`${activeStep === 3 ? 'block' : 'hidden'}`}>
          <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <User className="mr-2 text-blue-600" size={20} />
            Visitor Details
          </h2>

          {/* Visitor Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <User size={16} className="mr-1 text-gray-600" />
              Visitor Name
            </label>
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Enter visitor's full name"
            />
          </div>

          {/* Visit Purpose Matrix */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MessageSquare size={16} className="mr-1 text-gray-600" />
              Purpose of Visit
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {[
                { id: 'delivery', name: 'Delivery', icon: 'package' },
                { id: 'family', name: 'Family Visit', icon: 'users' },
                { id: 'maintenance', name: 'Maintenance', icon: 'tool' },
                { id: 'official', name: 'Official', icon: 'briefcase' },
                { id: 'medical', name: 'Medical', icon: 'heart' },
                { id: 'housekeeping', name: 'Housekeeping', icon: 'home' },
                { id: 'food', name: 'Food', icon: 'coffee' },
                { id: 'courier', name: 'Courier', icon: 'truck' }
              ].map(purpose => (
                <button
                  key={purpose.id}
                  type="button"
                  onClick={() => {
                    setVisitorReason(purpose.name);
                    // Show delivery brands if delivery is selected
                    if (purpose.id === 'delivery') {
                      setShowDeliveryBrands(true);
                    } else {
                      setShowDeliveryBrands(false);
                    }
                  }}
                  className={`p-3 rounded-lg shadow-md text-center transition-all duration-200
                    ${visitorReason === purpose.name
                      ? 'bg-purple-600 text-white ring-2 ring-purple-300 ring-offset-2'
                      : 'bg-white text-gray-800 hover:bg-purple-50 hover:shadow-lg'}`}
                >
                  <div className="flex flex-col items-center">
                    <span className={`${visitorReason === purpose.name ? 'text-white' : 'text-purple-600'}`}>
                      {purpose.icon === 'package' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                      {purpose.icon === 'users' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                      {purpose.icon === 'tool' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                      {purpose.icon === 'briefcase' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                      {purpose.icon === 'heart' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                      {purpose.icon === 'home' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                      {purpose.icon === 'coffee' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                      {purpose.icon === 'truck' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>}
                    </span>
                    <span className={`mt-2 text-sm font-medium ${visitorReason === purpose.name ? 'text-white' : 'text-gray-800'}`}>
                      {purpose.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Delivery Brands - Only show if delivery is selected */}
            {visitorReason === 'Delivery' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Select Delivery Service</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    { id: 'zomato', name: 'Zomato', logo: '/images/brands/zomato.png' },
                    { id: 'swiggy', name: 'Swiggy', logo: '/images/brands/swiggy.png' },
                    { id: 'dominos', name: 'Dominos', logo: '/images/brands/dominos.png' },
                    { id: 'zepto', name: 'Zepto', logo: '/images/brands/zepto.png' },
                    { id: 'blinkit', name: 'Blinkit', logo: '/images/brands/blinkit.png' },
                    { id: 'amazon', name: 'Amazon', logo: '/images/brands/amazon.png' },
                    { id: 'flipkart', name: 'Flipkart', logo: '/images/brands/flipkart.png' },
                    { id: 'bigbasket', name: 'BigBasket', logo: '/images/brands/bigbasket.png' },
                    { id: 'dunzo', name: 'Dunzo', logo: '/images/brands/dunzo.png' },
                    { id: 'other', name: 'Other', logo: '/images/brands/other.png' }
                  ].map(brand => (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => setVisitorReason(`Delivery - ${brand.name}`)}
                      className={`p-3 rounded-lg shadow-sm text-center transition-all duration-200
                        ${visitorReason === `Delivery - ${brand.name}`
                          ? 'bg-orange-50 ring-2 ring-orange-400 ring-offset-2'
                          : 'bg-white hover:bg-orange-50'}`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 mx-auto mb-2 relative flex items-center justify-center">
                          {/* Fallback icon if image fails to load */}
                          <svg className="w-6 h-6 text-gray-400 absolute" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="h-full w-full object-contain relative z-10"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-800">{brand.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual input option */}
            <div className="mt-3">
              <input
                type="text"
                value={visitorReason}
                onChange={(e) => setVisitorReason(e.target.value)}
                className="block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Or type purpose manually"
              />
            </div>
          </div>

          {/* Times Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Entry Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Clock size={16} className="mr-1 text-gray-600" />
                Entry Time
              </label>
              <input
                type="datetime-local"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                className="block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Exit Time (Optional) */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <LogOut size={16} className="mr-1 text-gray-600" />
                Exit Time <span className="text-gray-500 text-xs ml-1">(Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                className="block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div> */}
          </div>

          {/* Visitor Image (Camera Capture) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Camera size={16} className="mr-1 text-gray-600" />
              Visitor Image <span className="text-red-500 ml-1">*</span>
            </label>

            {!showCamera ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {visitorImage ? (
                  <div className="relative w-32 h-32 border border-gray-300 rounded-md overflow-hidden shadow-md">
                    <img
                      src={URL.createObjectURL(visitorImage)}
                      alt="Visitor"
                      className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setVisitorImage(null)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                      title="Remove photo"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                    <Camera size={32} className="text-gray-400" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={requestCameraAccess}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  {visitorImage ? "Retake Photo" : "Take Photo"}
                  <Camera size={16} className="ml-2" />
                </button>
              </div>
            ) : (
              <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                {permissionStatus === 'denied' ? (
                  <div className="p-4 text-center text-red-500 bg-red-50">
                    <p>Camera access denied. Please check your browser permissions.</p>
                  </div>
                ) : (
                  <>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        facingMode: cameraFacingMode  // 'environment' for back camera
                      }}
                      onUserMedia={handleUserMedia}
                      onUserMediaError={handleUserMediaError}
                      className="w-full h-auto"
                    />

                    {isCameraReady && (
                      <div className="p-2 flex justify-center bg-gray-100">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                        >
                          Capture
                          <Camera size={16} className="ml-2" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setCameraFacingMode(cameraFacingMode === 'environment' ? 'user' : 'environment')}
                          className="mx-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                        >
                          Switch Camera
                          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowCamera(false)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center"
                        >
                          Cancel
                          <XCircle size={16} className="ml-2" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between space-x-4">
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="flex-1 py-3 border border-gray-300 rounded-md text-gray-700 font-medium bg-white hover:bg-gray-50 flex items-center justify-center"
            >
              <svg
                className="mr-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <button
              type="submit"
              disabled={!visitorImage || loading}
              className={`flex-1 py-3 rounded-md text-white font-medium flex items-center justify-center ${!visitorImage || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              {loading ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Submit
                  <CheckCircle size={16} className="ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VisitorEntry;