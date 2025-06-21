import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { 
  Dog, Cat, Bird, Search, Plus, RefreshCw, Trash2, AlertTriangle, ArrowLeft,
  CheckCircle, XCircle, Clock, X, ChevronDown, ChevronUp, Upload, Filter
} from 'lucide-react';
import { FaFish, FaOtter } from "react-icons/fa";
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

const AnimalTagRequest = () => {
  const router = useRouter();
  const [animalTags, setAnimalTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [residentData, setResidentData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedTag, setExpandedTag] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    animalType: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [formattedTags, setFormattedTags] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [zoomedQR, setZoomedQR] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    animalType: '',
    name: '',
    breed: '',
    color: '',
    age: '',
    gender: '',
    identificationMark: '',
    vaccinated: false,
    lastVaccinationDate: '',
    nextVaccinationDue: '',
    medicalHistory: '',
    documents: []
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
      
      // Fetch animal tags after resident data is loaded
      fetchAnimalTags(data._id);
    } catch (error) {
      console.error('Error fetching resident details:', error);
    }
  }; 

  const fetchAnimalTags = async (residentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Resident');
      const response = await axios.get('/api/AnimalTag-Api/get-tags', {
        params: { residentId },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setAnimalTags(response.data);
      setFormattedTags(response.data);
    } catch (error) {
      console.error('Error fetching animal tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (residentData?._id) {
      fetchAnimalTags(residentData._id);
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    if (!showForm) {
      setFormData({
        animalType: '',
        name: '',
        breed: '',
        color: '',
        age: '',
        gender: '',
        identificationMark: '',
        vaccinated: false,
        lastVaccinationDate: '',
        nextVaccinationDue: '',
        medicalHistory: '',
        documents: []
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
    let filtered = [...animalTags];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(tag => 
        tag.animalDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tag.animalDetails.breed.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply animal type filter
    if (filters.animalType) {
      filtered = filtered.filter(tag => tag.animalType === filters.animalType);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(tag => tag.status === filters.status);
    }

    setFormattedTags(filtered);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      animalType: ''
    });
    setSearchQuery('');
    setFormattedTags(animalTags);
    setShowFilters(false);
  };

  const getAnimalIcon = (type) => {
    switch (type) {
      case 'Dog':
        return Dog;
      case 'Cat':
        return Cat;
      case 'Bird':
        return Bird;
      case 'Fish':
        return FaFish;
      default:
        return FaOtter;
    }
  };

  const getStatusColor = (status) => {
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

  const getStatusIcon = (status) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const token = localStorage.getItem('Resident');

      // First create the animal tag and get the PIN
      const createResponse = await axios.post('/api/AnimalTag-Api/create-tag', 
        {
          residentId: residentData._id,
          societyId: residentData.societyId,
          animalType: formData.animalType,
          name: formData.name,
          breed: formData.breed,
          color: formData.color,
          age: formData.age,
          gender: formData.gender,
          identificationMark: formData.identificationMark,
          vaccinated: formData.vaccinated,
          lastVaccinationDate: formData.lastVaccinationDate,
          nextVaccinationDue: formData.nextVaccinationDue,
          medicalHistory: formData.medicalHistory,
          documents: formData.documents
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      const { pinCode, data: animalTag } = createResponse.data;

      // Generate QR code data with PIN
      const qrData = {
        tagId: animalTag._id,
        tagType: 'animal',
        societyId: residentData.societyId,
        animalType: formData.animalType,
        name: formData.name,
        pinCode: pinCode
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

      // Update the animal tag with the QR code
      const updateResponse = await axios.patch(`/api/AnimalTag-Api/update-tag/${animalTag._id}`, 
        {
          qrCode: qrCodeDataUrl
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      // Add new tag to state
      setAnimalTags(prev => [updateResponse.data.data, ...prev]);
      setFormattedTags(prev => [updateResponse.data.data, ...prev]);
      
      // Reset form and close it
      setFormData({
        animalType: '',
        name: '',
        breed: '',
        color: '',
        age: '',
        gender: '',
        identificationMark: '',
        vaccinated: false,
        lastVaccinationDate: '',
        nextVaccinationDue: '',
        medicalHistory: '',
        documents: []
      });
      setShowForm(false);

    } catch (error) {
      console.error('Error creating animal tag:', error);
      alert(error.response?.data?.message || 'Failed to create animal tag');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      const token = localStorage.getItem('Resident');
      await axios.delete(`/api/AnimalTag-Api/delete-tag/${tagId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      // Remove tag from state
      setAnimalTags(prev => prev.filter(tag => tag._id !== tagId));
      setFormattedTags(prev => prev.filter(tag => tag._id !== tagId));
      setShowDeleteModal(false);

    } catch (error) {
      console.error('Error deleting animal tag:', error);
      alert(error.response?.data?.message || 'Failed to delete animal tag');
    }
  };

  const toggleTagExpansion = (tagId) => {
    setExpandedTag(expandedTag === tagId ? null : tagId);
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
        <h1 className="text-2xl md:text-3xl text-center font-bold text-blue-600 mb-6">Animal Tags</h1>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Register New Animal</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Animal Type Selection */}
            <div className="grid grid-cols-4 gap-4">
              {['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Other'].map((type) => {
                const Icon = getAnimalIcon(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, animalType: type }))}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      formData.animalType === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <Icon className={formData.animalType === type ? 'text-blue-500' : 'text-gray-400'} />
                    <span className={formData.animalType === type ? 'text-blue-500' : 'text-gray-500 text-sm'}>{type}</span>
                  </button>
                );
              })}
            </div>

            {/* Animal Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Identification Mark</label>
                <input
                  type="text"
                  value={formData.identificationMark}
                  onChange={(e) => setFormData(prev => ({ ...prev, identificationMark: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any distinguishing marks"
                />
              </div>
            </div>

            {/* Vaccination Details */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="vaccinated"
                  checked={formData.vaccinated}
                  onChange={(e) => setFormData(prev => ({ ...prev, vaccinated: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="vaccinated" className="ml-2 block text-sm text-gray-900">
                  Vaccinated
                </label>
              </div>

              {formData.vaccinated && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Vaccination Date</label>
                    <input
                      type="date"
                      value={formData.lastVaccinationDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastVaccinationDate: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Vaccination Due</label>
                    <input
                      type="date"
                      value={formData.nextVaccinationDue}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextVaccinationDue: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Medical History */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
              <textarea
                value={formData.medicalHistory}
                onChange={(e) => setFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Any medical conditions or history"
              />
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
              placeholder="Search by name or breed..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Animal Type</label>
              <select
                name="animalType"
                value={filters.animalType}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Fish">Fish</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Hamster">Hamster</option>
                <option value="Other">Other</option>
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

      {/* Animal Tags List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : formattedTags.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl shadow-lg">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No animal tags found</p>
            <button
              onClick={toggleForm}
              className="mt-4 px-4 py-2 text-blue-500 hover:text-blue-600"
            >
              Register a new animal
            </button>
          </div>
        ) : (
          formattedTags.map((tag) => {
            const StatusIcon = getStatusIcon(tag.status);
            const statusColor = getStatusColor(tag.status);
            const isExpanded = expandedTag === tag._id;
            const AnimalIcon = getAnimalIcon(tag.animalType);

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
                      <AnimalIcon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-900">{tag.animalDetails.name}</h3>
                      <p className="text-xs text-gray-600">
                        {tag.animalType} • {tag.animalDetails.breed || 'No breed specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`px-2 py-2 rounded-full text-xs font-medium ${statusColor}`}>
                      <StatusIcon className="w-4 h-4 inline-block mr-1" />
                      {tag.status}
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
                                setZoomedQR(tag.qrCode);
                              }}
                              className="cursor-pointer transform transition-transform hover:scale-105"
                            >
                              <img 
                                src={tag.qrCode} 
                                alt="Animal Tag QR Code"
                                className="mb-4 w-auto h-auto"
                                style={{ maxWidth: '100%', objectFit: 'contain' }}
                              />
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
                          <h4 className="text-sm font-medium text-gray-500">Animal Details</h4>
                          <p className="text-gray-900">
                            {tag.animalDetails.color} {tag.animalDetails.breed} • {tag.animalDetails.gender}
                          </p>
                          {tag.animalDetails.age && (
                            <p className="text-gray-600 text-sm">
                              Age: {tag.animalDetails.age} years
                            </p>
                          )}
                        </div>

                        {tag.animalDetails.identificationMark && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Identification Mark</h4>
                            <p className="text-gray-900">{tag.animalDetails.identificationMark}</p>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Vaccination Status</h4>
                          <p className="text-gray-900">
                            {tag.animalDetails.vaccinated ? 'Vaccinated' : 'Not Vaccinated'}
                          </p>
                          {tag.animalDetails.vaccinated && tag.animalDetails.nextVaccinationDue && (
                            <p className="text-sm text-gray-600">
                              Next vaccination due: {new Date(tag.animalDetails.nextVaccinationDue).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {tag.animalDetails.medicalHistory && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Medical History</h4>
                            <p className="text-gray-900">{tag.animalDetails.medicalHistory}</p>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">PIN Code</h4>
                          <p className="text-gray-900">{tag.pinCode}</p>
                        </div>

                        {/* Delete Section */}
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
                              <span className="text-sm font-medium">{tag.status}</span>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Animal Tag</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this animal tag? This action cannot be undone.
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
                Scan this QR code for animal verification
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalTagRequest; 