import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/router';
import { X, Camera, Keyboard, AlertCircle, CheckCircle2 } from 'lucide-react';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [securityDetails, setSecurityDetails] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [manualCode, setManualCode] = useState({
    type: 'vehicle',
    id: '',
    societyId: ''
  });
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
        setManualCode(prev => ({ ...prev, societyId: data.societyId }));
      } catch (err) {
        console.error('Error fetching security details:', err);
        setError(err.message);
      }
    };

    fetchSecurityDetails();
  }, []);

  // Initialize scanner after camera permission is granted
  useEffect(() => {
    if (!securityDetails || !showScanModal || cameraPermission !== true) return;

    const initializeScanner = async () => {
      try {
        if (scanner) {
          scanner.clear();
        }

        const html5QrCode = new Html5Qrcode("qr-reader");
        
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
      if (scanner) {
        scanner.stop().catch(console.error);
      }
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

  const handleScanSuccess = async (decodedText) => {
    try {
      if (scanner) {
        scanner.pause();
      }

      const token = localStorage.getItem("Security");
      if (!token) {
        throw new Error('Authentication token missing. Please log in again.');
      }

      const response = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          qrData: decodedText,
          securitySocietyId: securityDetails.societyId.toString()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process QR code');
      }

      setScanResult(data.data);
      setError(null);
      setShowScanModal(false);
      
      if (scanner) {
        scanner.stop().catch(console.error);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to process QR code');
      
      if (err.message.toLowerCase().includes('authentication')) {
        setTimeout(() => {
          localStorage.removeItem("Security");
          router.push("/SecurityLogin");
        }, 2000);
      }
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

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("Security");
      if (!token) {
        throw new Error('Authentication token missing. Please log in again.');
      }

      const qrData = JSON.stringify({
        tagType: manualCode.type,
        [manualCode.type === 'vehicle' ? 'tagId' : 'passId']: manualCode.id,
        societyId: manualCode.societyId
      });

      const response = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          qrData,
          securitySocietyId: securityDetails.societyId.toString()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process code');
      }

      setScanResult(data.data);
      setError(null);
      setShowManualModal(false);
    } catch (err) {
      console.error('Manual entry error:', err);
      setError(err.message || 'Failed to process code');

      if (err.message.toLowerCase().includes('authentication')) {
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
    setShowManualModal(false);
    setManualCode({
      type: 'vehicle',
      id: '',
      societyId: securityDetails?.societyId || ''
    });

    if (scanner) {
      scanner.stop().catch(console.error);
      setScanner(null);
    }
  };

  const renderScanResult = () => {
    if (!scanResult) return null;

    const isVehicle = scanResult.type === 'vehicle';
    const statusColor = scanResult.status === 'Approved' 
      ? 'text-green-500' 
      : scanResult.status === 'Pending' 
        ? 'text-yellow-500' 
        : 'text-red-500';

    return (
      <div className="bg-white rounded-lg shadow-xl p-6 mt-4 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {isVehicle ? 'Vehicle Tag Details' : 'Guest Pass Details'}
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor} bg-opacity-10`}>
            {scanResult.status}
          </span>
        </div>

        <div className="space-y-4">
          {isVehicle ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Vehicle Type</h3>
                  <p className="text-gray-900">{scanResult.vehicleType}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Registration</h3>
                  <p className="text-gray-900">{scanResult.vehicleDetails.registrationNumber}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Vehicle Details</h3>
                <p className="text-gray-900">
                  {scanResult.vehicleDetails.brand} {scanResult.vehicleDetails.model} - {scanResult.vehicleDetails.color}
                </p>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Guest Name</h3>
                <p className="text-gray-900">{scanResult.guestDetails.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                <p className="text-gray-900">{scanResult.guestDetails.phone}</p>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500">Resident Details</h3>
            <p className="text-gray-900">{scanResult.resident.name} - Flat {scanResult.resident.flat}</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500">Validity</h3>
            <p className="text-gray-900">
              Valid until {new Date(scanResult.validUntil).toLocaleDateString()}
            </p>
          </div>
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
    <div className="max-w-2xl mx-auto p-4">
      {/* Main Content */}
      {!scanResult && (
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
              onClick={() => setShowManualModal(true)}
              className="bg-green-500 text-white px-6 py-4 rounded-lg hover:bg-green-600 transition-colors flex flex-col items-center justify-center"
            >
              <Keyboard className="w-8 h-8 mb-2" />
              Enter Code
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

      {/* Scan Result */}
      {scanResult && renderScanResult()}

      {/* QR Scanner Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
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
            
            <p className="text-sm text-gray-600 mt-4 text-center">
              Position the QR code within the frame to scan
            </p>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Enter Code Manually</h2>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={manualCode.type}
                  onChange={(e) => setManualCode({ ...manualCode, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="vehicle">Vehicle Tag</option>
                  <option value="guest">Guest Pass</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {manualCode.type === 'vehicle' ? 'Tag ID' : 'Pass ID'}
                </label>
                <input
                  type="text"
                  value={manualCode.id}
                  onChange={(e) => setManualCode({ ...manualCode, id: e.target.value })}
                  placeholder={`Enter ${manualCode.type === 'vehicle' ? 'tag' : 'pass'} ID`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Verify Code
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner; 