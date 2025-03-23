import React, { useState, useCallback, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useRouter } from 'next/router';
import {
  Camera, User, Clock, LogOut, Home, Building,
  CheckCircle, XCircle, Layers, MessageSquare,
  Calendar, Shield, Loader
} from 'lucide-react';
import { FaArrowLeft } from "react-icons/fa";

const VisitorEntry = () => {
  const router = useRouter();
  const [visitorName, setVisitorName] = useState('');
  const [visitorImage, setVisitorImage] = useState(null);
  const [visitorReason, setVisitorReason] = useState('');
  const [entryTime, setEntryTime] = useState(new Date().toISOString().split('.')[0]);
  const [exitTime, setExitTime] = useState('');
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
  const [selectedFlat, setSelectedFlat] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);
  const [activeStep, setActiveStep] = useState(1);

  const webcamRef = useRef(null);

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

  // Handle block selection
  const handleBlockChange = (e) => {
    const block = e.target.value;
    setSelectedBlock(block);
    setSelectedFloor('');
    setSelectedFlat('');
    setSelectedResident(null);
  };

  // Handle floor selection
  const handleFloorChange = (e) => {
    const floor = e.target.value;
    setSelectedFloor(floor);
    setSelectedFlat('');
    setSelectedResident(null);
  };

  // Handle flat selection and auto-populate resident data
  const handleFlatChange = (e) => {
    const flat = e.target.value;
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
        exitTime,
        CreatedBy: securityId
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
      setExitTime('');
      setActiveStep(1);

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header with security details */}
      <div className="classss">
        <button onClick={() => router.back()} className="flex items-center p-4 md:p-6 space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors">
          <FaArrowLeft size={18} />
          <span className="text-base">Back</span>
        </button>
      </div>
      <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4 md:mb-8 text-center">Security Guard Profile</h1>

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

          {/* Block Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Layers size={18} className="text-gray-500" />
              </div>
              <select
                value={selectedBlock}
                onChange={handleBlockChange}
                className="block w-full pl-10 p-2.5 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Block</option>
                {Object.keys(structuredResidents).sort().map((block) => (
                  <option key={block} value={block}>
                    Block {block}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Floor Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Layers size={18} className="text-gray-500" />
              </div>
              <select
                value={selectedFloor}
                onChange={handleFloorChange}
                className="block w-full pl-10 p-2.5 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedBlock}
                required
              >
                <option value="">Select Floor</option>
                {selectedBlock &&
                  Object.keys(structuredResidents[selectedBlock] || {}).sort().map((floor) => (
                    <option key={floor} value={floor}>
                      Floor {floor}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Flat Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Flat Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Home size={18} className="text-gray-500" />
              </div>
              <select
                value={selectedFlat}
                onChange={handleFlatChange}
                className="block w-full pl-10 p-2.5 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedFloor}
                required
              >
                <option value="">Select Flat</option>
                {selectedBlock &&
                  selectedFloor &&
                  Object.keys(structuredResidents[selectedBlock][selectedFloor] || {}).sort().map((flat) => (
                    <option key={flat} value={flat}>
                      Flat {flat}
                    </option>
                  ))}
              </select>
            </div>
          </div>

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

          {/* Visitor Reason */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <MessageSquare size={16} className="mr-1 text-gray-600" />
              Purpose of Visit
            </label>
            <input
              type="text"
              value={visitorReason}
              onChange={(e) => setVisitorReason(e.target.value)}
              className="block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="e.g., Delivery, Guest, Maintenance"
            />
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
            <div>
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
            </div>
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