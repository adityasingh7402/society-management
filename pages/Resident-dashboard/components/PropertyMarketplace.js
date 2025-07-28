import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Plus, Filter, Search, Home, Bell, ChevronLeft, Heart, MessageCircle, Trash2, AlertTriangle, X, ChevronDown, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';
import { toast } from 'react-hot-toast';

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
  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    },
    hover: {
      y: -5,
      scale: 1.02,
      transition: { type: "spring", stiffness: 300 }
    }
  };

  const modalVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", damping: 25, stiffness: 300 }
    },
    exit: { scale: 0.8, opacity: 0 }
  };

  useEffect(() => {
    if (router.isReady) {
      fetchResidentData();
    }
  }, [router.isReady]);

  useEffect(() => {
    if (residentData) {
      fetchProperties(residentData.societyId);
      fetchMessages();
    }
  }, [residentData]);

  // Add effect to refresh messages when component is focused
  useEffect(() => {
    const handleFocus = () => {
      if (residentData?.societyId) {
        fetchMessages();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [residentData]);

  // Add hash change listener and initialize from URL
  useEffect(() => {
    const setTabFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (['all', 'my-listings', 'responses'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    setTabFromHash();
    window.addEventListener('hashchange', setTabFromHash);

    return () => {
      window.removeEventListener('hashchange', setTabFromHash);
    };
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

      if (data.societyId) {
        fetchProperties(data.societyId);
      }
    } catch (error) {
      toast.error('Error fetching resident details');
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
      toast.error('Error fetching properties');
    } finally {
      setLoading(false);
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

  const applyFilters = (search = searchQuery, filterValues = filters) => {
    let filtered = [...properties];

    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchLower) ||
        property.description.toLowerCase().includes(searchLower)
      );
    }

    if (filterValues.propertyType) {
      filtered = filtered.filter(property => property.propertyType === filterValues.propertyType);
    }

    if (filterValues.furnishingStatus) {
      filtered = filtered.filter(property => property.furnishingStatus === filterValues.furnishingStatus);
    }

    if (filterValues.bedrooms) {
      filtered = filtered.filter(property => property.bedrooms === parseInt(filterValues.bedrooms));
    }

    if (filterValues.bathrooms) {
      filtered = filtered.filter(property => property.bathrooms === parseInt(filterValues.bathrooms));
    }

    if (filterValues.minPrice) {
      filtered = filtered.filter(property => property.price >= parseFloat(filterValues.minPrice));
    }

    if (filterValues.maxPrice) {
      filtered = filtered.filter(property => property.price <= parseFloat(filterValues.maxPrice));
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
      toast.error('Please login to like properties');
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

      const updateProperties = (prevProperties) =>
        prevProperties.map(property =>
          property._id === propertyId
            ? {
              ...property,
              likes: response.data.liked
                ? [...property.likes, residentData._id]
                : property.likes.filter(id => id !== residentData._id)
            }
            : property
        );

      setProperties(updateProperties);
      setFormattedProperties(updateProperties);

      toast.success(response.data.liked ? 'Property liked' : 'Property unliked');
    } catch (error) {
      toast.error('Error liking property');
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const truncateMessage = (message) => {
    const words = message.split(' ');
    if (words.length > 6) {
      return words.slice(0, 6).join(' ') + '...';
    }
    return message;
  };

  const handleDeleteProperty = async (propertyId) => {
    try {
      const token = localStorage.getItem('Resident');

      await axios.delete(`/api/Property-Api/delete-property?propertyId=${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      setProperties(prevProperties => prevProperties.filter(property => property._id !== propertyId));
      setFormattedProperties(prevProperties => prevProperties.filter(property => property._id !== propertyId));

      setShowDeleteModal(false);
      setPropertyToDelete(null);
      toast.success('Property deleted successfully');
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const openDeleteModal = (e, property) => {
    e.stopPropagation();
    e.preventDefault();
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setPropertyToDelete(null);
  };

  const getMyListings = () => {
    if (!residentData) return [];
    return properties.filter(property => property.sellerId === residentData._id);
  };

  const handleTabChange = (tabId) => {
    window.location.hash = tabId;
    setActiveTab(tabId);
    if (tabId === 'my-listings') {
      setFormattedProperties(getMyListings());
    } else if (tabId === 'all') {
      setFormattedProperties(properties);
    } else if (tabId === 'responses') {
      fetchMessages();
    }
  };

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      const token = localStorage.getItem('Resident');
      if (!token) {
        console.error('No token found');
        toast.error('Please log in again');
        router.push('/login');
        return;
      }

      if (!residentData?._id) {
        console.error('No resident data found');
        return;
      }

      const response = await axios.get('/api/Property-Api/get-messages', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      setUnreadMessages({});

      const conversations = {};
      const unreadCounts = {};

      response.data.forEach(msg => {
        const isUserSender = msg.senderId === residentData._id;
        const otherUserId = isUserSender ? msg.receiverId : msg.senderId;
        const conversationKey = `${msg.propertyId}-${otherUserId}`;

        if (!conversations[conversationKey] ||
          new Date(msg.createdAt) > new Date(conversations[conversationKey].createdAt)) {
          conversations[conversationKey] = {
            otherUser: {
              id: otherUserId,
              name: isUserSender ? msg.receiverName : msg.senderName,
              image: isUserSender ? msg.receiverImage : msg.senderImage
            },
            property: {
              id: msg.propertyId,
              title: msg.propertyTitle
            },
            message: msg.message,
            createdAt: msg.createdAt,
            isUserSender
          };
        }

        if (!msg.isRead && msg.receiverId === residentData._id) {
          if (!unreadCounts[msg.propertyId]) {
            unreadCounts[msg.propertyId] = 0;
          }
          unreadCounts[msg.propertyId]++;
        }
      });

      setUnreadMessages(unreadCounts);

      const sortedMessages = Object.values(conversations)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.data?.error) {
        console.error('Server error details:', error.response.data.error);
      }
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    const loadMessages = async () => {
      if (activeTab === 'responses' && residentData?._id) {
        await fetchMessages();
      }
    };
    loadMessages();
  }, [activeTab, residentData]);

  // Add effect to apply search in real-time
  useEffect(() => {
    if (activeTab !== 'responses') {
      applyFilters(searchQuery, filters);
    }
  }, [searchQuery, filters, activeTab, properties]);

  const getFilteredProperties = () => {
    if (activeTab === 'my-listings') {
      return formattedProperties.filter(prop => prop.sellerId === residentData?._id);
    } else if (activeTab === 'responses') {
      if (messagesLoading) {
        return [];
      }
      return messages;
    } else {
      return formattedProperties;
    }
  };

  if (loading) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-r from-indigo-100 to-purple-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-indigo-700 font-medium">Loading properties...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-r from-indigo-100 to-purple-50 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background pattern overlay */}
      <div className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366F1' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}>
      </div>

      {/* Header */}
      <motion.div
        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 px-4 shadow-lg relative z-10"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <motion.button
              onClick={() => router.push('/Resident-dashboard')}
              className="flex items-center space-x-2 text-white bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/30 transition-colors transform hover:scale-105 duration-200"
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft size={20} />
              <span className="text-base font-medium">Back</span>
            </motion.button>

            <motion.h1
              className="text-2xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Property Marketplace
            </motion.h1>
          </div>

          {/* Tabs */}
          <motion.div
            className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              { id: 'all', label: 'Properties', icon: Home },
              { id: 'my-listings', label: 'My Listings', icon: Home },
              { id: 'responses', label: 'Messages', icon: Bell }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
                {tab.id === 'responses' && Object.values(unreadMessages).reduce((a, b) => a + b, 0) > 0 && (
                  <span className="bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full ml-1">
                    {Object.values(unreadMessages).reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </motion.button>
            ))}
          </motion.div>

          {/* Search and Filter - Only show for 'all' and 'my-listings' tabs */}
          {activeTab !== 'responses' && (
            <motion.div
              className="mt-4 flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-12 pr-4 py-3 text-sm bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-500"
                />
                <Search size={20} className="absolute left-4 top-3.5 text-gray-400" />
              </div>
              <motion.button
                onClick={toggleFilters}
                className="flex items-center text-sm space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/30 transition-all duration-200 shadow-lg text-white"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Filter size={18} />
                <span>Filters</span>
                <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-indigo-100 relative z-10"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-6xl mx-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700">Property Type</label>
                  <select
                    name="propertyType"
                    value={filters.propertyType}
                    onChange={handleFilterChange}
                    className="w-full p-3 border border-gray-200 text-sm rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
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
                  <label className="block text-xs font-medium text-gray-700">Furnishing Status</label>
                  <select
                    name="furnishingStatus"
                    value={filters.furnishingStatus}
                    onChange={handleFilterChange}
                    className="w-full p-3 border border-gray-200 text-sm rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Any Status</option>
                    <option value="Fully Furnished">Fully Furnished</option>
                    <option value="Semi Furnished">Semi Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700">Bedrooms</label>
                  <select
                    name="bedrooms"
                    value={filters.bedrooms}
                    onChange={handleFilterChange}
                    className="w-full p-3 border border-gray-200 text-sm rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
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
                  <label className="block text-xs font-medium text-gray-700">Bathrooms</label>
                  <select
                    name="bathrooms"
                    value={filters.bathrooms}
                    onChange={handleFilterChange}
                    className="w-full p-3 border border-gray-200 text-sm rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Any</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700">Min Price</label>
                  <input
                    type="number"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    placeholder="₹ 0"
                    className="w-full p-3 border border-gray-200 text-sm rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700">Max Price</label>
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    placeholder="₹ 999999"
                    className="w-full p-3 border border-gray-200 text-sm rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <motion.button
                  onClick={resetFilters}
                  className="px-6 py-3 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Reset
                </motion.button>
                <motion.button
                  onClick={applyFilters}
                  className="px-6 py-3 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Apply Filters
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <div className="fixed bottom-10 right-5 z-50">
        <motion.button
          onClick={handleAddNew}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 active:scale-95 hover:scale-110 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="w-7 h-7 text-white" />
          <span className="absolute w-full h-full rounded-full border-4 border-indigo-400/30 animate-ping"></span>
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-400/20 to-purple-400/20 blur-md"></span>
        </motion.button>
      </div>

      {/* Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-4 relative z-10">
        {getFilteredProperties().length === 0 && !messagesLoading ? (
          <motion.div
            className="text-center py-16"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-indigo-50">
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                {activeTab === 'responses' ? (
                  <MessageCircle size={40} className="text-indigo-600" />
                ) : (
                  <Home size={40} className="text-indigo-600" />
                )}
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                {activeTab === 'responses' ? 'No messages yet' : 'No properties found'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {activeTab === 'my-listings'
                  ? "You haven't listed any properties yet. Start by adding your first property!"
                  : activeTab === 'responses'
                    ? "When you receive messages about properties, they'll appear here"
                    : "There are no properties available in your society yet. Be the first to list something!"}
              </p>
              {activeTab !== 'responses' && (
                <motion.button
                  onClick={handleAddNew}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  List a Property
                </motion.button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {activeTab === 'responses' ? (
              // Messages View
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-50 overflow-hidden">
                {messagesLoading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No messages yet</h2>
                    <p className="text-gray-500">When you receive messages about properties, they'll appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {messages.map((conversation, index) => {
                      const { otherUser, property, message, createdAt } = conversation;

                      return (
                        <motion.div
                          key={`${property.id}-${otherUser.id}`}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link
                            href={`/Resident-dashboard/components/PropertyChat?buyerId=${otherUser.id}&propertyId=${property.id}`}
                            className="block p-6 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200"
                          >
                            <div className="flex items-center space-x-4">
                              {otherUser.image ? (
                                <img
                                  src={otherUser.image}
                                  alt={otherUser.name}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center border-2 border-indigo-200">
                                  <span className="text-indigo-600 font-semibold text-lg">{otherUser.name?.[0]}</span>
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-semibold text-gray-800">{otherUser.name}</h3>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {new Date(createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs text-indigo-600 font-medium mb-1">{property.title}</p>
                                <p className="text-xs text-gray-600">{truncateMessage(message)}</p>
                              </div>
                              {unreadMessages[property.id] > 0 && (
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                                  {unreadMessages[property.id]}
                                </div>
                              )}
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Regular Properties Grid
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredProperties().map((property, index) => (
                  <motion.div
                    key={property._id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={`/Resident-dashboard/components/PropertyDetail?id=${property._id}`}
                      className="block"
                    >
                      <div className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-indigo-50 h-full">
                        {/* Property Image */}
                        <div className="relative w-full h-48">
                          {/* Delete button - only show for the property owner */}
                          {residentData && property.sellerId === residentData._id && (
                            <motion.button
                              onClick={(e) => openDeleteModal(e, property)}
                              className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-red-50 hover:shadow-xl transition-all duration-200 z-10"
                              title="Delete property"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </motion.button>
                          )}

                          {property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-indigo-100 to-purple-100">
                              <Home size={40} className="text-indigo-400" />
                            </div>
                          )}

                          {/* Status Tag */}
                          <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-medium rounded-full shadow-lg ${
                            property.status === 'Available' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                            property.status === 'Under Contract' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                            'bg-gradient-to-r from-red-500 to-red-600 text-white'
                          }`}>
                            {property.status}
                          </div>

                          {/* Like Button */}
                          <motion.button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleLike(property._id);
                            }}
                            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Heart
                              size={16}
                              className={isLikedByUser(property) ? 'text-red-500' : 'text-gray-500'}
                              fill={isLikedByUser(property) ? 'currentColor' : 'none'}
                            />
                          </motion.button>
                        </div>

                        {/* Property Info */}
                        <div className="p-5">
                          <h3 className="text-lg font-semibold text-gray-800 hover:text-indigo-600 line-clamp-1 mb-2">
                            {property.title}
                          </h3>

                          <div className="mb-3">
                            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                              {formatPrice(property.price)}
                            </span>
                          </div>

                          <div className="mb-3 flex gap-2 flex-wrap">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                              {property.propertyType}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                              {property.furnishingStatus}
                            </span>
                          </div>

                          <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div className="flex items-center">
                              <span>{property.bedrooms} Beds</span>
                            </div>
                            <div className="flex items-center">
                              <span>{property.bathrooms} Baths</span>
                            </div>
                            <div className="flex items-center">
                              <span>{property.area} sq.ft</span>
                            </div>
                            <div className="flex items-center">
                              <span>Floor {property.location?.floor}</span>
                            </div>
                          </div>

                          <p className="text-xs text-gray-600 line-clamp-2 mb-4">{property.description}</p>

                          {/* Location Info */}
                          {property.location && (
                            <div className="mb-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                              <p>Block {property.location.block}, Floor {property.location.floor}, Flat {property.location.flatNumber}</p>
                            </div>
                          )}

                          {/* Seller Info */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                              <div className="flex-shrink-0">
                                {property.sellerImage ? (
                                  <img
                                    src={property.sellerImage}
                                    alt={property.sellerName}
                                    className="h-8 w-8 rounded-full border-2 border-indigo-100"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center border-2 border-indigo-200">
                                    <span className="text-xs font-medium text-indigo-600">
                                      {property.sellerName?.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-700">{property.sellerName}</p>
                                <p className="text-xs text-gray-500">{formatDate(property.createdAt)}</p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1 text-gray-500">
                                <Heart size={14} />
                                <span className="text-xs font-medium">{property.likes?.length || 0}</span>
                              </div>
                              {unreadMessages[property._id] > 0 && (
                                <div className="flex items-center space-x-1">
                                  <MessageCircle size={14} className="text-indigo-500" />
                                  <span className="text-xs font-medium text-indigo-500">
                                    {unreadMessages[property._id]}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && propertyToDelete && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-indigo-50"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                  <AlertTriangle size={32} className="text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Delete Property</h3>
                <p className="text-gray-600 mb-8">
                  Are you sure you want to delete <span className="font-semibold text-gray-800">"{propertyToDelete.title}"</span>?
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex space-x-4">
                <motion.button
                  onClick={closeDeleteModal}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => handleDeleteProperty(propertyToDelete._id)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PropertyMarketplace;