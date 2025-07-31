import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { 
  ArrowLeft, Search, Filter, Plus, X, Clock, 
  CheckCircle, XCircle, ChevronDown, ChevronUp,
  Trash2, AlertTriangle, Share2, Download, Calendar,
  Camera, Upload, Image as ImageIcon
} from 'lucide-react';
import Head from 'next/head';
import QRCode from 'react-qr-code';

// Service type icons
import { 
  FaUtensils, // Cook
  FaBroom, // Maid
  FaBolt, // Electrician
  FaWrench, // Plumber
  FaCar, // Driver
  FaLeaf, // Gardener
  FaShieldAlt, // Security
  FaPaintRoller, // Painter
  FaHammer, // Carpenter
  FaBaby, // Babysitter
  FaEllipsisH // Other
} from 'react-icons/fa';

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

// Service type options with icons
const serviceTypes = [
  { id: 'Cook', icon: FaUtensils, label: 'Cook' },
  { id: 'Maid', icon: FaBroom, label: 'Maid' },
  { id: 'Electrician', icon: FaBolt, label: 'Electrician' },
  { id: 'Plumber', icon: FaWrench, label: 'Plumber' },
  { id: 'Driver', icon: FaCar, label: 'Driver' },
  { id: 'Gardener', icon: FaLeaf, label: 'Gardener' },
  { id: 'Security', icon: FaShieldAlt, label: 'Security' },
  { id: 'Painter', icon: FaPaintRoller, label: 'Painter' },
  { id: 'Carpenter', icon: FaHammer, label: 'Carpenter' },
  { id: 'Babysitter', icon: FaBaby, label: 'Babysitter' },
  { id: 'Other', icon: FaEllipsisH, label: 'Other' }
];

