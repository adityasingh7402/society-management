import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle, XCircle, AlertTriangle, User, Car, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Dynamically import QrScanner with no SSR
const QrScannerComponent = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner), {
  ssr: false
});

const QRScanner = () => {
  const [scanning, setScanning] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (data) => {
    if (data && !loading) {
      setLoading(true);
      setScanning(false);

      try {
        const response = await fetch('/api/scan-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ qrData: data }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to validate QR code');
        }

        setScanResult(result.data);
        
        // Play success/error sound based on status
        const audio = new Audio(result.data.isExpired ? '/error.mp3' : '/success.mp3');
        audio.play();

      } catch (error) {
        toast.error(error.message);
        setScanResult(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleError = (error) => {
    console.error(error);
    toast.error('Failed to access camera');
  };

  const resetScanner = () => {
    setScanResult(null);
    setScanning(true);
  };

  const renderScanResult = () => {
    if (!scanResult) return null;

    const isValid = !scanResult.isExpired && ['Approved', 'Used'].includes(scanResult.status);
    const statusColor = isValid ? 'text-green-500' : 'text-red-500';
    const bgColor = isValid ? 'bg-green-50' : 'bg-red-50';
    const StatusIcon = isValid ? CheckCircle : scanResult.isExpired ? AlertTriangle : XCircle;

    return (
      <div className={`p-6 rounded-xl ${bgColor} space-y-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-8 h-8 ${statusColor}`} />
            <div>
              <h3 className={`font-semibold ${statusColor}`}>
                {isValid ? 'Access Granted' : 'Access Denied'}
              </h3>
              <p className="text-sm text-gray-600">
                {scanResult.isExpired ? 'Pass Expired' : `Status: ${scanResult.status}`}
              </p>
            </div>
          </div>
          <button
            onClick={resetScanner}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            Scan Again
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {scanResult.type === 'guest' ? (
            <>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Guest Name</p>
                  <p className="text-sm text-gray-600">{scanResult.guestDetails.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Guest Phone</p>
                  <p className="text-sm text-gray-600">{scanResult.guestDetails.phone}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Vehicle Type</p>
                  <p className="text-sm text-gray-600">{scanResult.vehicleDetails.vehicleType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Registration</p>
                  <p className="text-sm text-gray-600">{scanResult.vehicleDetails.registrationNumber}</p>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Resident</p>
              <p className="text-sm text-gray-600">{scanResult.resident.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Valid Until</p>
              <p className="text-sm text-gray-600">
                {new Date(scanResult.validUntil).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {scanning ? (
          <div className="aspect-square relative">
            <QrScannerComponent
              onDecode={handleScan}
              onError={handleError}
              containerStyle={{ borderRadius: '0.75rem' }}
              constraints={{
                facingMode: 'environment',
                audio: false,
                video: { facingMode: "environment" }
              }}
            />
            <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none">
              <div className="absolute inset-0 border-4 border-blue-500 rounded-xl opacity-50 animate-pulse"></div>
            </div>
          </div>
        ) : (
          renderScanResult()
        )}
      </div>

      {scanning && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Position the QR code within the frame to scan
          </p>
        </div>
      )}
    </div>
  );
};

export default QRScanner; 