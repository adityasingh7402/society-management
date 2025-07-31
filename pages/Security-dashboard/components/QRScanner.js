import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/router';
import { 
  X, Camera, Keyboard, AlertCircle, CheckCircle2,
  Car, Bike, Clock, CheckCircle, XCircle, ArrowLeft,
  Loader2, User, ImageIcon
} from 'lucide-react';
import { FaMotorcycle } from "react-icons/fa";

// Helper function to get the correct suffix for floor numbers
const getFloorSuffix = (floor) => {
  if (floor >= 11 && floor <= 13) return 'th';
  const lastDigit = floor % 10;
  switch (lastDigit) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

function QRScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [securityDetails, setSecurityDetails] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [pinCode, setPinCode] = useState('');
  const [scannedQRData, setScannedQRData] = useState(null);
  const [selectedType, setSelectedType] = useState('vehicle');
  const [isScanning, setIsScanning] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('idle'); // idle, scanning, processing, success, loading
  const [errorDisplayTimeout, setErrorDisplayTimeout] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState(null);
  const hasProcessedRef = React.useRef(false);
  const scannerRef = React.useRef(null);
  const router = useRouter();

  // First effect for fetching security details
  useEffect(() => {
    const fetchSecurityDetails = async () => {
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
          throw new Error("Failed to fetch security details");
        }

        const data = await response.json();
        setSecurityDetails(data);
      } catch (err) {
        console.error('Error fetching security details:', err);
        setError(err.message);
      }
    };

    fetchSecurityDetails();
  }, []);

  // Set scanner status when modal opens/closes
  useEffect(() => {
    if (showScanModal) {
      setScannerStatus('scanning');
      setError(null); // Clear any existing errors when starting to scan
    } else {
      setScannerStatus('idle');
      // Clear error timeout when closing modal
      if (errorDisplayTimeout) {
        clearTimeout(errorDisplayTimeout);
        setErrorDisplayTimeout(null);
      }
    }
  }, [showScanModal]);

  // Initialize scanner after camera permission is granted
  useEffect(() => {
    if (!securityDetails || !showScanModal || cameraPermission !== true) return;

    const initializeScanner = async () => {
      try {
        // Reset the processed flag when starting new scan
        hasProcessedRef.current = false;

        // Clear any existing scanner instance
        if (scannerRef.current) {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
          scannerRef.current = null;
        }
        setScanner(null);

        // Clean up the scanner element
        const element = document.getElementById('qr-reader');
        if (element) {
          element.innerHTML = '';
        }

        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;
        
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2
        };

        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear')
          );
          
          const cameraId = backCamera ? backCamera.id : devices[0].id;
          
          await html5QrCode.start(
            cameraId,
            config,
            handleScanSuccess,
            handleScanError
          );
          
          setScanner(html5QrCode);
        } else {
          throw new Error('No cameras found on the device.');
        }
      } catch (err) {
        console.error('Error initializing scanner:', err);
        setError(err.message || 'Failed to initialize QR scanner.');
      }
    };

    const timeoutId = setTimeout(initializeScanner, 100);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current.clear();
          const element = document.getElementById('qr-reader');
          if (element) {
            element.innerHTML = '';
          }
          scannerRef.current = null;
          setScanner(null);
        }).catch(console.error);
      }
      // Reset the processed flag on cleanup
      hasProcessedRef.current = false;
    };
  }, [securityDetails, showScanModal, cameraPermission]);

  const requestCameraPermission = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { exact: "environment" } }
      });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission(true);
      setShowScanModal(true);
    } catch (err) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setCameraPermission(true);
        setShowScanModal(true);
      } catch (fallbackErr) {
        console.error('Camera permission error:', fallbackErr);
        setCameraPermission(false);
        setError('Camera access denied. Please check your camera permissions.');
      }
    }
  };

  // Function to check for duplicate attendance records
  const checkDuplicateAttendance = async (scanData) => {
    try {
      // Get unique identifier based on scan type
      const getUniqueIdentifier = (scanData) => {
        switch (scanData.type) {
          case 'guest':
            return {
              type: 'guest',
              visitorName: scanData.guestDetails?.name,
              visitorPhone: scanData.guestDetails?.phone,
              residentId: scanData.resident?._id
            };
          case 'service':
            return {
              type: 'service',
              visitorName: scanData.personnelDetails?.name,
              visitorPhone: scanData.personnelDetails?.phone,
              residentId: scanData.resident?._id
            };
          case 'vehicle':
            return {
              type: 'vehicle',
              visitorName: scanData.resident?.name,
              vehicleNumber: scanData.vehicleDetails?.registrationNumber,
              residentId: scanData.resident?._id
            };
          case 'animal':
            return {
              type: 'animal',
              visitorName: scanData.resident?.name,
              animalName: scanData.animalDetails?.name,
              residentId: scanData.resident?._id
            };
          default:
            return null;
        }
      };

      const identifier = getUniqueIdentifier(scanData);
      if (!identifier) return false;

      // Check for existing attendance record today
      const response = await fetch('/api/DailyAttendance-Api/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          societyId: securityDetails.societyId,
          identifier
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.isDuplicate;
      }
      
      return false; // If API call fails, allow the record
    } catch (error) {
      console.error('Error checking duplicate attendance:', error);
      return false; // If error occurs, allow the record
    }
  };

  const handleScanSuccess = async (decodedText) => {
    // Prevent multiple scans using ref
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;
    
    // Immediately set status to processing and clear any errors
    setScannerStatus('processing');
    setError(null);
    setIsScanning(true);
    
    // Clear error timeout if it exists
    if (errorDisplayTimeout) {
      clearTimeout(errorDisplayTimeout);
      setErrorDisplayTimeout(null);
    }
    
    try {
      // Immediately cleanup and stop scanner
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      setScanner(null);
      setShowScanModal(false);

      // Clean up the scanner element
      const element = document.getElementById('qr-reader');
      if (element) {
        element.innerHTML = '';
      }

      // Parse the QR data
      const qrData = JSON.parse(decodedText);
      setScannedQRData(qrData);

      // If QR data contains pinCode, verify directly
      if (qrData.pinCode) {
        const token = localStorage.getItem("Security");
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }

        if (!securityDetails?.societyId) {
          throw new Error('Security society details not found. Please log in again.');
        }

        // Verify society ID matches
        if (qrData.societyId !== securityDetails.societyId) {
          throw new Error('This QR code belongs to a different society');
        }

        const response = await fetch('/api/scan-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            qrData: JSON.stringify(qrData),
            securitySocietyId: securityDetails.societyId.toString()
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to process code');
        }

        setScanResult(data.data);
        setScannerStatus('success');
        setError(null);
        setScannedQRData(null);
        
        // Record attendance for successful scan
        await recordAttendance(data.data, token);
      } else {
        // If no pinCode in QR data, show PIN entry modal
        setShowPinModal(true);
        setScannerStatus('success');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScannerStatus('idle');
      setError(err.message || 'Invalid QR code format');
      
      if (err.message.toLowerCase().includes('authentication') || 
          err.message.includes('society details not found')) {
        setTimeout(() => {
          localStorage.removeItem("Security");
          router.push("/SecurityLogin");
        }, 2000);
      }
    } finally {
      // Reset processing flag and scanning state whether successful or not
      hasProcessedRef.current = false;
      setIsScanning(false);
    }
  };

  const recordAttendance = async (scanData, token) => {
    try {
      // Only record attendance for Service Personnel and Gate Pass (guest) types
      if (scanData.type !== 'service' && scanData.type !== 'guest') {
        console.log(`Skipping attendance record for type: ${scanData.type} - only service and guest types are recorded`);
        return; // Skip creating attendance record for vehicle and animal tags
      }

      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const guardInfo = {
        guardName: decodedToken.guardName,
        guardPhone: decodedToken.guardPhone,
      };

      // Check for duplicate attendance first
      const isDuplicate = await checkDuplicateAttendance(scanData);
      if (isDuplicate) {
        console.log('Duplicate attendance detected - skipping record creation');
        return; // Skip creating attendance record
      }

      // Map scan data type to correct visitorType enum
      const getVisitorType = (type) => {
        switch (type) {
          case 'vehicle': return 'VehicleTag';
          case 'animal': return 'AnimalTag';
          case 'guest': return 'GatePass';
          case 'service': return 'ServicePersonnel';
          default: return 'GateVisitor';
        }
      };

      // Get purpose based on type
      const getPurpose = (type) => {
        switch (type) {
          case 'vehicle': return 'Vehicle Entry';
          case 'animal': return 'Pet/Animal Entry';
          case 'guest': return 'Guest Visit';
          case 'service': return 'Service/Delivery';
          default: return 'Visit';
        }
      };

      // Get visitor information based on scan data type
      const getVisitorInfo = (scanData) => {
        switch (scanData.type) {
          case 'guest':
            return {
              name: scanData.guestDetails?.name || 'Guest Visitor',
              phone: scanData.guestDetails?.phone || 'N/A',
              image: scanData.guestImage || null
            };
          case 'service':
            return {
              name: scanData.personnelDetails?.name || 'Service Personnel',
              phone: scanData.personnelDetails?.phone || 'N/A',
              image: scanData.personnelImage || null
            };
          case 'vehicle':
            return {
              name: scanData.resident?.name || 'Unknown Visitor',
              phone: scanData.resident?.phone || 'N/A',
              image: scanData.vehicleImage || null
            };
          case 'animal':
            return {
              name: scanData.resident?.name || 'Unknown Visitor',
              phone: scanData.resident?.phone || 'N/A',
              image: scanData.animalImage || null
            };
          default:
            return {
              name: scanData.resident?.name || 'Unknown Visitor',
              phone: scanData.resident?.phone || 'N/A',
              image: null
            };
        }
      };

      const visitorInfo = getVisitorInfo(scanData);

      const visitorData = {
        visitorName: visitorInfo.name,
        visitorPhone: visitorInfo.phone,
        visitorImage: visitorInfo.image, // Add visitor image
        visitorType: getVisitorType(scanData.type),
        purpose: getPurpose(scanData.type),
        entryTime: new Date(),
        expectedExitTime: new Date(new Date().getTime() + 3600 * 1000),
        status: 'Inside',
        approvedBy: {
          securityId: decodedToken.id,
          ...guardInfo
        },
        residentDetails: {
          personId: scanData.resident?._id || null,
          personModel: 'Resident', // Set correct enum value
          name: scanData.resident?.name || 'Unknown Resident',
          phone: scanData.resident?.phone || 'N/A',
          flatNumber: scanData.resident?.flatDetails?.flatNumber?.toString() || 'N/A',
          blockNumber: scanData.resident?.flatDetails?.blockName || 'N/A',
          floorNumber: scanData.resident?.flatDetails?.floorIndex?.toString() || '0',
        }
      };

      const response = await fetch('/api/DailyAttendance-Api/create-attendance', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          societyId: securityDetails.societyId,
          visitorData
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update attendance record");
      }

      const data = await response.json();
      console.log('Attendance updated:', data);
    } catch (error) {
      console.error('Error recording attendance:', error);
    }
  };

  const handleScanError = (errorMessage) => {
    const ignoredErrors = [
      'No MultiFormat Readers were able to detect the code',
      'Found no MultiFormat Readers',
      'No QR code found'
    ];

    if (!ignoredErrors.some(msg => errorMessage.includes(msg))) {
      setError('Failed to scan QR code: ' + errorMessage);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    
    // Set processing status and close PIN modal
    setScannerStatus('processing');
    setShowPinModal(false);
    setError(null);
    
    try {
      const token = localStorage.getItem("Security");
      if (!token) {
        throw new Error('Authentication token missing. Please log in again.');
      }

      if (!securityDetails?.societyId) {
        throw new Error('Security society details not found. Please log in again.');
      }

      // Create request data based on whether we have scanned QR data or not
      let requestData;
      if (scannedQRData) {
        // If we have scanned QR data, verify society ID matches
        if (scannedQRData.societyId !== securityDetails.societyId) {
          throw new Error('This QR code belongs to a different society');
        }
        
        requestData = {
          qrData: JSON.stringify({
            ...scannedQRData,
            pinCode: pinCode,
            societyId: securityDetails.societyId
          }),
          securitySocietyId: securityDetails.societyId.toString()
        };
      } else {
        // If no scanned data, create appropriate data structure based on selected type
        let qrData = {
          pinCode: pinCode,
          societyId: securityDetails.societyId
        };

        switch (selectedType) {
          case 'vehicle':
            qrData.tagType = 'vehicle';
            break;
          case 'animal':
            qrData.tagType = 'animal';
            break;
          case 'guest':
            qrData.passType = 'guest';
            break;
          case 'service':
            qrData.passType = 'service';
            break;
        }

        requestData = {
          qrData: JSON.stringify(qrData),
          securitySocietyId: securityDetails.societyId.toString()
        };
      }

      const response = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process code');
      }

      setScanResult(data.data);
      setScannerStatus('success');
      setError(null);
      setPinCode('');
      setSelectedType('vehicle');
      setScannedQRData(null);
      
      // Record attendance for successful PIN verification
      await recordAttendance(data.data, token);
    } catch (err) {
      console.error('Verification error:', err);
      setScannerStatus('idle');
      setError(err.message || 'Failed to verify code');
      setShowPinModal(true); // Reopen PIN modal on error

      if (err.message.toLowerCase().includes('authentication') || 
          err.message.includes('society details not found')) {
        setTimeout(() => {
          localStorage.removeItem("Security");
          router.push("/SecurityLogin");
        }, 2000);
      }
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setCameraPermission(null);
    setShowScanModal(false);
    setShowPinModal(false);
    setPinCode('');
    setScannedQRData(null);
    setShowImageModal(false);
    setZoomedImageUrl(null);
    setScannerStatus('idle');
    hasProcessedRef.current = false;

    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
        const element = document.getElementById('qr-reader');
        if (element) {
          element.innerHTML = '';
        }
        scannerRef.current = null;
        setScanner(null);
      }).catch(console.error);
    }
  };

  const getStatusColor = (status, isExpired) => {
    if (isExpired) return 'bg-gray-100 text-gray-600';
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-600';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-600';
      case 'Rejected':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status, isExpired) => {
    if (isExpired) return Clock;
    switch (status) {
      case 'Approved':
        return CheckCircle;
      case 'Pending':
        return Clock;
      case 'Rejected':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const renderScanResult = () => {
    if (!scanResult) return null;

    const isExpired = scanResult.isExpired || new Date(scanResult.validUntil) <= new Date();
    const StatusIcon = getStatusIcon(scanResult.status, isExpired);
    const statusColor = getStatusColor(scanResult.status, isExpired);

    // Get the appropriate image based on type
    const getImageUrl = () => {
      switch (scanResult.type) {
        case 'vehicle':
          return scanResult.vehicleImage;
        case 'animal':
          return scanResult.animalImage;
        case 'guest':
          return scanResult.guestImage;
        case 'service':
          return scanResult.personnelImage;
        default:
          return null;
      }
    };

    const imageUrl = getImageUrl();

    const handleImageClick = () => {
      if (imageUrl) {
        setZoomedImageUrl(imageUrl);
        setShowImageModal(true);
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in-up">
        {/* Image Section */}
        {imageUrl && (
          <div className="mb-6">
            <div className="flex justify-center">
              <div 
                className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-all duration-200 hover:shadow-lg"
                onClick={handleImageClick}
              >
                <img 
                  src={imageUrl} 
                  alt={`${scanResult.type} image`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center" style={{display: 'none'}}>
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                {/* Zoom indicator */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 flex items-center justify-center transition-all duration-200">
                  <div className="opacity-0 hover:opacity-100 bg-white bg-opacity-80 rounded-full p-1 transition-opacity duration-200">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              {scanResult.type === 'vehicle' && (
                scanResult.vehicleType === 'Car' ? <Car className="w-6 h-6 text-blue-500" /> :
                scanResult.vehicleType === 'Motor Bike' ? <FaMotorcycle className="w-6 h-6 text-blue-500" /> :
                <Bike className="w-6 h-6 text-blue-500" />
              )}
              {scanResult.type === 'animal' && <AlertCircle className="w-6 h-6 text-blue-500" />}
              {scanResult.type === 'guest' && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
              {scanResult.type === 'service' && <Keyboard className="w-6 h-6 text-blue-500" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {scanResult.type === 'vehicle' && scanResult.vehicleDetails.registrationNumber}
                {scanResult.type === 'animal' && scanResult.animalDetails.name}
                {scanResult.type === 'guest' && scanResult.guestDetails.name}
                {scanResult.type === 'service' && scanResult.personnelDetails.name}
              </h2>
              <p className="text-gray-600">
                {scanResult.type === 'vehicle' && `${scanResult.vehicleDetails.brand} ${scanResult.vehicleDetails.model} • ${scanResult.vehicleDetails.color}`}
                {scanResult.type === 'animal' && `${scanResult.animalDetails.breed || 'No breed specified'}`}
                {scanResult.type === 'guest' && `Guest • ${scanResult.guestDetails.purpose}`}
                {scanResult.type === 'service' && `${scanResult.personnelDetails.serviceType} • ${scanResult.workingHours.startTime} - ${scanResult.workingHours.endTime}`}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
            <StatusIcon className="w-4 h-4 inline-block mr-1" />
            {isExpired ? 'Expired' : scanResult.status}
          </span>
        </div>

        <div className="space-y-4">
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Resident Details</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-gray-600 w-24">Name:</span>
                <span className="text-gray-900 font-medium">{scanResult.resident.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-24">Block:</span>
                <span className="text-gray-900 font-medium">
                  {scanResult.resident.flatDetails?.blockName || 'N/A'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-24">Floor:</span>
                <span className="text-gray-900 font-medium">
                  {scanResult.resident.flatDetails?.floorIndex !== undefined 
                    ? `${scanResult.resident.flatDetails.floorIndex}${getFloorSuffix(scanResult.resident.flatDetails.floorIndex)} Floor` 
                    : 'N/A'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-24">Flat No:</span>
                <span className="text-gray-900 font-medium">
                  {scanResult.resident.flatDetails?.flatNumber || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Details based on type */}
          {scanResult.type === 'animal' && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Animal Details</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-600 w-24">Gender:</span>
                  <span className="text-gray-900">{scanResult.animalDetails.gender}</span>
                </div>
                {scanResult.animalDetails.age && (
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24">Age:</span>
                    <span className="text-gray-900">{scanResult.animalDetails.age} years</span>
                  </div>
                )}
                {scanResult.animalDetails.vaccinated && (
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24">Vaccinated:</span>
                    <span className="text-green-600">Yes</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {(scanResult.type === 'guest' || scanResult.type === 'service') && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Details</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-600 w-24">Phone:</span>
                  <span className="text-gray-900">
                    {scanResult.type === 'guest' ? scanResult.guestDetails.phone : scanResult.personnelDetails.phone}
                  </span>
                </div>
              </div>
            </div>
          )}

          {scanResult.validUntil && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500">Validity</h3>
              <p className="text-gray-900">
                Valid until {new Date(scanResult.validUntil).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        <button 
          onClick={resetScanner}
          className="mt-6 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Scan Another Code
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">QR Scanner</h1>
        </div>
        <p className="text-gray-600">Scan vehicle tags and guest passes</p>
      </div>

      {/* Main Content */}
      {scannerStatus === 'processing' ? (
        /* Processing Loader */
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing QR Code</h3>
            <p className="text-gray-600 text-center">Verifying data and fetching details...</p>
          </div>
        </div>
      ) : scanResult ? (
        /* Scan Result */
        renderScanResult()
      ) : (
        /* Initial State - Scan Options */
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={requestCameraPermission}
              className="bg-blue-500 text-white px-6 py-4 rounded-lg hover:bg-blue-600 transition-colors flex flex-col items-center justify-center"
            >
              <Camera className="w-8 h-8 mb-2" />
              Scan QR Code
            </button>
            <button
              onClick={() => setShowPinModal(true)}
              className="bg-green-500 text-white px-6 py-4 rounded-lg hover:bg-green-600 transition-colors flex flex-col items-center justify-center"
            >
              <Keyboard className="w-8 h-8 mb-2" />
              Enter PIN
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Scan QR Code</h2>
              <button
                onClick={() => {
                  setShowScanModal(false);
                  if (scanner) {
                    scanner.stop().catch(console.error);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div id="qr-reader" className="w-full overflow-hidden rounded-lg"></div>
            
            {isScanning ? (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-600">Processing QR code...</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mt-4 text-center">
                Position the QR code within the frame to scan
              </p>
            )}
          </div>
        </div>
      )}

      {/* PIN Entry Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Enter Details</h2>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinCode('');
                  setSelectedType('vehicle');
                  setScannedQRData(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setSelectedType('vehicle')}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      selectedType === 'vehicle'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <Car className={selectedType === 'vehicle' ? 'text-blue-500' : 'text-gray-400'} />
                    <span className={selectedType === 'vehicle' ? 'text-blue-500' : 'text-gray-500'}>Vehicle Tag</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType('animal')}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      selectedType === 'animal'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <AlertCircle className={selectedType === 'animal' ? 'text-blue-500' : 'text-gray-400'} />
                    <span className={selectedType === 'animal' ? 'text-blue-500' : 'text-gray-500'}>Animal Tag</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedType('guest')}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      selectedType === 'guest'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <CheckCircle2 className={selectedType === 'guest' ? 'text-blue-500' : 'text-gray-400'} />
                    <span className={selectedType === 'guest' ? 'text-blue-500' : 'text-gray-500'}>Guest Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType('service')}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      selectedType === 'service'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <Keyboard className={selectedType === 'service' ? 'text-blue-500' : 'text-gray-400'} />
                    <span className={selectedType === 'service' ? 'text-blue-500' : 'text-gray-500'}>Service Pass</span>
                  </button>
                </div>
              </div>

              {/* PIN Code Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Enter 6-digit PIN code"
                  maxLength={6}
                  pattern="\d{6}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg text-white font-medium bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-all"
              >
                Verify
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {showImageModal && zoomedImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl max-h-screen p-4" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>
            
            {/* Zoomed image */}
            <div className="relative bg-white rounded-lg p-2 shadow-2xl">
              <img 
                src={zoomedImageUrl}
                alt="Zoomed view"
                className="max-w-full max-h-[80vh] object-contain rounded"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-64 bg-gray-100 flex items-center justify-center rounded">
                <div className="text-center text-gray-500">
                  <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                  <p>Image could not be loaded</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <p className="text-white text-center mt-4 text-sm opacity-75">
              Click outside the image or press the X button to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
