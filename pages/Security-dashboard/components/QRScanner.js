import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle, XCircle, AlertTriangle, User, Car, Calendar, Camera, Scan } from 'lucide-react';
import { toast } from 'react-hot-toast';
import jsQR from 'jsqr';

// Dynamically import QrScanner with no SSR
const QrScannerComponent = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner), {
  ssr: false
});

const QRScanner = () => {
  const [scanning, setScanning] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('live'); // 'live' or 'picture'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleScan = async (result) => {
    if (result && !loading) {
      setLoading(true);
      console.log('Scanned data:', result);

      try {
        const response = await fetch('/api/scan-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ qrData: result }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to validate QR code');
        }

        const data = await response.json();
        console.log('API response:', data);

        if (data.data) {
          setScanning(false);
          setScanResult(data.data);
          
          const audio = new Audio(data.data.isExpired ? '/error.mp3' : '/success.mp3');
          audio.play().catch(console.error);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Scanning error:', error);
        toast.error(error.message || 'Failed to scan QR code');
        setScanResult(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleError = (error) => {
    console.error('Camera error:', error);
    toast.error('Failed to access camera. Please check camera permissions.');
  };

  const resetScanner = () => {
    setScanResult(null);
    setScanning(true);
    setLoading(false);
  };

  const takePicture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setLoading(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for QR code scanning
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        await handleScan(code.data);
      } else {
        toast.error('No QR code found in image');
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      toast.error('Failed to capture and scan image');
    } finally {
      setLoading(false);
    }
  };

  const renderScanButtons = () => (
    <div className="flex gap-4 justify-center mb-4">
      <button
        onClick={() => setMode('live')}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
          mode === 'live' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
        }`}
      >
        <Scan className="w-5 h-5" />
        Live Scan
      </button>
      <button
        onClick={() => setMode('picture')}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
          mode === 'picture' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
        }`}
      >
        <Camera className="w-5 h-5" />
        Take Picture
      </button>
    </div>
  );

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
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Vehicle Type</p>
              <p className="text-sm text-gray-600">{scanResult.vehicleType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Registration</p>
              <p className="text-sm text-gray-600">{scanResult.vehicleDetails.registrationNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Vehicle Details</p>
              <p className="text-sm text-gray-600">
                {scanResult.vehicleDetails.brand} {scanResult.vehicleDetails.model} ({scanResult.vehicleDetails.color})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Resident</p>
              <p className="text-sm text-gray-600">{scanResult.resident.name}</p>
              <p className="text-xs text-gray-500">Flat: {scanResult.resident.flat}</p>
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
      {scanning && renderScanButtons()}
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {scanning ? (
          <div className="aspect-square relative">
            {mode === 'live' ? (
              <QrScannerComponent
                onDecode={handleScan}
                onError={handleError}
                containerStyle={{ borderRadius: '0.75rem' }}
                constraints={{
                  facingMode: 'environment',
                  audio: false,
                  video: { 
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                  }
                }}
                scanDelay={500}
                captureSize={{ width: 1280, height: 720 }}
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover rounded-xl"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                <button
                  onClick={takePicture}
                  disabled={loading}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-blue-600 text-white rounded-full flex items-center gap-2 disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  {loading ? 'Processing...' : 'Take Picture'}
                </button>
              </>
            )}
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
            {loading ? 'Processing...' : mode === 'live' 
              ? 'Position the QR code within the frame to scan'
              : 'Click the button to take a picture of the QR code'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default QRScanner; 