const ServicePersonnelRequest = () => {
  const router = useRouter();
  const [servicePasses, setServicePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [residentData, setResidentData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedPass, setExpandedPass] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    serviceType: '',
    passType: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [formattedPasses, setFormattedPasses] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passToDelete, setPassToDelete] = useState(null);
  const [zoomedQR, setZoomedQR] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPassForShare, setSelectedPassForShare] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    personnelDetails: {
      name: '',
      phone: '',
      serviceType: '',
      otherServiceType: ''
    },
    passType: 'Daily',
    duration: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    workingHours: {
      startTime: '09:00',
      endTime: '17:00'
    }
  });
  const [formLoading, setFormLoading] = useState(false);

  // Add a new state to store QR data
  const [qrDataMap, setQrDataMap] = useState({});
  
  // Image capture states (similar to GuestPassRequest)
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchResidentData();
  }, []);

  // Add these helper functions before the return statement
  const getServiceIcon = (serviceType) => {
    const service = serviceTypes.find(s => s.id === serviceType);
    return service ? service.icon : FaEllipsisH;
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      
      let date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        date = new Date(dateString + 'T00:00:00.000Z');
        
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

  const formatTime = (timeString) => {
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch (error) {
      return timeString;
    }
  };

  const getStatusColor = (status, endDate, passType) => {
    // For daily passes, check if the date is today
    if (passType === 'Daily') {
      const today = new Date();
      const passDate = new Date(endDate);
      const isToday = today.getDate() === passDate.getDate() && 
                     today.getMonth() === passDate.getMonth() && 
                     today.getFullYear() === passDate.getFullYear();
      if (isToday) return 'bg-green-100 text-green-600';
      return 'bg-gray-100 text-gray-600';
    }
    
    // For date range passes, check expiration as before
    const isExpired = new Date(endDate) <= new Date();
    if (isExpired) return 'bg-gray-100 text-gray-600';
    return 'bg-green-100 text-green-600';
  };

  const isPassExpired = (endDate, passType) => {
    if (passType === 'Daily') {
      const today = new Date();
      const passDate = new Date(endDate);
      return !(today.getDate() === passDate.getDate() && 
               today.getMonth() === passDate.getMonth() && 
               today.getFullYear() === passDate.getFullYear());
    }
    return new Date(endDate) <= new Date();
  };

  const getStatusIcon = (status, validUntil, passType) => {
    const isExpired = isPassExpired(validUntil, passType);
    if (isExpired) return Clock;
    return CheckCircle;
  };

  // Add these event handlers before the return statement
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
      
      // Fetch service passes after resident data is loaded
      fetchServicePasses(data._id);
    } catch (error) {
      console.error('Error fetching resident details:', error);
    }
  };

  // Add a function to get QR data for a pass
  const getQrData = (pass) => {
    if (qrDataMap[pass._id]) {
      return JSON.stringify(qrDataMap[pass._id]);
    }
    try {
      return pass.qrData || JSON.stringify({
        passId: pass._id,
        passType: 'service',
        societyId: pass.societyId,
        personnelName: pass.personnelDetails.name,
        serviceType: pass.personnelDetails.serviceType,
        pinCode: pass.pinCode,
        validUntil: pass.duration.endDate
      });
    } catch (error) {
      console.error('Error getting QR data:', error);
      return '';
    }
  };

  // Modify the fetchServicePasses function to store QR data
  const fetchServicePasses = async (residentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Resident');
      const response = await axios.get('/api/ServicePass-Api/get-passes', {
        params: { residentId },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      // Store QR data for each pass
      const newQrDataMap = {};
      response.data.forEach(pass => {
        try {
          if (pass.qrData) {
            newQrDataMap[pass._id] = JSON.parse(pass.qrData);
          } else {
            newQrDataMap[pass._id] = {
              passId: pass._id,
              passType: 'service',
              societyId: pass.societyId,
              personnelName: pass.personnelDetails.name,
              serviceType: pass.personnelDetails.serviceType,
              pinCode: pass.pinCode,
              validUntil: pass.duration.endDate
            };
          }
        } catch (error) {
          console.error('Error parsing QR data for pass:', pass._id, error);
        }
      });
      setQrDataMap(newQrDataMap);

      setServicePasses(response.data);
      setFormattedPasses(response.data);
    } catch (error) {
      console.error('Error fetching service passes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      serviceType: '',
      passType: 'all'
    });
    setSearchQuery('');
    setFormattedPasses(servicePasses);
    setShowFilters(false);
  };

  const applyFilters = () => {
    let filtered = [...servicePasses];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(pass => 
        pass.personnelDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pass.personnelDetails.phone.includes(searchQuery) ||
        pass.personnelDetails.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pass.personnelDetails.otherServiceType && 
         pass.personnelDetails.otherServiceType.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply service type filter
    if (filters.serviceType) {
      filtered = filtered.filter(pass => pass.personnelDetails.serviceType === filters.serviceType);
    }

    // Apply pass type filter
    if (filters.passType !== 'all') {
      filtered = filtered.filter(pass => pass.passType === filters.passType);
    }

    // Apply status filter
    if (filters.status) {
      const now = new Date();
      if (filters.status === 'active') {
        filtered = filtered.filter(pass => new Date(pass.duration.endDate) > now);
      } else {
        filtered = filtered.filter(pass => new Date(pass.duration.endDate) <= now);
      }
    }

    setFormattedPasses(filtered);
    setShowFilters(false);
  };

  const handleDateChange = (field, value) => {
    setFormData(prev => {
      const newDuration = { ...prev.duration };
      
      if (field === 'startDate') {
        newDuration.startDate = value;
        if (prev.passType === 'Daily') {
          newDuration.endDate = value;
        } else if (new Date(value) > new Date(newDuration.endDate)) {
          newDuration.endDate = value;
        }
      } else {
        newDuration.endDate = value;
      }

      return {
        ...prev,
        duration: newDuration
      };
    });
  };

  const handleTimeChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [field]: value
      }
    }));
  };

  const togglePassExpansion = (passId) => {
    setExpandedPass(expandedPass === passId ? null : passId);
  };

  // Modify the handleSubmit function to store QR data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const token = localStorage.getItem('Resident');

      // Use different API endpoints based on whether image is present
      let response;
      if (imageFile) {
        // Use FormData for image upload
        const formDataToSend = new FormData();
        formDataToSend.append('residentId', residentData._id);
        formDataToSend.append('societyId', residentData.societyId);
        formDataToSend.append('societyName', residentData.societyName);
        formDataToSend.append('flatNumber', residentData.flatDetails.flatNumber || '');
        formDataToSend.append('personnelName', formData.personnelDetails.name);
        formDataToSend.append('personnelPhone', formData.personnelDetails.phone);
        formDataToSend.append('serviceType', formData.personnelDetails.serviceType);
        formDataToSend.append('otherServiceType', formData.personnelDetails.otherServiceType);
        formDataToSend.append('passType', formData.passType);
        formDataToSend.append('startDate', formData.duration.startDate);
        formDataToSend.append('endDate', formData.duration.endDate);
        formDataToSend.append('startTime', formData.workingHours.startTime);
        formDataToSend.append('endTime', formData.workingHours.endTime);
        formDataToSend.append('personnelImage', imageFile);
        
        response = await axios.post('/api/ServicePass-Api/create-pass-with-image', formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Use regular JSON API for without image
        response = await axios.post('/api/ServicePass-Api/create-pass',
          {
            residentId: residentData._id,
            societyId: residentData.societyId,
            societyName: residentData.societyName,
            flatDetails: residentData.flatDetails,
            personnelDetails: formData.personnelDetails,
            passType: formData.passType,
            duration: formData.duration,
            workingHours: formData.workingHours
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            }
          }
        );
      }

      const { pinCode, data: servicePass } = response.data;

      try {
        // Generate QR code data
        const qrData = {
          passId: servicePass._id,
          passType: 'service',
          societyId: residentData.societyId,
          personnelName: formData.personnelDetails.name,
          serviceType: formData.personnelDetails.serviceType,
          pinCode,
          validUntil: formData.duration.endDate
        };

        // Store QR data in state
        setQrDataMap(prev => ({
          ...prev,
          [servicePass._id]: qrData
        }));

        // Call backend to generate QR code and shareable image
        const qrResponse = await axios.post('/api/ServicePass-Api/generate-qr', {
          qrData,
          societyName: residentData.societyName,
          flatNumber: residentData.flatDetails.flatNumber,
          personnelName: formData.personnelDetails.name,
          serviceType: formData.personnelDetails.serviceType === 'Other' 
            ? formData.personnelDetails.otherServiceType 
            : formData.personnelDetails.serviceType,
          workingHours: `${formatTime(formData.workingHours.startTime)} - ${formatTime(formData.workingHours.endTime)}`,
          validDates: formData.passType === 'DateRange'
            ? `Valid: ${formatDate(formData.duration.startDate)} - ${formatDate(formData.duration.endDate)}`
            : `Valid for: ${formatDate(formData.duration.startDate)}`
        }, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        });

        const { qrCode: qrCodeDataUrl, shareableImage: shareableImageDataUrl } = qrResponse.data;

        // Update the service pass with QR code and shareable image
        await axios.patch(`/api/ServicePass-Api/update-pass/${servicePass._id}`, 
          {
            qrCode: qrCodeDataUrl,
            shareableImage: shareableImageDataUrl,
            qrData: JSON.stringify(qrData) // Store the QR data in the database
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
          ...servicePass,
          qrCode: qrCodeDataUrl,
          shareableImage: shareableImageDataUrl,
          qrData: JSON.stringify(qrData)
        };
        setServicePasses(prev => [updatedPass, ...prev]);
        setFormattedPasses(prev => [updatedPass, ...prev]);
        
        // Reset form and image states, then close it
        setFormData({
          personnelDetails: {
            name: '',
            phone: '',
            serviceType: '',
            otherServiceType: ''
          },
          passType: 'Daily',
          duration: {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
          },
          workingHours: {
            startTime: '09:00',
            endTime: '17:00'
          }
        });
        setCapturedImage(null);
        setImageFile(null);
        setShowCamera(false);
        setShowForm(false);

        // Show the share modal for the new pass
        setSelectedPassForShare(updatedPass);
        setShowShareModal(true);

      } catch (qrError) {
        // If QR generation fails, delete the created record
        console.error('Error generating QR code:', qrError);
        try {
          await axios.delete(`/api/ServicePass-Api/delete-pass/${servicePass._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          });
          throw new Error('Failed to generate QR code. The pass has been deleted. Please try again.');
        } catch (deleteError) {
          console.error('Error deleting failed pass:', deleteError);
          throw new Error('Failed to generate QR code and cleanup failed. Please contact support.');
        }
      }

    } catch (error) {
      console.error('Error in service pass process:', error);
      alert(error.message || 'Failed to create service pass');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePass = async (passId) => {
    try {
      const token = localStorage.getItem('Resident');
      await axios.delete(`/api/ServicePass-Api/delete-pass/${passId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      // Remove pass from state
      setServicePasses(prev => prev.filter(pass => pass._id !== passId));
      setFormattedPasses(prev => prev.filter(pass => pass._id !== passId));
      setShowDeleteModal(false);

    } catch (error) {
      console.error('Error deleting service pass:', error);
      alert(error.response?.data?.message || 'Failed to delete service pass');
    }
  };

  const handleShare = async (pass) => {
    try {
      // Create a blob from the shareable image
      const response = await fetch(pass.shareableImage);
      const blob = await response.blob();
      
      // Check if the Web Share API is available
      if (navigator.share) {
        const file = new File([blob], 'service-pass.png', { type: 'image/png' });
        await navigator.share({
          title: 'Service Pass',
          text: `Service pass for ${pass.personnelDetails.name}`,
          files: [file]
        });
      } else {
        // Fallback to downloading the image
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'service-pass.png';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error sharing service pass:', error);
      alert('Failed to share service pass');
    }
  };

  const handleDownload = async (pass) => {
    try {
      const response = await fetch(pass.shareableImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'service-pass.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading service pass:', error);
      alert('Failed to download service pass');
    }
  };

  // Image capture functions (copied from GuestPassRequest)
  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device/browser');
      }
      
      setShowCamera(true); // Show modal immediately
      console.log('Camera modal should be visible now');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      console.log('Camera stream obtained');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Video stream assigned to video element');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setShowCamera(false); // Hide modal on error
      
      // More detailed error messages
      if (error.name === 'NotAllowedError') {
        alert('Camera access denied. Please allow camera permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No camera found on this device.');
      } else if (error.name === 'NotSupportedError') {
        alert('Camera not supported on this browser.');
      } else {
        alert(`Camera error: ${error.message}`);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
        setImageFile(blob);
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setCapturedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Toggle form with image state clearing
  const toggleForm = () => {
    if (showForm) {
      // Clear image states when closing form
      setCapturedImage(null);
      setImageFile(null);
      setShowCamera(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    setShowForm(!showForm);
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
        <h1 className="text-2xl md:text-3xl text-center font-bold text-blue-600 mb-6">Service Personnel Passes</h1>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Request New Service Personnel Pass</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Type Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Service Type</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {serviceTypes.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      personnelDetails: {
                        ...prev.personnelDetails,
                        serviceType: id
                      }
                    }))}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      formData.personnelDetails.serviceType === id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <Icon className={formData.personnelDetails.serviceType === id ? 'text-blue-500' : 'text-gray-400'} size={24} />
                    <span className={formData.personnelDetails.serviceType === id ? 'text-blue-500' : 'text-gray-500 text-sm'}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Other Service Type */}
            {formData.personnelDetails.serviceType === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specify Service Type</label>
                <input
                  type="text"
                  value={formData.personnelDetails.otherServiceType}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personnelDetails: {
                      ...prev.personnelDetails,
                      otherServiceType: e.target.value
                    }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            )}

            {/* Personnel Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.personnelDetails.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personnelDetails: {
                      ...prev.personnelDetails,
                      name: e.target.value
                    }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.personnelDetails.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personnelDetails: {
                      ...prev.personnelDetails,
                      phone: e.target.value
                    }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Personnel Image Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Personnel Image (Optional)</h3>
              <div className="space-y-4">
                {!capturedImage ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <Camera className="w-6 h-6 text-gray-400" />
                      <span className="text-gray-600">Take Photo</span>
                    </button>
                    
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-gray-600">Upload Image</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={capturedImage}
                        alt="Personnel"
                        className="w-full max-w-xs h-48 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex items-center gap-2 px-4 py-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                      >
                        <Camera className="w-4 h-4" />
                        Retake Photo
                      </button>
                      <label className="flex items-center gap-2 px-4 py-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Upload Different Image
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pass Type and Duration */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pass Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, passType: 'Daily' }))}
                    className={`p-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                      formData.passType === 'Daily'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <Clock className={formData.passType === 'Daily' ? 'text-blue-500' : 'text-gray-400'} />
                    <span className={formData.passType === 'Daily' ? 'text-blue-500' : 'text-gray-500'}>Daily Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, passType: 'DateRange' }))}
                    className={`p-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                      formData.passType === 'DateRange'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <Calendar className={formData.passType === 'DateRange' ? 'text-blue-500' : 'text-gray-400'} />
                    <span className={formData.passType === 'DateRange' ? 'text-blue-500' : 'text-gray-500'}>Date Range</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.duration.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                {formData.passType === 'DateRange' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.duration.endDate}
                      onChange={(e) => handleDateChange('endDate', e.target.value)}
                      min={formData.duration.startDate}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Working Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.workingHours.startTime}
                  onChange={(e) => handleTimeChange('startTime', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={formData.workingHours.endTime}
                  onChange={(e) => handleTimeChange('endTime', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
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

      {/* Filters and Search */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone number, or service type..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          onClick={toggleFilters}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 bg-white rounded-xl shadow-lg p-6 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select
                name="serviceType"
                value={filters.serviceType}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                {serviceTypes.map(({ id, label }) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pass Type</label>
              <select
                name="passType"
                value={filters.passType}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="Daily">Daily</option>
                <option value="DateRange">Date Range</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Service Passes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : formattedPasses.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl shadow-lg">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No service passes found</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 text-blue-500 hover:text-blue-600"
            >
              Create a new pass
            </button>
          </div>
        ) : (
          formattedPasses.map((pass) => {
            const ServiceIcon = getServiceIcon(pass.personnelDetails.serviceType);
            const StatusIcon = getStatusIcon(pass.status, pass.duration.endDate, pass.passType);
            const statusColor = getStatusColor(pass.status, pass.duration.endDate, pass.passType);
            const isExpired = isPassExpired(pass.duration.endDate, pass.passType);
            const isExpanded = expandedPass === pass._id;

            return (
              <div
                key={pass._id}
                onClick={() => togglePassExpansion(pass._id)}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow animate-fade-in-up cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ServiceIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{pass.personnelDetails.name}</h3>
                      <p className="text-sm text-gray-600">
                        {pass.personnelDetails.serviceType === 'Other' 
                          ? pass.personnelDetails.otherServiceType 
                          : pass.personnelDetails.serviceType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                      <StatusIcon className="w-4 h-4 inline-block mr-1" />
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
                      <div className="flex flex-col items-center justify-center px-6 py-2 bg-gray-50 rounded-lg">
                        {pass.qrCode && (
                          <div className="flex flex-col items-center">
                            <div className="mb-4 p-4 bg-white rounded-lg">
                              <QRCode
                                value={getQrData(pass)}
                                size={256}
                                level="M"
                                fgColor="#1A75FF"
                              />
                            </div>
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
                        )}
                      </div>

                      {/* Details Section */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Contact</h4>
                          <p className="text-gray-900">{pass.personnelDetails.phone}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Pass Type</h4>
                          <p className="text-gray-900">{pass.passType}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                          <p className="text-gray-900">
                            {formatDate(pass.duration.startDate)}
                            {pass.passType === 'DateRange' && ` - ${formatDate(pass.duration.endDate)}`}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Working Hours</h4>
                          <p className="text-gray-900">
                            {formatTime(pass.workingHours.startTime)} - {formatTime(pass.workingHours.endTime)}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">PIN Code</h4>
                          <p className="text-gray-900">{pass.pinCode}</p>
                        </div>

                        {/* Actions Section */}
                        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                          {!isExpired && (
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
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPassForShare(pass);
                              setShowShareModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          >
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Share Pass</span>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full animate-fade-in-up">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Service Pass</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this service pass? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
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

      {/* QR Code Zoom Modal */}
      {zoomedQR && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setZoomedQR(null)}
        >
          <div 
            className="relative bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomedQR(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center">
              <img 
                src={zoomedQR} 
                alt="Enlarged QR Code"
                className="w-auto h-auto"
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
              />
              <p className="mt-4 text-gray-600 text-center">
                Scan this QR code at the entrance for service personnel verification
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedPassForShare && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Share Service Pass</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {selectedPassForShare.shareableImage && (
              <div className="mb-6">
                <img 
                  src={selectedPassForShare.shareableImage} 
                  alt="Shareable Pass"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={() => {
                  if (selectedPassForShare.shareableImage) {
                    const link = document.createElement('a');
                    link.href = selectedPassForShare.shareableImage;
                    link.download = `service-pass-${selectedPassForShare.personnelDetails.name}.png`;
                    link.click();
                  }
                }}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Pass
              </button>

              {navigator.share && (
                <button
                  onClick={async () => {
                    try {
                      const blob = await fetch(selectedPassForShare.shareableImage).then(r => r.blob());
                      const file = new File([blob], 'service-pass.png', { type: 'image/png' });
                      await navigator.share({
                        title: 'Service Pass',
                        text: `Service Pass for ${selectedPassForShare.personnelDetails.name}`,
                        files: [file]
                      });
                    } catch (error) {
                      console.error('Error sharing:', error);
                    }
                  }}
                  className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Share Pass
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full animate-fade-in-up">
            <button
              onClick={stopCamera}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Take Personnel Photo</h3>
              
              <div className="relative mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md h-64 object-cover rounded-lg border"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={captureImage}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Camera className="w-5 h-5" />
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicePersonnelRequest;
