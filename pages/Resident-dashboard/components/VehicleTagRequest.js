import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { 
  Car, Bike, Truck, Calendar, Filter, Search, 
  Plus, RefreshCw, Trash2, AlertTriangle, ArrowLeft,
  CheckCircle, XCircle, Clock, X
} from 'lucide-react';
import Head from 'next/head';

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
`;

const VehicleTagRequest = () => {
  const router = useRouter();
  const [vehicleTags, setVehicleTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [residentData, setResidentData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    vehicleType: '',
    validityStatus: 'all' // 'all', 'active', 'expired'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [formattedTags, setFormattedTags] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

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
      const response = await axios.post('/api/VehicleTag-Api/create-tag', 
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

      // Add new tag to state
      setVehicleTags(prev => [response.data.data, ...prev]);
      setFormattedTags(prev => [response.data.data, ...prev]);
      
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

    } catch (error) {
      console.error('Error creating vehicle tag:', error);
      alert(error.response?.data?.message || 'Failed to create vehicle tag');
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Head>
        <style>{animationStyles}</style>
      </Head>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Tags</h1>
          <p className="text-gray-600">Manage your vehicle access passes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
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
              {['Car', 'Bike', 'Bicycle'].map((type) => (
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
                  {type === 'Bike' && <Bike className={formData.vehicleType === type ? 'text-blue-500' : 'text-gray-400'} />}
                  {type === 'Bicycle' && <Truck className={formData.vehicleType === type ? 'text-blue-500' : 'text-gray-400'} />}
                  <span className={formData.vehicleType === type ? 'text-blue-500' : 'text-gray-500'}>{type}</span>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                <option value="Bike">Bike</option>
                <option value="Bicycle">Bicycle</option>
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

            return (
              <div
                key={tag._id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow animate-fade-in-up"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {tag.vehicleType === 'Car' && <Car className="w-6 h-6 text-blue-500" />}
                      {tag.vehicleType === 'Bike' && <Bike className="w-6 h-6 text-blue-500" />}
                      {tag.vehicleType === 'Bicycle' && <Truck className="w-6 h-6 text-blue-500" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{tag.vehicleDetails.registrationNumber}</h3>
                      <p className="text-sm text-gray-600">
                        {tag.vehicleDetails.brand} {tag.vehicleDetails.model} • {tag.vehicleDetails.color}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span>{isExpired ? 'Expired' : tag.status}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Valid until: {formatDate(tag.validUntil)}
                      </p>
                    </div>

                    {!isExpired && tag.status === 'Pending' && (
                      <button
                        onClick={() => {
                          setTagToDelete(tag);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {tag.qrCode && tag.status === 'Approved' && !isExpired && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-center">
                      <img
                        src={tag.qrCode}
                        alt="QR Code"
                        className=""
                      />
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
    </div>
  );
};

export default VehicleTagRequest; 