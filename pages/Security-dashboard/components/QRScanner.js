import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/router';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [securityDetails, setSecurityDetails] = useState(null);
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

        // Check if we have the required security data
        if (!data || !data._id || !data.societyId || !data.guardName) {
          console.error("Invalid security data:", data);
          throw new Error("Invalid security details");
        }

        setSecurityDetails(data);
      } catch (err) {
        console.error('Error fetching security details:', err);
        setError(err.message);
      }
    };

    fetchSecurityDetails();
  }, []); // Empty dependency array means this effect runs once on mount

  // Second effect for initializing scanner after security details are loaded
  useEffect(() => {
    if (!securityDetails) return; // Don't initialize scanner until we have security details

    const initializeScanner = () => {
      try {
        // Clear existing scanner if it exists
        if (scanner) {
          scanner.clear();
        }

        const qrScanner = new Html5QrcodeScanner('qr-reader', {
          qrbox: {
            width: 250,
            height: 250,
          },
          fps: 10,
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2
        });

        setScanner(qrScanner);
        qrScanner.render(handleScanSuccess, handleScanError);
      } catch (err) {
        console.error('Error initializing scanner:', err);
        setError('Failed to initialize QR scanner. Please refresh the page.');
      }
    };

    // Small delay to ensure DOM element is ready
    const timeoutId = setTimeout(initializeScanner, 100);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (scanner) {
        scanner.clear();
      }
    };
  }, [securityDetails]); // Depend on securityDetails

  const handleScanSuccess = async (decodedText) => {
    try {
      // Stop scanning after successful scan
      if (scanner) {
        scanner.pause();
      }

      if (!securityDetails || !securityDetails.societyId) {
        throw new Error('Security authentication required. Please log in again.');
      }

      const token = localStorage.getItem("Security");
      if (!token) {
        throw new Error('Authentication token missing. Please log in again.');
      }

      // Call the scan-qr API with security details
      const response = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          qrData: decodedText,
          securitySocietyId: securityDetails.societyId.toString() // Convert ObjectId to string
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process QR code');
      }

      setScanResult(data.data);
      setError(null);
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to process QR code');
      setScanResult(null);
      
      // If it's an authentication error, redirect to login
      if (err.message.toLowerCase().includes('authentication')) {
        setTimeout(() => {
          localStorage.removeItem("Security");
          router.push("/SecurityLogin");
        }, 2000);
      } else {
        // Resume scanning after error if it's not an authentication error
        if (scanner) {
          scanner.resume();
        }
      }
    }
  };

  const handleScanError = (errorMessage) => {
    // Ignore common scanning status messages
    const ignoredErrors = [
      'No MultiFormat Readers were able to detect the code',
      'Found no MultiFormat Readers',
      'No QR code found'
    ];

    // Only set error for actual errors, not status messages
    if (!ignoredErrors.some(msg => errorMessage.includes(msg))) {
      setError('Failed to scan QR code: ' + errorMessage);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);

    // Re-initialize scanner
    if (scanner) {
      scanner.clear();
    }

    const qrScanner = new Html5QrcodeScanner('qr-reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 10,
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      defaultZoomValueIfSupported: 2
    });

    setScanner(qrScanner);
    qrScanner.render(handleScanSuccess, handleScanError);
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
      <div className="bg-white rounded-lg shadow-md p-6 mt-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {isVehicle ? 'Vehicle Tag Details' : 'Guest Pass Details'}
        </h2>

        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-gray-700">Status</h3>
            <p className={statusColor}>{scanResult.status}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Valid Until</h3>
            <p>{new Date(scanResult.validUntil).toLocaleDateString()}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Resident Details</h3>
            <p>Name: {scanResult.resident.name}</p>
            <p>Flat: {scanResult.resident.flat}</p>
          </div>

          {isVehicle ? (
            <div>
              <h3 className="font-medium text-gray-700">Vehicle Details</h3>
              <p>Type: {scanResult.vehicleType}</p>
              <p>Brand: {scanResult.vehicleDetails.brand}</p>
              <p>Model: {scanResult.vehicleDetails.model}</p>
              <p>Color: {scanResult.vehicleDetails.color}</p>
              <p>Registration: {scanResult.vehicleDetails.registrationNumber}</p>
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-gray-700">Guest Details</h3>
              <p>Name: {scanResult.guestDetails.name}</p>
              <p>Phone: {scanResult.guestDetails.phone}</p>
            </div>
          )}
        </div>

        <button 
          onClick={resetScanner}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Scan Another
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        QR Code Scanner
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!scanResult && (
        <>
          <div id="qr-reader" className="w-full max-w-lg mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Position the QR code within the frame to scan. Make sure the code is well-lit and clearly visible.
          </p>
        </>
      )}
      {renderScanResult()}
    </div>
  );
};

export default QRScanner; 