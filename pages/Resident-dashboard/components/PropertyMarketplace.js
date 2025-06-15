import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Plus, Filter, Search, Home, ShoppingCart, X, ChevronDown, Heart, MessageCircle, RefreshCw, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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
`;

const PropertyMarketplace = () => {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [residentData, setResidentData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    propertyType: '',
    furnishingStatus: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [formattedProperties, setFormattedProperties] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

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
      
      // Fetch properties after resident data is loaded
      fetchProperties(data.societyId);
    } catch (error) {
      console.error('Error fetching resident details:', error);
    }
  };

  const fetchProperties = async (societyId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Resident');
      const response = await axios.get('/api/Property-Api/property', {
        params: { societyId: societyId },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setProperties(response.data);
      setFormattedProperties(response.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (residentData?.societyId) {
      fetchProperties(residentData.societyId);
    }
  };

  const handleAddNew = () => {
    router.push('/Resident-dashboard/components/AddProperty');
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
    let filtered = [...properties];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        property.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply property type filter
    if (filters.propertyType) {
      filtered = filtered.filter(property => property.propertyType === filters.propertyType);
    }

    // Apply furnishing status filter
    if (filters.furnishingStatus) {
      filtered = filtered.filter(property => property.furnishingStatus === filters.furnishingStatus);
    }

    // Apply bedrooms filter
    if (filters.bedrooms) {
      filtered = filtered.filter(property => property.bedrooms === parseInt(filters.bedrooms));
    }

    // Apply bathrooms filter
    if (filters.bathrooms) {
      filtered = filtered.filter(property => property.bathrooms === parseInt(filters.bathrooms));
    }

    // Apply price filters
    if (filters.minPrice) {
      filtered = filtered.filter(property => property.price >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(property => property.price <= parseFloat(filters.maxPrice));
    }

    setFormattedProperties(filtered);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      propertyType: '',
      furnishingStatus: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: ''
    });
    setSearchQuery('');
    setFormattedProperties(properties);
    setShowFilters(false);
  };

  const handleLike = async (propertyId) => {
    if (!residentData) {
      alert('Please login to like properties');
      return;
    }

    try {
      const token = localStorage.getItem('Resident');
      const response = await axios.post('/api/Property-Api/like-property', 
        {
          propertyId,
          residentId: residentData._id
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      // Update properties state with updated like status
      setProperties(prevProperties => 
        prevProperties.map(property => 
          property._id === propertyId 
            ? { 
                ...property, 
                likes: response.data.liked 
                  ? [...property.likes, residentData._id]
                  : property.likes.filter(id => id !== residentData._id)
              } 
            : property
        )
      );

      // Also update formatted properties
      setFormattedProperties(prevProperties => 
        prevProperties.map(property => 
          property._id === propertyId 
            ? { 
                ...property, 
                likes: response.data.liked 
                  ? [...property.likes, residentData._id]
                  : property.likes.filter(id => id !== residentData._id)
              } 
            : property
        )
      );
    } catch (error) {
      console.error('Error liking property:', error);
    }
  };

  const isLikedByUser = (property) => {
    return residentData && property.likes.includes(residentData._id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const formatPrice = (price) => {
    const crore = Math.floor(price / 10000000);
    const lakh = Math.floor((price % 10000000) / 100000);
    
    let formattedPrice = '';
    if (crore > 0) {
      formattedPrice += `${crore} Cr `;
    }
    if (lakh > 0) {
      formattedPrice += `${lakh} L`;
    }
    
    return formattedPrice.trim() || '0';
  };

  const handleDeleteProperty = async (propertyId) => {
    try {
      const token = localStorage.getItem('Resident');
      
      const response = await axios.delete(`/api/Property-Api/delete-property?propertyId=${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      // Remove the deleted property from both states
      setProperties(prevProperties => prevProperties.filter(property => property._id !== propertyId));
      setFormattedProperties(prevProperties => prevProperties.filter(property => property._id !== propertyId));
      
      // Close modal
      setShowDeleteModal(false);
      setPropertyToDelete(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  const openDeleteModal = (e, property) => {
    e.stopPropagation(); // Prevent triggering the parent click
    e.preventDefault(); // Prevent link navigation
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setPropertyToDelete(null);
  };

  const goBack = () => {
    router.push('/Resident-dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Head>
        <style>{animationStyles}</style>
      </Head>
      
      {/* Header */}
      <div className="bg-white z-20 shadow-md py-4 px-6 sticky top-0">
        <div className="max-w-6xl mx-auto">
          <div className="p-2">
            <button
              onClick={goBack}
              className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-base">Back</span>
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-2xl font-bold text-gray-800">Property Marketplace</h1>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
              >
                <Plus size={24} className="" />
                {/* <span>List Property</span> */}
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mt-4 flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            <button
              onClick={toggleFilters}
              className="flex items-center space-x-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Filter size={18} />
              <span>Filters</span> 
              <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 bg-white p-4 border rounded-lg shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Property Type</label>
                  <select
                    name="propertyType"
                    value={filters.propertyType}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Studio">Studio</option>
                    <option value="Garage">Garage</option>
                    <option value="Single Room">Single Room</option>
                    <option value="Shop">Shop</option>
                    <option value="Office Space">Office Space</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Furnishing Status</label>
                  <select
                    name="furnishingStatus"
                    value={filters.furnishingStatus}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Status</option>
                    <option value="Fully Furnished">Fully Furnished</option>
                    <option value="Semi Furnished">Semi Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                  <select
                    name="bedrooms"
                    value={filters.bedrooms}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5+</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                  <select
                    name="bathrooms"
                    value={filters.bathrooms}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Min Price</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      name="minPrice"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      placeholder="Amount"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      name="minPriceUnit"
                      className="w-24 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="lakh">Lakh</option>
                      <option value="crore">Crore</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Max Price</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      name="maxPrice"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      placeholder="Amount"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      name="maxPriceUnit"
                      className="w-24 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="lakh">Lakh</option>
                      <option value="crore">Crore</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Properties Display */}
      <div className="w-full max-w-6xl mx-auto px-4 mt-6">
        {formattedProperties.length === 0 ? (
          <div className="text-center py-10">
            <Home size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No properties found</h2>
            <p className="text-gray-500 mb-4">There are no properties listed in your society right now.</p>
            <button
              onClick={handleAddNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Be the first to list a property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formattedProperties.map((property) => (
              <Link 
                key={property._id} 
                href={`/Resident-dashboard/components/PropertyDetail?id=${property._id}`}
                className="block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full"
              >
                {/* Property Image */}
                <div className="relative w-full h-48">
                  {/* Delete button - only show for the property owner */}
                  {residentData && property.sellerId === residentData._id && (
                    <button 
                      onClick={(e) => openDeleteModal(e, property)} 
                      className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-md hover:bg-red-100 transition-colors z-10"
                      title="Delete property"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  )}
                  
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Home size={32} className="text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Tag */}
                  <div className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold rounded ${
                    property.status === 'Available' ? 'bg-green-500 text-white' :
                    property.status === 'Under Contract' ? 'bg-yellow-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {property.status}
                  </div>
                </div>
                
                {/* Property Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 line-clamp-1">
                    {property.title}
                  </h3>
                  
                  <div className="mt-1">
                    <span className="text-xl font-bold text-blue-600">₹ {formatPrice(property.price)}</span>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="flex items-center text-gray-600">
                      <span className="text-sm">{property.bedrooms} Beds</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="text-sm">{property.bathrooms} Baths</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="text-sm">{property.area} sq.ft</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="text-sm">{property.propertyType}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {property.furnishingStatus}
                    </span>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{property.description}</p>
                  
                  {/* Location Info */}
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Block {property.location.block}, Floor {property.location.floor}, Flat {property.location.flatNumber}</p>
                  </div>
                  
                  {/* Seller Info */}
                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {property.sellerImage ? (
                          <img
                            src={property.sellerImage}
                            alt={property.sellerName}
                            className="h-6 w-6 rounded-full"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-500">
                              {property.sellerName.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-2">
                        <p className="text-xs text-gray-500 line-clamp-1">{property.sellerName}</p>
                        <p className="text-xs text-gray-400">{formatDate(property.createdAt)}</p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                      <button 
                        className={`flex items-center space-x-1 ${
                          isLikedByUser(property) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLike(property._id);
                        }}
                      >
                        <Heart size={14} fill={isLikedByUser(property) ? 'currentColor' : 'none'} />
                        <span className="text-xs">{property.likes.length}</span>
                      </button>
                      
                      <div className="flex items-center space-x-1 text-gray-500">
                        <MessageCircle size={14} />
                        <span className="text-xs">{property.comments.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && propertyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg max-w-md w-full p-5 transform transition-all animate-fade-in-up"
            style={{animation: 'fadeInUp 0.3s ease-out'}}
          >
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Property</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <span className="font-medium">"{propertyToDelete.title}"</span>? 
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-center space-x-10 mt-5">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProperty(propertyToDelete._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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

export default PropertyMarketplace; 