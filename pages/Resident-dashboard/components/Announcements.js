import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ChevronLeft, Bell, Calendar, Clock, Image as ImageIcon, RefreshCw, ChevronDown, Filter, Search, X, ChevronRight } from 'lucide-react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

const Announcements = () => {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [residentData, setResidentData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all', // all, today, week, month
    sortBy: 'newest' // newest, oldest
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Image modal states
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState([]);

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

  useEffect(() => {
    if (router.isReady) {
      fetchResidentData();
    }
  }, [router.isReady]);

  useEffect(() => {
    if (residentData) {
      fetchAnnouncements();
    }
  }, [residentData, pagination.page]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, announcements]);

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
    } catch (error) {
      toast.error('Error fetching resident details');
      console.error('Error:', error);
    }
  };

  const fetchAnnouncements = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem('Resident');
      if (!token) {
        toast.error('Please login to view announcements');
        return;
      }

      const response = await axios.get('/api/Resident-Api/get-announcements', {
        params: { 
          societyId: residentData.societyId,
          page: pagination.page,
          limit: 20
        },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.data.success) {
        setAnnouncements(response.data.announcements);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Error fetching announcements');
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...announcements];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(announcement =>
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          filterDate.setDate(now.getDate());
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(announcement =>
        new Date(announcement.createdAt) >= filterDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return filters.sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredAnnouncements(filtered);
  };

  const handleRefresh = () => {
    fetchAnnouncements(true);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: 'all',
      sortBy: 'newest'
    });
    setSearchQuery('');
    setShowFilters(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    
    return formatDate(dateString);
  };

  // Image modal handlers
  const openImageModal = (images, startIndex = 0) => {
    setCurrentImages(images);
    setCurrentImageIndex(startIndex);
    setShowImageModal(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImages([]);
    setCurrentImageIndex(0);
    // Restore body scroll
    document.body.style.overflow = 'auto';
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === currentImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? currentImages.length - 1 : prevIndex - 1
    );
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showImageModal) return;
      
      if (e.key === 'Escape') {
        closeImageModal();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showImageModal, currentImages.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (loading) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-r from-indigo-100 to-purple-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-indigo-700 font-medium">Loading announcements...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <Head>
        <title>Announcements - Resident Dashboard</title>
        <meta name="description" content="View society announcements" />
      </Head>

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
                Announcements
              </motion.h1>

              <motion.button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 text-white bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/30 transition-colors transform hover:scale-105 duration-200 disabled:opacity-50"
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </motion.button>
            </div>

            {/* Search and Filter */}
            <motion.div
              className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search announcements..."
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700">Date Range</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                      className="w-full p-3 border border-gray-200 text-sm rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full p-3 border border-gray-200 text-sm rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
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
                    onClick={() => setShowFilters(false)}
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

        {/* Content Area */}
        <main className="max-w-6xl mx-auto px-2 py-2 relative z-10">
          {filteredAnnouncements.length === 0 ? (
            <motion.div
              className="text-center py-16"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-indigo-50">
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bell size={40} className="text-indigo-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                  No announcements found
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchQuery || filters.dateRange !== 'all' 
                    ? "No announcements match your current search criteria. Try adjusting your filters."
                    : "There are no announcements available at the moment. Check back later for updates from your society management."}
                </p>
                {(searchQuery || filters.dateRange !== 'all') && (
                  <motion.button
                    onClick={resetFilters}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Clear Filters
                  </motion.button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredAnnouncements.map((announcement, index) => (
                <motion.div
                  key={announcement._id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-indigo-50 overflow-hidden"
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {announcement.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar size={16} className="text-indigo-500" />
                            <span>{announcement.date ? formatDate(announcement.date) : formatDate(announcement.createdAt)}</span>
                          </div>
                          {announcement.time && (
                            <div className="flex items-center space-x-1">
                              <Clock size={16} className="text-indigo-500" />
                              <span>{formatTime(announcement.time)}</span>
                            </div>
                          )}
                          <div className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {getTimeAgo(announcement.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {announcement.description}
                      </p>
                    </div>

                    {/* Images */}
                    {announcement.image && announcement.image.length > 0 && (
                      <div className="mb-4">
                        {announcement.image.length === 1 ? (
                          <div 
                            className="relative rounded-xl overflow-hidden cursor-zoom-in group"
                            onClick={() => openImageModal(announcement.image, 0)}
                          >
                            <img
                              src={announcement.image[0]}
                              alt={announcement.title}
                              className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                                  <Search size={24} className="text-gray-800" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <ImageSlider 
                            images={announcement.image} 
                            title={announcement.title}
                            onImageClick={(images, index) => openImageModal(images, index)}
                          />
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-indigo-600">
                            Society Announcement
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Published {getTimeAgo(announcement.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>

        {/* Image Modal */}
        <AnimatePresence>
          {showImageModal && (
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeImageModal}
            >
              <motion.div
                className="relative max-w-4xl max-h-[90vh] w-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <motion.button
                  onClick={closeImageModal}
                  className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm hover:bg-black/50 p-3 rounded-full z-10 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={24} className="text-white" />
                </motion.button>

                {/* Navigation buttons */}
                {currentImages.length > 1 && (
                  <>
                    <motion.button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-sm hover:bg-white/20 p-3 rounded-full z-10 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ChevronLeft size={24} className="text-white" />
                    </motion.button>
                    <motion.button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-sm hover:bg-white/20 p-3 rounded-full z-10 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ChevronRight size={24} className="text-white" />
                    </motion.button>
                  </>
                )}

                {/* Image */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={currentImages[currentImageIndex]}
                    alt={`Image ${currentImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>

                {/* Image counter */}
                {currentImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
                    {currentImageIndex + 1} / {currentImages.length}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

// ImageSlider Component
const ImageSlider = ({ images, title, onImageClick }) => {
  const splideOptions = {
    type: 'slide',
    rewind: true,
    gap: '1rem',
    arrows: true,
    pagination: true,
    autoplay: false,
    height: '16rem',
    cover: true,
    breakpoints: {
      768: {
        height: '12rem',
      },
    },
  };

  return (
    <div className="relative rounded-xl overflow-hidden">
      <Splide options={splideOptions} className="announcement-slider">
        {images.map((image, index) => (
          <SplideSlide key={index}>
            <div 
              className="relative w-full h-64 cursor-zoom-in group"
              onClick={() => onImageClick(images, index)}
            >
              <img
                src={image}
                alt={`${title} - Image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                    <Search size={24} className="text-gray-800" />
                  </div>
                </div>
              </div>
            </div>
          </SplideSlide>
        ))}
      </Splide>
      
      {/* Custom styles for slider */}
      <style jsx global>{`
        .announcement-slider .splide__arrow {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          border: none;
          border-radius: 50%;
          width: 2rem;
          height: 2rem;
          transition: all 0.3s ease;
        }
        
        .announcement-slider .splide__arrow:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.1);
        }
        
        .announcement-slider .splide__arrow svg {
          fill: #4F46E5;
        }
        
        .announcement-slider .splide__pagination {
          bottom: 1rem;
        }
        
        .announcement-slider .splide__pagination__page {
          background: rgba(255, 255, 255, 0.7);
          border: none;
          border-radius: 50%;
          width: 0.40rem;
          height: 0.40rem;
          margin: 0 0.25rem;
          transition: all 0.3s ease;
        }
        
        .announcement-slider .splide__pagination__page.is-active {
          background: #4F46E5;
          transform: scale(1.3);
        }
        
        .announcement-slider .splide__pagination__page:hover {
          background: #6366F1;
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

export default Announcements;
