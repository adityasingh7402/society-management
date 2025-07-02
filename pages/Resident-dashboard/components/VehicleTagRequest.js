import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { 
  Car, Bike, Truck, Calendar, Filter, Search, 
  Plus, RefreshCw, Trash2, AlertTriangle, ArrowLeft,
  CheckCircle, XCircle, Clock, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { FaMotorcycle } from "react-icons/fa";
import Head from 'next/head';
import QRCode from 'react-qr-code';

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

const VehicleTagRequest = () => {
  const router = useRouter();
  const [vehicleTags, setVehicleTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [residentData, setResidentData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedTag, setExpandedTag] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    vehicleType: '',
    validityStatus: 'all' // 'all', 'active', 'expired'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [formattedTags, setFormattedTags] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [zoomedQR, setZoomedQR] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    vehicleType: '',
    brand: '',
    model: '',
    color: '',
    registrationNumber: '',
    validUntil: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  // Add a new state to store QR data
  const [qrDataMap, setQrDataMap] = useState({});

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
      
      // Fetch vehicle tags after resident data is loaded
      fetchVehicleTags(data._id);
    } catch (error) {
      console.error('Error fetching resident details:', error);
    }
  };

  const fetchVehicleTags = async (residentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Resident');
      const response = await axios.get('/api/VehicleTag-Api/get-tags', {
        params: { residentId },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      // Store QR data for each tag
      const newQrDataMap = {};
      response.data.forEach(tag => {
              try {
        if (tag.qrData) {
          newQrDataMap[tag._id] = JSON.parse(tag.qrData);
        } else {
          // Ensure we only use the societyId string
          const societyId = typeof tag.societyId === 'object' ? tag.societyId._id : tag.societyId;
          
          newQrDataMap[tag._id] = {
            tagId: tag._id,
            tagType: 'vehicle',
            societyId: societyId,
            vehicleType: tag.vehicleType,
            registrationNumber: tag.vehicleDetails.registrationNumber,
            pinCode: tag.pinCode
          };
        }
        } catch (error) {
          console.error('Error parsing QR data for tag:', tag._id, error);
        }
      });
      setQrDataMap(newQrDataMap);
      
      setVehicleTags(response.data);
      setFormattedTags(response.data);
    } catch (error) {
      console.error('Error fetching vehicle tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (residentData?._id) {
      fetchVehicleTags(residentData._id);
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    if (!showForm) {
      setFormData({
        vehicleType: '',
        brand: '',
        model: '',
        color: '',
        registrationNumber: '',
        validUntil: ''
      });
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const applyFilters = () => {
    let filtered = [...vehicleTags];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(tag => 
        tag.vehicleDetails.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tag.vehicleDetails.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.vehicleDetails.model.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply vehicle type filter
    if (filters.vehicleType) {
      filtered = filtered.filter(tag => tag.vehicleType === filters.vehicleType);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(tag => tag.status === filters.status);
    }

    // Apply validity filter
    if (filters.validityStatus !== 'all') {
      const now = new Date();
      if (filters.validityStatus === 'active') {
        filtered = filtered.filter(tag => new Date(tag.validUntil) > now);
      } else {
        filtered = filtered.filter(tag => new Date(tag.validUntil) <= now);
      }
    }

    setFormattedTags(filtered);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      vehicleType: '',
      validityStatus: 'all'
    });
    setSearchQuery('');
    setFormattedTags(vehicleTags);
    setShowFilters(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const token = localStorage.getItem('Resident');

      // First create the vehicle tag and get the PIN
      const createResponse = await axios.post('/api/VehicleTag-Api/create-tag', 
        {
          residentId: residentData._id,
          societyId: residentData.societyId,
          vehicleType: formData.vehicleType,
          brand: formData.brand,
          model: formData.model,
          color: formData.color,
          registrationNumber: formData.registrationNumber,
          validUntil: formData.validUntil
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      const { pinCode, data: vehicleTag } = createResponse.data;

      try {
              // Ensure we only use the societyId string
      const societyId = typeof residentData.societyId === 'object' ? residentData.societyId._id : residentData.societyId;
      
      // Generate QR code data with PIN
      const qrData = {
        tagId: vehicleTag._id,
        tagType: 'vehicle',
        societyId: societyId,
        vehicleType: formData.vehicleType,
        registrationNumber: formData.registrationNumber,
        pinCode: pinCode
      };

        // Store QR data in state
        setQrDataMap(prev => ({
          ...prev,
          [vehicleTag._id]: qrData
        }));

        // Call backend to generate QR code and shareable image
        const qrResponse = await axios.post('/api/VehicleTag-Api/generate-qr', {
          qrData,
          vehicleDetails: {
            vehicleType: formData.vehicleType,
            brand: formData.brand,
            model: formData.model,
            color: formData.color,
            registrationNumber: formData.registrationNumber,
            validUntil: formatDate(formData.validUntil)
          }
        }, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        });

        const { qrCode: qrCodeDataUrl, shareableImage: shareableImageDataUrl } = qrResponse.data;

        // Update the vehicle tag with QR code and shareable image
        const updateResponse = await axios.patch(`/api/VehicleTag-Api/update-tag/${vehicleTag._id}`, 
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

        // Add new tag to state
        setVehicleTags(prev => [updateResponse.data.data, ...prev]);
        setFormattedTags(prev => [updateResponse.data.data, ...prev]);
        
        // Reset form and close it
        setFormData({
          vehicleType: '',
          brand: '',
          model: '',
          color: '',
          registrationNumber: '',
          validUntil: ''
        });
        setShowForm(false);

      } catch (qrError) {
        // If QR generation fails, delete the created record
        console.error('Error generating QR code:', qrError);
        try {
          await axios.delete(`/api/VehicleTag-Api/delete-tag/${vehicleTag._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          });
          throw new Error('Failed to generate QR code. The tag has been deleted. Please try again.');
        } catch (deleteError) {
          console.error('Error deleting failed tag:', deleteError);
          throw new Error('Failed to generate QR code and cleanup failed. Please contact support.');
        }
      }

    } catch (error) {
      console.error('Error in vehicle tag process:', error);
      alert(error.message || 'Failed to create vehicle tag');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      const token = localStorage.getItem('Resident');
      await axios.delete(`/api/VehicleTag-Api/delete-tag/${tagId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      // Remove tag from state
      setVehicleTags(prev => prev.filter(tag => tag._id !== tagId));
      setFormattedTags(prev => prev.filter(tag => tag._id !== tagId));
      setShowDeleteModal(false);

    } catch (error) {
      console.error('Error deleting vehicle tag:', error);
      alert(error.response?.data?.message || 'Failed to delete vehicle tag');
    }
  };

  const getStatusColor = (status, validUntil) => {
    const isExpired = new Date(validUntil) <= new Date();
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

  const getStatusIcon = (status, validUntil) => {
    const isExpired = new Date(validUntil) <= new Date();
    if (isExpired) return Clock;
    
    switch (status) {
      case 'Approved':
        return CheckCircle;
      case 'Pending':
        return Clock;
      case 'Rejected':
        return XCircle;
      default:
        return AlertTriangle;
    }
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const toggleTagExpansion = (tagId) => {
    setExpandedTag(expandedTag === tagId ? null : tagId);
  };

  // Add a function to get QR data for a tag
  const getQrData = (tag) => {
    if (qrDataMap[tag._id]) {
      return JSON.stringify(qrDataMap[tag._id]);
    }
    try {
          // Ensure we only use the societyId string
    const societyId = typeof tag.societyId === 'object' ? tag.societyId._id : tag.societyId;
    
    return tag.qrData || JSON.stringify({
      tagId: tag._id,
      tagType: 'vehicle',
      societyId: societyId,
      vehicleType: tag.vehicleType,
      registrationNumber: tag.vehicleDetails.registrationNumber,
      pinCode: tag.pinCode
    });
    } catch (error) {
      console.error('Error getting QR data:', error);
      return '';
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
        <h1 className="text-2xl md:text-3xl text-center font-bold text-blue-600 mb-6">Vehicle Tags</h1>
        <div className="flex justify-end mb-2">
          <button
            onClick={toggleForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Cancel' : 'New Tag'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-lg p-6 animate-fade-in-up">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Request New Vehicle Tag</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Type Selection */}
            <div className="grid grid-cols-3 gap-4">
              {['Car', 'Motor Bike', 'Bike'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, vehicleType: type }))}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    formData.vehicleType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  {type === 'Car' && <Car className={formData.vehicleType === type ? 'text-blue-500' : 'text-gray-400'} />}
                  {type === 'Motor Bike' && <FaMotorcycle  className={formData.vehicleType === type ? 'text-blue-500' : 'text-gray-400'} />}
                  {type === 'Bike' && <Bike className={formData.vehicleType === type ? 'text-blue-500' : 'text-gray-400'} />}
                  <span className={formData.vehicleType === type ? 'text-blue-500' : 'text-gray-500 text-sm'}>{type}</span>
                </button>
              ))}
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Validity Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <div className="relative">
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-2"
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
              {formLoading ? 'Submitting...' : 'Submit Request'}
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
              placeholder="Search by registration number, brand, or model..."
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              <select
                name="vehicleType"
                value={filters.vehicleType}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="Car">Car</option>
                <option value="Motor Bike">Motor Bike</option>
                <option value="Bike">Bike</option>
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
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validity</label>
              <select
                name="validityStatus"
                value={filters.validityStatus}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
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

      {/* Vehicle Tags List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : formattedTags.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl shadow-lg">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No vehicle tags found</p>
            <button
              onClick={toggleForm}
              className="mt-4 px-4 py-2 text-blue-500 hover:text-blue-600"
            >
              Request a new tag
            </button>
          </div>
        ) : (
          formattedTags.map((tag) => {
            const StatusIcon = getStatusIcon(tag.status, tag.validUntil);
            const statusColor = getStatusColor(tag.status, tag.validUntil);
            const isExpired = new Date(tag.validUntil) <= new Date();
            const isExpanded = expandedTag === tag._id;

            return (
              <div
                key={tag._id}
                onClick={() => tag.status === 'Approved' && toggleTagExpansion(tag._id)}
                className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow animate-fade-in-up ${
                  tag.status === 'Approved' ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      {tag.vehicleType === 'Car' && <Car className="w-6 h-6 text-blue-500" />}
                      {tag.vehicleType === 'Motor Bike' && <FaMotorcycle className="w-6 h-6 text-blue-500" />}
                      {tag.vehicleType === 'Bike' && <Bike className="w-6 h-6 text-blue-500" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-900">{tag.vehicleDetails.registrationNumber}</h3>
                      <p className="text-xs text-gray-600">
                        {tag.vehicleDetails.brand} {tag.vehicleDetails.model} • {tag.vehicleDetails.color}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`px-2 py-2 rounded-full text-xs font-medium ${statusColor}`}>
                      <StatusIcon className="w-4 h-4 inline-block mr-1" />
                      {isExpired ? 'Expired' : tag.status}
                    </div>
                    {tag.status === 'Approved' ? (
                      <div className="text-gray-500">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTagToDelete(tag);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Content - Only show for approved tags */}
                {isExpanded && tag.status === 'Approved' && (
                  <div className="mt-2 pt-2 border-t border-gray-100 animate-slide-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* QR Code Section */}
                      <div className="flex flex-col items-center justify-center px-6 py-2 bg-gray-50 rounded-lg">
                        {tag.qrCode ? (
                          <div className="flex flex-col items-center">
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomedQR(getQrData(tag));
                              }}
                              className="cursor-pointer transform transition-transform hover:scale-105"
                            >
                              <div className="mb-4 p-4 bg-white rounded-lg">
                                <QRCode
                                  value={getQrData(tag)}
                                  size={180}
                                  level="M"
                                  fgColor="#1A75FF"
                                />
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 text-center">
                              Click QR code to enlarge
                            </p>
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
                          <h4 className="text-sm font-medium text-gray-500">Validity Period</h4>
                          <p className="text-gray-900">
                            {formatDate(tag.validFrom)} - {formatDate(tag.validUntil)}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">PIN Code</h4>
                          <p className="text-gray-900">{tag.pinCode}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Status</h4>
                          <p className="text-green-600">
                            {isExpired ? 'Expired' : tag.status}
                          </p>
                        </div>
                        {tag.remarks && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Remarks</h4>
                            <p className="text-gray-900">{tag.remarks}</p>
                          </div>
                        )}
                        {/* Delete and Status Section */}
                        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTagToDelete(tag);
                              setShowDeleteModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Delete Tag</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-2 rounded-lg ${statusColor} flex items-center gap-2`}>
                              <StatusIcon className="w-5 h-5" />
                              <span className="text-sm font-medium">
                                {isExpired ? 'Expired' : tag.status}
                              </span>
                            </div>
                          </div>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Vehicle Tag</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this vehicle tag? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTag(tagToDelete._id)}
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
            className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-auto animate-fade-in-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomedQR(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-lg w-full flex justify-center">
                <div className="max-w-full max-h-[70vh] overflow-auto">
                  <QRCode
                    value={zoomedQR}
                    size={278}
                    level="M"
                    fgColor="#1A75FF"
                  />
                </div>
              </div>
              <p className="mt-4 text-gray-600 text-center">
                Scan this QR code at the entrance for vehicle verification
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleTagRequest; 