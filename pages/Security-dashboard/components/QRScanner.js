import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/router';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [securityDetails, setSecurityDetails] = useState(null);
  const [mode, setMode] = useState('select'); // 'select', 'scan', or 'manual'
  const [manualCode, setManualCode] = useState({
    type: 'vehicle', // or 'guest'
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

        if (!data || !data._id || !data.societyId || !data.guardName) {
          console.error("Invalid security data:", data);
          throw new Error("Invalid security details");
        }

        setSecurityDetails(data);
        setManualCode(prev => ({ ...prev, societyId: data.societyId }));
      } catch (err) {
        console.error('Error fetching security details:', err);
        setError(err.message);
      }
    };

    fetchSecurityDetails();
  }, []);

  // Second effect for initializing scanner after security details are loaded
  useEffect(() => {
    if (!securityDetails || mode !== 'scan') return;

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
  }, [securityDetails, mode]);

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
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to process QR code');
      setScanResult(null);
      
      if (err.message.toLowerCase().includes('authentication')) {
        setTimeout(() => {
          localStorage.removeItem("Security");
          router.push("/SecurityLogin");
        }, 2000);
      } else {
        if (scanner) {
          scanner.resume();
        }
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
      if (!securityDetails || !securityDetails.societyId) {
        throw new Error('Security authentication required. Please log in again.');
      }

      const token = localStorage.getItem("Security");
      if (!token) {
        throw new Error('Authentication token missing. Please log in again.');
      }

      // Create QR data format similar to scanned QR
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
    } catch (err) {
      console.error('Manual entry error:', err);
      setError(err.message || 'Failed to process code');
      setScanResult(null);

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
    setMode('select');
    setManualCode({
      type: 'vehicle',
      id: '',
      societyId: securityDetails?.societyId || ''
    });

    if (scanner) {
      scanner.clear();
    }
  };

  const renderModeSelection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setMode('scan')}
          className="bg-blue-500 text-white px-6 py-4 rounded-lg hover:bg-blue-600 transition-colors flex flex-col items-center justify-center"
        >
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Scan QR Code
        </button>
        <button
          onClick={() => setMode('manual')}
          className="bg-green-500 text-white px-6 py-4 rounded-lg hover:bg-green-600 transition-colors flex flex-col items-center justify-center"
        >
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Enter Code
        </button>
      </div>
    </div>
  );

  const renderManualEntry = () => (
    <form onSubmit={handleManualSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select
          value={manualCode.type}
          onChange={(e) => setManualCode({ ...manualCode, type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div className="flex space-x-3">
        <button
          type="submit"
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Submit
        </button>
        <button
          type="button"
          onClick={() => setMode('select')}
          className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          Back
        </button>
      </div>
    </form>
  );

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

          <button 
            onClick={resetScanner}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Back to Scanner
          </button>
        </div>
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

      {!scanResult && mode === 'select' && renderModeSelection()}
      
      {!scanResult && mode === 'scan' && (
        <>
          <div id="qr-reader" className="w-full max-w-lg mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Position the QR code within the frame to scan. Make sure the code is well-lit and clearly visible.
          </p>
          <button
            onClick={() => setMode('select')}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors w-full"
          >
            Back
          </button>
        </>
      )}

      {!scanResult && mode === 'manual' && renderManualEntry()}
      
      {scanResult && renderScanResult()}
    </div>
  );
};

export default QRScanner; 