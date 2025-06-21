import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { 
  Calendar, Filter, Search, Plus, RefreshCw, 
  Trash2, AlertTriangle, ArrowLeft, Clock, X, 
  ChevronDown, ChevronUp, Share2, Download,
  Car, Bike
} from 'lucide-react';
import { FaMotorcycle } from "react-icons/fa";
import Head from 'next/head';
import QRCodeStyling from 'qr-code-styling';

// Define CSS animations
const animationStyles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slideDown 0.2s ease-out;
}
`;

const GuestPassRequest = () => {
  const router = useRouter();
  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [residentData, setResidentData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedPass, setExpandedPass] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    hasVehicle: '',
    startDate: '',
    endDate: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [formattedPasses, setFormattedPasses] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passToDelete, setPassToDelete] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPassForShare, setSelectedPassForShare] = useState(null);

  // Add this helper function to calculate end date
  const calculateEndDate = (startDate, days) => {
    if (!startDate || !days) return '';
    const date = new Date(startDate);
    date.setDate(date.getDate() + parseInt(days));
    return date.toISOString().split('T')[0];
  };

  // Update form state
  const [formData, setFormData] = useState({
    guestDetails: {
      name: '',
      phone: '',
      purpose: ''
    },
    duration: {
      startDate: new Date().toISOString().split('T')[0], // Set default to today
      endDate: calculateEndDate(new Date().toISOString().split('T')[0], 1), // Calculate based on default values
      days: 1
    },
    hasVehicle: false,
    vehicleDetails: {
      vehicleType: '',
      registrationNumber: ''
    }
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchResidentData();
  }, []);

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
      
      // Fetch gate passes after resident data is loaded
      fetchGatePasses(data._id);
    } catch (error) {
      console.error('Error fetching resident details:', error);
    }
  };

  const fetchGatePasses = async (residentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Resident');
      const response = await axios.get('/api/GatePass-Api/get-passes', {
        params: { residentId },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setGatePasses(response.data);
      setFormattedPasses(response.data);
    } catch (error) {
      console.error('Error fetching gate passes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (residentData?._id) {
      fetchGatePasses(residentData._id);
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    if (!showForm) {
      setFormData({
        guestDetails: {
          name: '',
          phone: '',
          purpose: ''
        },
        duration: {
          startDate: new Date().toISOString().split('T')[0], // Set default to today
          endDate: calculateEndDate(new Date().toISOString().split('T')[0], 1), // Calculate based on default values
          days: 1
        },
        hasVehicle: false,
        vehicleDetails: {
          vehicleType: '',
          registrationNumber: ''
        }
      });
    }
  };

  // Add handler for duration changes
  const handleDurationChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newDuration = { ...prev.duration };

      if (name === 'startDate') {
        newDuration.startDate = value;
        newDuration.endDate = calculateEndDate(value, newDuration.days);
      } else if (name === 'days') {
        const days = Math.min(Math.max(parseInt(value) || 1, 1), 10); // Ensure between 1 and 10
        newDuration.days = days;
        newDuration.endDate = calculateEndDate(newDuration.startDate, days);
      }

      return {
        ...prev,
        duration: newDuration
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const token = localStorage.getItem('Resident');

      // First create the gate pass
      const response = await axios.post('/api/GatePass-Api/create-pass', 
        {
          residentId: residentData._id,
          societyId: residentData.societyId,
          societyName: residentData.societyName,
          flatDetails: residentData.flatDetails,
          guestDetails: formData.guestDetails,
          duration: formData.duration,
          hasVehicle: formData.hasVehicle,
          vehicleDetails: formData.vehicleDetails
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      const { pinCode, data: gatePass } = response.data;

      // Generate QR code data
      const qrData = {
        passId: gatePass._id,
        passType: 'guest',
        societyId: residentData.societyId,
        guestName: formData.guestDetails.name,
        pinCode,
        validUntil: formData.duration.endDate
      };

      // Store as simple JSON string
      const encodedData = JSON.stringify(qrData);

      // Create QR code with styling
      const qrCode = new QRCodeStyling({
        width: 800,
        height: 800,
        type: "canvas",
        data: encodedData,
        image: "/logo_web.png",
        dotsOptions: {
          color: "#1A75FF",
          type: "dots"
        },
        backgroundOptions: {
          color: "#ffffff"
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 15,
          imageSize: 0.3
        },
        qrOptions: {
          errorCorrectionLevel: 'M',
          quality: 0.95,
          margin: 5
        },
        cornersSquareOptions: {
          color: "#1A75FF",
          type: "square"
        },
        cornersDotOptions: {
          color: "#1A75FF",
          type: "square"
        }
      });

      // Create a temporary div to hold the QR code
      const tempDiv = document.createElement('div');
      
      // Create QR code canvas
      await qrCode.append(tempDiv);
      
      // Wait a bit for the QR code to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = tempDiv.querySelector('canvas');
      if (!canvas) {
        throw new Error('Failed to generate QR code');
      }
      
      const qrCodeDataUrl = canvas.toDataURL('image/png');

      // Create shareable image with society details
      const shareableCanvas = document.createElement('canvas');
      shareableCanvas.width = 1200;
      shareableCanvas.height = 1600;
      const ctx = shareableCanvas.getContext('2d');

      // Set background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1200, 1600);

      // Add QR code
      const qrImage = new Image();
      qrImage.src = qrCodeDataUrl;
      await new Promise((resolve) => {
        qrImage.onload = resolve;
      });
      ctx.drawImage(qrImage, 200, 200, 800, 800);

      // Add text details
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(residentData.societyName, 600, 1100);

      ctx.font = '36px Arial';
      ctx.fillText(`Flat ${residentData.flatDetails.flatNumber}`, 600, 1160);
      ctx.fillText(`Guest: ${formData.guestDetails.name}`, 600, 1220);
      ctx.fillText(`Valid until: ${new Date(formData.duration.endDate).toLocaleDateString()}`, 600, 1280);

      if (formData.hasVehicle) {
        ctx.fillText(`Vehicle: ${formData.vehicleDetails.vehicleType} - ${formData.vehicleDetails.registrationNumber}`, 600, 1340);
      }

      const shareableImageDataUrl = shareableCanvas.toDataURL('image/png');

      // Update the gate pass with QR code and shareable image
      await axios.patch(`/api/GatePass-Api/update-pass/${gatePass._id}`, 
        {
          qrCode: qrCodeDataUrl,
          shareableImage: shareableImageDataUrl
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      // Add new pass to state with QR code and shareable image
      const updatedPass = {
        ...gatePass,
        qrCode: qrCodeDataUrl,
        shareableImage: shareableImageDataUrl
      };
      setGatePasses(prev => [updatedPass, ...prev]);
      setFormattedPasses(prev => [updatedPass, ...prev]);
      
      // Reset form and close it
      setFormData({
        guestDetails: {
          name: '',
          phone: '',
          purpose: ''
        },
        duration: {
          startDate: new Date().toISOString().split('T')[0], // Set default to today
          endDate: calculateEndDate(new Date().toISOString().split('T')[0], 1), // Calculate based on default values
          days: 1
        },
        hasVehicle: false,
        vehicleDetails: {
          vehicleType: '',
          registrationNumber: ''
        }
      });
      setShowForm(false);

      // Show the share modal for the new pass
      setSelectedPassForShare(updatedPass);
      setShowShareModal(true);

    } catch (error) {
      console.error('Error creating gate pass:', error);
      alert(error.response?.data?.message || 'Failed to create gate pass');
    } finally {
      setFormLoading(false);
    }
  };

  const handleShare = async (pass) => {
    try {
      // Create a blob from the shareable image
      const response = await fetch(pass.shareableImage);
      const blob = await response.blob();
      
      // Check if the Web Share API is available
      if (navigator.share) {
        const file = new File([blob], 'gate-pass.png', { type: 'image/png' });
        await navigator.share({
          title: 'Gate Pass',
          text: `Gate pass for ${pass.guestDetails.name}`,
          files: [file]
        });
      } else {
        // Fallback to downloading the image
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gate-pass.png';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error sharing gate pass:', error);
      alert('Failed to share gate pass');
    }
  };

  const handleDownload = async (pass) => {
    try {
      const response = await fetch(pass.shareableImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gate-pass.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading gate pass:', error);
      alert('Failed to download gate pass');
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      
      // First try parsing as is
      let date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        // If invalid, try parsing as ISO string
        date = new Date(dateString + 'T00:00:00.000Z');
        
        // If still invalid, return N/A
        if (isNaN(date.getTime())) {
          return 'N/A';
        }
      }
      
      return new Intl.DateTimeFormat('en-IN', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const togglePassExpansion = (passId) => {
    setExpandedPass(expandedPass === passId ? null : passId);
  };

  const handleDeletePass = async (passId) => {
    try {
      const token = localStorage.getItem('Resident');
      await axios.delete(`/api/GatePass-Api/delete-pass/${passId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      // Remove pass from state
      setGatePasses(prev => prev.filter(pass => pass._id !== passId));
      setFormattedPasses(prev => prev.filter(pass => pass._id !== passId));
      setShowDeleteModal(false);
      setPassToDelete(null);

    } catch (error) {
      console.error('Error deleting gate pass:', error);
      alert(error.response?.data?.message || 'Failed to delete gate pass');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Head>
        <style>{animationStyles}</style>
      </Head>

      {/* Header */}
      <div className="p-4 md:p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-base">Back</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-3 py-2">
        <h1 className="text-2xl md:text-3xl text-center font-bold text-blue-600 mb-6">Guest Passes</h1>
        <div className="flex justify-end mb-2">
          <button
            onClick={toggleForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Cancel' : 'New Pass'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-lg p-6 animate-fade-in-up">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Guest Pass</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Guest Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                <input
                  type="text"
                  value={formData.guestDetails.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    guestDetails: { ...prev.guestDetails, name: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.guestDetails.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    guestDetails: { ...prev.guestDetails, phone: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  value={formData.guestDetails.purpose}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    guestDetails: { ...prev.guestDetails, purpose: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Duration Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Duration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.duration.startDate}
                    onChange={handleDurationChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Days (1-10)</label>
                  <input
                    type="number"
                    name="days"
                    value={formData.duration.days}
                    onChange={handleDurationChange}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.duration.endDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
                <p className="mt-1 text-sm text-gray-500">
                  End date is automatically calculated based on start date and duration
                </p>
              </div>
            </div>

            {/* Vehicle Details */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasVehicle}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    hasVehicle: e.target.checked,
                    vehicleDetails: e.target.checked ? prev.vehicleDetails : { vehicleType: '', registrationNumber: '' }
                  }))}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Guest has a vehicle</span>
              </label>

              {formData.hasVehicle && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {['Car', 'Motor Bike', 'Bike'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          vehicleDetails: { ...prev.vehicleDetails, vehicleType: type }
                        }))}
                        className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                          formData.vehicleDetails.vehicleType === type
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200'
                        }`}
                      >
                        {type === 'Car' && <Car className={formData.vehicleDetails.vehicleType === type ? 'text-blue-500' : 'text-gray-400'} />}
                        {type === 'Motor Bike' && <FaMotorcycle className={formData.vehicleDetails.vehicleType === type ? 'text-blue-500' : 'text-gray-400'} />}
                        {type === 'Bike' && <Bike className={formData.vehicleDetails.vehicleType === type ? 'text-blue-500' : 'text-gray-400'} />}
                        <span className={formData.vehicleDetails.vehicleType === type ? 'text-blue-500' : 'text-gray-500'}>{type}</span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                    <input
                      type="text"
                      value={formData.vehicleDetails.registrationNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        vehicleDetails: { ...prev.vehicleDetails, registrationNumber: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={formData.hasVehicle}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formLoading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${
                formLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
              }`}
            >
              {formLoading ? 'Creating Pass...' : 'Create Pass'}
            </button>
          </form>
        </div>
      )}

      {/* Gate Passes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : formattedPasses.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl shadow-lg">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No gate passes found</p>
            <button
              onClick={toggleForm}
              className="mt-4 px-4 py-2 text-blue-500 hover:text-blue-600"
            >
              Create a new pass
            </button>
          </div>
        ) : (
          formattedPasses.map((pass) => {
            const isExpired = new Date(pass.duration.endDate) <= new Date();
            const isExpanded = expandedPass === pass._id;

            return (
              <div
                key={pass._id}
                onClick={() => togglePassExpansion(pass._id)}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow animate-fade-in-up cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{pass.guestDetails.name}</h3>
                    <p className="text-sm text-gray-600">{pass.guestDetails.purpose}</p>
                    <p className="text-xs text-gray-500">
                      Valid until: {formatDate(pass.duration.endDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isExpired ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {isExpired ? 'Expired' : 'Active'}
                    </div>
                    <div className="text-gray-500">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 animate-slide-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* QR Code Section */}
                      <div className="flex flex-col items-center justify-center px-6 py-4 bg-gray-50 rounded-lg">
                        {pass.qrCode ? (
                          <div className="flex flex-col items-center">
                            <img 
                              src={pass.qrCode} 
                              alt="Gate Pass QR Code"
                              className="mb-4 w-auto h-auto"
                              style={{ maxWidth: '100%', objectFit: 'contain' }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(pass);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                              >
                                <Share2 className="w-4 h-4" />
                                Share
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(pass);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                            <p>QR Code not available</p>
                          </div>
                        )}
                      </div>

                      {/* Details Section */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Guest Details</h4>
                          <p className="text-gray-900">{pass.guestDetails.name}</p>
                          <p className="text-gray-600">{pass.guestDetails.phone}</p>
                          <p className="text-gray-600">{pass.guestDetails.purpose}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                          <p className="text-gray-900">
                            {formatDate(pass.duration.startDate)} - {formatDate(pass.duration.endDate)}
                          </p>
                          <p className="text-gray-600">{pass.duration.days} day{pass.duration.days > 1 ? 's' : ''}</p>
                        </div>

                        {pass.hasVehicle && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Vehicle Details</h4>
                            <p className="text-gray-900">{pass.vehicleDetails.vehicleType}</p>
                            <p className="text-gray-600">{pass.vehicleDetails.registrationNumber}</p>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">PIN Code</h4>
                          <p className="text-gray-900">{pass.pinCode}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Status</h4>
                          <p className={isExpired ? 'text-gray-600' : 'text-green-600'}>
                            {isExpired ? 'Expired' : 'Active'}
                          </p>
                        </div>

                        {/* Add Delete Button in Details Section */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPassToDelete(pass);
                              setShowDeleteModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Delete Pass</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && selectedPassForShare && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full animate-fade-in-up">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Share Gate Pass</h3>
            <div className="flex flex-col items-center">
              <img 
                src={selectedPassForShare.shareableImage} 
                alt="Shareable Gate Pass"
                className="mb-4 w-auto h-auto"
                style={{ maxWidth: '100%', objectFit: 'contain' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleShare(selectedPassForShare)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  onClick={() => handleDownload(selectedPassForShare)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSelectedPassForShare(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && passToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full animate-fade-in-up">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Gate Pass</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this gate pass for {passToDelete.guestDetails.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPassToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePass(passToDelete._id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestPassRequest; 