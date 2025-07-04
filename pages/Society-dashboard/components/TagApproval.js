import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { 
  Car, Bike, Truck, Filter, Search, 
  RefreshCw, CheckCircle, XCircle, Clock,
  AlertTriangle, ChevronDown, User, Phone, Home
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

const TagApproval = () => {
  const router = useRouter();
  const [vehicleTags, setVehicleTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [societyData, setSocietyData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    vehicleType: '',
    validityStatus: 'all' // 'all', 'active', 'expired'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [formattedTags, setFormattedTags] = useState([]);
  const [expandedTag, setExpandedTag] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchSocietyData();
  }, []);

  const fetchSocietyData = async () => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      const response = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch society details');
      }

      const data = await response.json();
      setSocietyData(data);
      
      // Fetch vehicle tags after society data is loaded
      fetchVehicleTags(data._id);
    } catch (error) {
      console.error('Error fetching society details:', error);
    }
  };

  const fetchVehicleTags = async (societyId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Society');
      const response = await axios.get('/api/VehicleTag-Api/get-tags', {
        params: { societyId },
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
    if (societyData?._id) {
      fetchVehicleTags(societyData._id);
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
        tag.vehicleDetails.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.residentId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.residentId?.phone?.includes(searchQuery)
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

  const handleApproveTag = async (tagId) => {
    try {
      setProcessingAction(true);
      const token = localStorage.getItem('Society');
      const response = await axios.post(`/api/VehicleTag-Api/approve-tag`, 
        { tagId, status: 'Approved' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      // Update tag in state
      setVehicleTags(prev => prev.map(tag => 
        tag._id === tagId ? { ...tag, status: 'Approved' } : tag
      ));
      setFormattedTags(prev => prev.map(tag => 
        tag._id === tagId ? { ...tag, status: 'Approved' } : tag
      ));

    } catch (error) {
      console.error('Error approving tag:', error);
      alert(error.response?.data?.message || 'Failed to approve tag');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectTag = async (tagId) => {
    try {
      setProcessingAction(true);
      const token = localStorage.getItem('Society');
      const response = await axios.post(`/api/VehicleTag-Api/approve-tag`, 
        { tagId, status: 'Rejected' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      // Update tag in state
      setVehicleTags(prev => prev.map(tag => 
        tag._id === tagId ? { ...tag, status: 'Rejected' } : tag
      ));
      setFormattedTags(prev => prev.map(tag => 
        tag._id === tagId ? { ...tag, status: 'Rejected' } : tag
      ));

    } catch (error) {
      console.error('Error rejecting tag:', error);
      alert(error.response?.data?.message || 'Failed to reject tag');
    } finally {
      setProcessingAction(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Tag Approvals</h1>
          <p className="text-gray-600">Manage and approve vehicle tag requests</p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by registration number, resident name, or phone..."
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
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow animate-fade-in-up"
              >
                {/* Main Info */}
                <div className="p-6">
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

                      <button
                        onClick={() => setExpandedTag(isExpanded ? null : tag._id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                      >
                        <ChevronDown className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {/* Resident Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Resident Name</p>
                            <p className="text-gray-600">{tag.residentId?.name || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Contact</p>
                            <p className="text-gray-600">{tag.residentId?.phone || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Home className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Flat Details</p>
                            <p className="text-gray-600">
                              Block {tag.residentId?.flatDetails?.block || 'N/A'}, 
                              Flat {tag.residentId?.flatDetails?.flatNo || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {tag.status === 'Pending' && !isExpired && (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleRejectTag(tag._id)}
                            disabled={processingAction}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveTag(tag._id)}
                            disabled={processingAction}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TagApproval; 