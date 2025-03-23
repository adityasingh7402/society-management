import React, { useState, useCallback, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useRouter } from 'next/router';

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
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');
  
  // Structure and resident state 
  const [structuredResidents, setStructuredResidents] = useState({});
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedFlat, setSelectedFlat] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);
  
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
        const response = await fetch('/api/Resident-Api/getAllResidents');
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
      
    } catch (error) {
      console.error('Error creating visitor entry:', error);
      showNotification(error.message || 'Error creating visitor entry', "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Visitor Entry Form</h1>
      
      {/* Notification Popup */}
      {showPopup && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          popupType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {popupType === 'success' ? '✓' : '✕'}
            </span>
            <p>{popupMessage}</p>
            <button 
              onClick={() => setShowPopup(false)}
              className="ml-4 text-white font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Main loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-5 rounded-lg shadow-lg">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-center">Processing...</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6 border-b pb-4">
          <h2 className="text-lg font-medium text-gray-800 mb-3">1. Select Flat</h2>
          
          {/* Block Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
            <select
              value={selectedBlock}
              onChange={handleBlockChange}
              className="block w-full p-2 border border-gray-300 rounded-md bg-white"
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

          {/* Floor Selection - Only enabled if block is selected */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <select
              value={selectedFloor}
              onChange={handleFloorChange}
              className="block w-full p-2 border border-gray-300 rounded-md bg-white"
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

          {/* Flat Selection - Only enabled if floor is selected */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Flat No.</label>
            <select
              value={selectedFlat}
              onChange={handleFlatChange}
              className="block w-full p-2 border border-gray-300 rounded-md bg-white"
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

        {/* Resident Details Section - Auto-populated */}
        <div className="mb-6 border-b pb-4">
          <h2 className="text-lg font-medium text-gray-800 mb-3">2. Resident Details</h2>
          
          <div className="bg-gray-50 p-4 rounded-md">
            {selectedResident ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                    <div className="p-2 bg-gray-100 border border-gray-300 rounded-md">
                      {selectedResident.name || 'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                    <div className="p-2 bg-gray-100 border border-gray-300 rounded-md">
                      {selectedResident.phone || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="p-2 bg-gray-100 border border-gray-300 rounded-md">
                      {selectedResident.email || 'N/A'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-4 text-gray-500">
                Resident information will appear here after selecting a flat
              </div>
            )}
          </div>
        </div>

        {/* Visitor Details Section */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-3">3. Visitor Details</h2>
          
          {/* Visitor Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Name</label>
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Visitor Reason */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Visit</label>
            <input
              type="text"
              value={visitorReason}
              onChange={(e) => setVisitorReason(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md"
              required
              placeholder="e.g., Delivery, Guest, Maintenance"
            />
          </div>

          {/* Entry Time */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Entry Time</label>
            <input
              type="datetime-local"
              value={entryTime}
              onChange={(e) => setEntryTime(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Exit Time (Optional) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exit Time <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <input
              type="datetime-local"
              value={exitTime}
              onChange={(e) => setExitTime(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Visitor Image (Camera Capture) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Image <span className="text-red-500">*</span></label>
            
            {!showCamera ? (
              <div>
                {visitorImage ? (
                  <div className="mb-2">
                    <div className="relative w-32 h-32 border border-gray-300 rounded-md overflow-hidden">
                      <img 
                        src={URL.createObjectURL(visitorImage)} 
                        alt="Visitor" 
                        className="w-full h-full object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => setVisitorImage(null)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={requestCameraAccess}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {permissionStatus === 'denied' ? 'Camera Access Denied (Check Settings)' : 'Take Photo'}
                  </button>
                )}
                
                {permissionStatus === 'denied' && (
                  <p className="mt-1 text-sm text-red-600">
                    Camera access was denied. Please check your browser settings to enable camera access.
                  </p>
                )}
              </div>
            ) : (
              <div className="relative">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 320,
                    height: 240,
                    facingMode: 'environment', // Use back camera
                  }}
                  onUserMedia={handleUserMedia}
                  onUserMediaError={handleUserMediaError}
                  className="rounded-md border border-gray-300"
                />

                {isCameraReady ? (
                  <div className="mt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Capture
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCamera(false)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                    <div className="text-white">Accessing camera...</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedResident || !visitorImage || uploadingImage}
          className={`w-full py-3 rounded-md text-white font-medium ${
            loading || !selectedResident || !visitorImage || uploadingImage
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Submitting...' : 'Register Visitor Entry'}
        </button>
      </form>
    </div>
  );
};

export default VisitorEntry;