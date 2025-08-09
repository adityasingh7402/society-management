import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ChevronLeft, Users, Calendar, Clock, Image as ImageIcon, RefreshCw, ChevronDown, Filter, Search, X, ChevronRight, Heart, MessageCircle, Send, Trash2, AlertTriangle, Upload, Plus, Camera, FileText } from 'lucide-react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

const CommunityBoard = () => {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [residentData, setResidentData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
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

  // Create post states
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImages, setNewPostImages] = useState([]);
  const [newPostImagePreviews, setNewPostImagePreviews] = useState([]);
  const [creating, setCreating] = useState(false);

  // Comment states
  const [expandedComments, setExpandedComments] = useState({});
  const [commentContent, setCommentContent] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  // Likes modal states
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [currentPostLikes, setCurrentPostLikes] = useState([]);
  const [likesLoading, setLikesLoading] = useState(false);

  // Block status
  const [isBlocked, setIsBlocked] = useState(false);

  // Tab states
  const [activeTab, setActiveTab] = useState('community');

  // Animation variants (same as announcements)
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
      checkBlockStatus();
      fetchPosts();
    }
  }, [residentData, pagination.page]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, posts, activeTab, residentData]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

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

  const checkBlockStatus = async () => {
    try {
      const token = localStorage.getItem('Resident');
      if (!token || !residentData) return;

      const response = await axios.get('/api/SocialFeed-Api/check-block-status', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'resident',
        }
      });

      if (response.data.success) {
        setIsBlocked(response.data.isBlocked);
        if (response.data.isBlocked) {
          console.log('User is blocked from posting:', response.data.blockInfo);
        }
      }
    } catch (error) {
      console.error('Error checking block status:', error);
      // If API fails, assume not blocked to avoid false positives
      setIsBlocked(false);
    }
  };

  const fetchPosts = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem('Resident');
      if (!token) {
        toast.error('Please login to view community board');
        return;
      }

      const response = await axios.get('/api/SocialFeed-Api/get-posts', {
        params: {
          societyId: residentData.societyId,
          page: pagination.page,
          limit: 10
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'resident',
        }
      });

      if (response.data.success) {
        setPosts(response.data.posts);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Error fetching posts');
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...posts];

    // Apply tab filter first
    if (activeTab === 'my-posts') {
      // Show only user's posts (including deactivated ones)
      filtered = filtered.filter(post => 
        post.author === residentData?._id && post.authorModel === 'Resident'
      );
    } else {
      // Community tab - show only active posts from all users
      filtered = filtered.filter(post => post.status === 'active');
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(post =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
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

      filtered = filtered.filter(post =>
        new Date(post.createdAt) >= filterDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return filters.sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredPosts(filtered);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast.error('Please enter some content');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('Resident');

      // Upload images first if any
      let imageUrls = [];
      if (newPostImages.length > 0) {
        imageUrls = await uploadImages(newPostImages);
      }

      const response = await axios.post('/api/SocialFeed-Api/create-post', {
        content: newPostContent,
        images: imageUrls
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'resident',
        }
      });

      if (response.data.success) {
        toast.success('Post created successfully!');
        setShowCreatePost(false);
        setNewPostContent('');
        setNewPostImages([]);
        setNewPostImagePreviews([]);
        fetchPosts(true);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error(error.response.data.message);
        setIsBlocked(true);
      } else {
        toast.error('Failed to create post');
      }
      console.error('Error:', error);
    } finally {
      setCreating(false);
    }
  };

  const uploadImages = async (images) => {
    try {
      const formData = new FormData();

      // Append all images to FormData
      images.forEach((image, index) => {
        formData.append('image', image);
      });

      const response = await axios.post('/api/Community-Board-Api/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.imageUrls;
      } else {
        throw new Error('Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      throw error;
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewPostImages(files);

    const previews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === files.length) {
          setNewPostImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('Resident');
      const response = await axios.post('/api/SocialFeed-Api/toggle-like', {
        targetId: postId,
        targetType: 'post'
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'resident',
        }
      });

      if (response.data.success) {
        // Update post in local state
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId
              ? {
                ...post,
                isLikedByUser: response.data.isLiked,
                likesCount: response.data.likesCount
              }
              : post
          )
        );
      }
    } catch (error) {
      toast.error('Failed to update like');
      console.error('Error:', error);
    }
  };

  const handleComment = async (postId) => {
    const content = commentContent[postId];
    if (!content || !content.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment({ ...submittingComment, [postId]: true });
      const token = localStorage.getItem('Resident');

      const response = await axios.post('/api/SocialFeed-Api/create-comment', {
        postId,
        content
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'resident',
        }
      });

      if (response.data.success) {
        toast.success('Comment added!');
        setCommentContent({ ...commentContent, [postId]: '' });
        // Update post's comment count
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId
              ? {
                ...post,
                commentsCount: post.commentsCount + 1,
                recentComments: [response.data.comment, ...post.recentComments].slice(0, 3)
              }
              : post
          )
        );
      }
    } catch (error) {
      toast.error('Failed to add comment');
      console.error('Error:', error);
    } finally {
      setSubmittingComment({ ...submittingComment, [postId]: false });
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const token = localStorage.getItem('Resident');
      const response = await axios.delete('/api/SocialFeed-Api/delete-post', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'resident',
        },
        data: { postId }
      });

      if (response.data.success) {
        toast.success('Post deleted successfully');
        fetchPosts(true);
      }
    } catch (error) {
      toast.error('Failed to delete post');
      console.error('Error:', error);
    }
  };

  const fetchPostLikes = async (postId) => {
    try {
      setLikesLoading(true);
      const token = localStorage.getItem('Resident');
      const response = await axios.get('/api/SocialFeed-Api/get-likes', {
        params: {
          targetId: postId,
          targetType: 'post'
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'resident',
        }
      });

      if (response.data.success) {
        setCurrentPostLikes(response.data.likes);
        setShowLikesModal(true);
      }
    } catch (error) {
      toast.error('Failed to load likes');
      console.error('Error:', error);
    } finally {
      setLikesLoading(false);
    }
  };

  const closeLikesModal = () => {
    setShowLikesModal(false);
    setCurrentPostLikes([]);
  };

  // Image modal handlers (same as announcements)
  const openImageModal = (images, startIndex = 0) => {
    setCurrentImages(images);
    setCurrentImageIndex(startIndex);
    setShowImageModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImages([]);
    setCurrentImageIndex(0);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
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

  const handleRefresh = () => {
    fetchPosts(true);
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

  if (loading) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-r from-indigo-100 to-purple-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-indigo-700 font-medium">Loading community board...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <Head>
        <title>Community Board - Resident Dashboard</title>
        <meta name="description" content="Share and connect with your society community" />
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
                Community Board
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

            {/* Tabs */}
            <motion.div
              className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 mb-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[
                { id: 'community', label: 'Community', icon: Users },
                { id: 'my-posts', label: 'My Posts', icon: FileText }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-indigo-600 shadow-lg'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </motion.button>
              ))}
            </motion.div>

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
                  placeholder="Search posts..."
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

        {/* Create Post Button - Fixed */}
        {!isBlocked && (
          <div className="fixed bottom-10 right-5 z-40">
            <motion.button
              onClick={() => setShowCreatePost(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 active:scale-95 hover:scale-110 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Plus className="w-7 h-7 text-white" />
              <span className="absolute w-full h-full rounded-full border-4 border-indigo-400/30 animate-ping"></span>
              <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-400/20 to-purple-400/20 blur-md"></span>
            </motion.button>
          </div>
        )}

        {/* Content Area */}
        <main className="max-w-4xl mx-auto px-3 py-2 relative z-10">
          {/* Blocked Message */}
          {isBlocked && (
            <motion.div
              className="mb-6 bg-red-50 border-l-4 border-red-500 p-6 rounded-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center">
                <AlertTriangle className="text-red-500 mr-3" size={24} />
                <div>
                  <h3 className="text-red-800 font-semibold">Posting Restricted</h3>
                  <p className="text-red-700 mt-1">
                    You are currently unable to post due to community guidelines violations.
                    Please contact your society management for more information.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {filteredPosts.length === 0 ? (
            <motion.div
              className="text-center py-16"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-indigo-50">
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users size={40} className="text-indigo-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                  No posts found
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchQuery || filters.dateRange !== 'all'
                    ? "No posts match your current search criteria. Try adjusting your filters."
                    : "Be the first to share something with your community! Create a post to get the conversation started."}
                </p>
                {!isBlocked && !searchQuery && filters.dateRange === 'all' && (
                  <motion.button
                    onClick={() => setShowCreatePost(true)}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create First Post
                  </motion.button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredPosts.map((post, index) => (
                <PostCard
                  key={post._id}
                  post={post}
                  index={index}
                  residentData={residentData}
                  onLike={handleLike}
                  onComment={handleComment}
                  onDelete={handleDeletePost}
                  onImageClick={openImageModal}
                  onShowLikes={fetchPostLikes}
                  commentContent={commentContent}
                  setCommentContent={setCommentContent}
                  submittingComment={submittingComment}
                  expandedComments={expandedComments}
                  setExpandedComments={setExpandedComments}
                  getTimeAgo={getTimeAgo}
                  formatDate={formatDate}
                  cardVariants={cardVariants}
                />
              ))}
            </motion.div>
          )}
        </main>

        {/* Create Post Modal */}
        <AnimatePresence>
          {showCreatePost && (
            <CreatePostModal
              onClose={() => setShowCreatePost(false)}
              onSubmit={handleCreatePost}
              content={newPostContent}
              setContent={setNewPostContent}
              images={newPostImages}
              imagePreviews={newPostImagePreviews}
              onImageChange={handleImageChange}
              creating={creating}
            />
          )}
        </AnimatePresence>

        {/* Image Modal (same as announcements) */}
        <AnimatePresence>
          {showImageModal && (
            <ImageModal
              images={currentImages}
              currentIndex={currentImageIndex}
              onClose={closeImageModal}
              onNext={nextImage}
              onPrev={prevImage}
            />
          )}
        </AnimatePresence>

        {/* Likes Modal */}
        <AnimatePresence>
          {showLikesModal && (
            <LikesModal
              likes={currentPostLikes}
              loading={likesLoading}
              onClose={closeLikesModal}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

// Post Card Component
const PostCard = ({
  post,
  index,
  residentData,
  onLike,
  onComment,
  onDelete,
  onImageClick,
  onShowLikes,
  commentContent,
  setCommentContent,
  submittingComment,
  expandedComments,
  setExpandedComments,
  getTimeAgo,
  formatDate,
  cardVariants
}) => {
  const isOwnPost = post.author === residentData?._id && post.authorModel === 'Resident';

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      transition={{ delay: index * 0.1 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-indigo-50 overflow-hidden"
    >
      <div className="p-4">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {post.authorImage ? (
              <img
                src={post.authorImage}
                alt={post.authorName}
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center border-2 border-indigo-200">
                <span className="text-indigo-600 font-semibold text-lg">{post.authorName?.[0]}</span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-800">{post.authorName}</h3>
              <p className="text-xs text-gray-500 flex items-center">
                <Clock size={12} className="mr-1" />
                {getTimeAgo(post.createdAt)}
                {post.authorModel === 'Society' && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                    Society
                  </span>
                )}
              </p>
            </div>
          </div>

          {isOwnPost && (
            <motion.button
              onClick={() => onDelete(post._id)}
              className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Trash2 size={16} />
            </motion.button>
          )}
        </div>

        {/* Deactivation Notice - Only show for deactivated posts */}
        {post.status === 'deactivated' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
              <div className="flex-1">
                <p className="text-red-800 text-sm font-medium mb-1">Post Deactivated</p>
                {post.deactivationReason && (
                  <p className="text-red-700 text-xs">
                    Reason: {post.deactivationReason}
                  </p>
                )}
                {post.deactivatedAt && (
                  <p className="text-red-600 text-xs mt-1">
                    Deactivated on {formatDate(post.deactivatedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className="mb-4">
            {post.images.length === 1 ? (
              <div
                className="relative rounded-xl overflow-hidden cursor-zoom-in group"
                onClick={() => onImageClick(post.images, 0)}
              >
                <img
                  src={post.images[0]}
                  alt="Post image"
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                      <Search size={24} className="text-gray-800" />
                    </div>
                  </div>
                </div> */}
              </div>
            ) : (
              <ImageSlider
                images={post.images}
                onImageClick={onImageClick}
              />
            )}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1">
              <motion.button
                onClick={() => onLike(post._id)}
                className={`p-2 rounded-full ${post.isLikedByUser ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 hover:bg-red-50 transition-colors`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart
                  size={20}
                  fill={post.isLikedByUser ? 'currentColor' : 'none'}
                />
              </motion.button>
              {post.likesCount > 0 && (
                <motion.button
                  onClick={() => onShowLikes(post._id)}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 hover:underline transition-colors px-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {post.likesCount}
                </motion.button>
              )}
            </div>

            <motion.button
              onClick={() => setExpandedComments({ ...expandedComments, [post._id]: !expandedComments[post._id] })}
              className="flex items-center space-x-2 text-gray-500 hover:text-indigo-500 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle size={20} />
              <span className="text-sm font-medium">{post.commentsCount}</span>
            </motion.button>
          </div>
        </div>

        {/* Recent Comments Preview - Only show if comments section is not expanded and user has interacted with comments before */}
        {/* Removed automatic recent comments preview - comments only show when user clicks comment icon */}

        {/* Expanded Comments Section */}
        <AnimatePresence>
          {expandedComments[post._id] && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden"
            >
              <CommentsSection
                postId={post._id}
                onClose={() => setExpandedComments({ ...expandedComments, [post._id]: false })}
                getTimeAgo={getTimeAgo}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comment Input */}
        <div className="mt-4 flex items-center space-x-3">
          {residentData?.image ? (
            <img
              src={residentData.image}
              alt="Your avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-sm">{residentData?.name?.[0]}</span>
            </div>
          )}
          <div className="flex-1 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentContent[post._id] || ''}
              onChange={(e) => setCommentContent({ ...commentContent, [post._id]: e.target.value })}
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              onKeyPress={(e) => e.key === 'Enter' && onComment(post._id)}
            />
            <motion.button
              onClick={() => onComment(post._id)}
              disabled={submittingComment[post._id] || !commentContent[post._id]?.trim()}
              className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Create Post Modal Component
const CreatePostModal = ({
  onClose,
  onSubmit,
  content,
  setContent,
  images,
  imagePreviews,
  onImageChange,
  creating
}) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-indigo-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Create Post</h3>
          <motion.button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={20} />
          </motion.button>
        </div>

        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share with your community..."
            className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          />

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {imagePreviews.map((preview, index) => (
                <img
                  key={index}
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 cursor-pointer">
              <Camera size={20} />
              <span>Add Photos</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
              />
            </label>

            <div className="flex items-center space-x-3">
              <motion.button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={onSubmit}
                disabled={creating || !content.trim()}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {creating ? 'Posting...' : 'Post'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Image Slider Component (same as announcements)
const ImageSlider = ({ images, onImageClick }) => {
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
      <Splide options={splideOptions} className="post-slider">
        {images.map((image, index) => (
          <SplideSlide key={index}>
            <div
              className="relative w-full h-64 cursor-zoom-in group"
              onClick={() => onImageClick(images, index)}
            >
              <img
                src={image}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                    <Search size={24} className="text-gray-800" />
                  </div>
                </div>
              </div> */}
            </div>
          </SplideSlide>
        ))}
      </Splide>

      {/* Custom styles for slider */}
      <style jsx global>{`
        .post-slider .splide__arrow {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          border: none;
          border-radius: 50%;
          width: 2rem;
          height: 2rem;
          transition: all 0.3s ease;
        }
        
        .post-slider .splide__arrow:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.1);
        }
        
        .post-slider .splide__arrow svg {
          fill: #4F46E5;
        }
        
        .post-slider .splide__pagination {
          bottom: 1rem;
        }
        
        .post-slider .splide__pagination__page {
          background: rgba(255, 255, 255, 0.7);
          border: none;
          border-radius: 50%;
          width: 0.4rem;
          height: 0.4rem;
          margin: 0 0.25rem;
          transition: all 0.3s ease;
        }
        
        .post-slider .splide__pagination__page.is-active {
          background: #4F46E5;
          transform: scale(1.3);
        }
        
        .post-slider .splide__pagination__page:hover {
          background: #6366F1;
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

// Image Modal Component (same as announcements)
const ImageModal = ({ images, currentIndex, onClose, onNext, onPrev }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
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
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm hover:bg-black/50 p-3 rounded-full z-10 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X size={24} className="text-white" />
        </motion.button>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <motion.button
              onClick={onPrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-sm hover:bg-white/20 p-3 rounded-full z-10 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={24} className="text-white" />
            </motion.button>
            <motion.button
              onClick={onNext}
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
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Comments Section Component
const CommentsSection = ({ postId, onClose, getTimeAgo }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async (pageNum = 1) => {
    try {
      const token = localStorage.getItem('Resident');
      const response = await axios.get('/api/SocialFeed-Api/get-comments', {
        params: {
          postId,
          page: pageNum,
          limit: 20
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'resident',
        }
      });

      if (response.data.success) {
        if (pageNum === 1) {
          setComments(response.data.comments);
        } else {
          setComments(prev => [...prev, ...response.data.comments]);
        }
        setHasMore(response.data.pagination.hasNext);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreComments = () => {
    if (!loading && hasMore) {
      fetchComments(page + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h4 className="font-semibold text-gray-800">Comments ({comments.length})</h4>
        <motion.button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X size={20} />
        </motion.button>
      </div>

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={40} className="mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-3 bg-white rounded-lg p-3 shadow-sm"
              >
                {comment.authorImage ? (
                  <img
                    src={comment.authorImage}
                    alt={comment.authorName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold text-sm">{comment.authorName?.[0]}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-semibold text-gray-800">{comment.authorName}</p>
                    {comment.authorModel === 'Society' && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                        Society
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{getTimeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>

                  {/* Comment likes */}
                  <div className="flex items-center space-x-4 mt-2">
                    <motion.button
                      className={`flex items-center space-x-1 text-xs ${comment.isLikedByUser ? 'text-red-500' : 'text-gray-500'
                        } hover:text-red-500 transition-colors`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Heart size={12} fill={comment.isLikedByUser ? 'currentColor' : 'none'} />
                      <span>{comment.likesCount || 0}</span>
                    </motion.button>

                    {comment.hasMoreReplies && (
                      <button className="text-xs text-indigo-600 hover:text-indigo-700">
                        View replies ({comment.repliesCount})
                      </button>
                    )}
                  </div>

                  {/* Replies preview */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 ml-4 space-y-2">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="flex items-start space-x-2">
                          {reply.authorImage ? (
                            <img
                              src={reply.authorImage}
                              alt={reply.authorName}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                              <span className="text-indigo-600 font-semibold text-xs">{reply.authorName?.[0]}</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-gray-800">{reply.authorName}</span>
                              <span className="text-xs text-gray-500">{getTimeAgo(reply.createdAt)}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {hasMore && (
              <div className="text-center">
                <motion.button
                  onClick={loadMoreComments}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Load more comments
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Likes Modal Component
const LikesModal = ({ likes, loading, onClose }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-indigo-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Likes</h3>
          <motion.button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={20} />
          </motion.button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {likes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Heart size={40} className="mx-auto mb-2 opacity-50" />
                <p>No likes yet</p>
              </div>
            ) : (
              likes.map((like) => (
                <motion.div
                  key={like._id || like.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {like.userImage ? (
                    <img
                      src={like.userImage}
                      alt={like.userName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center border-2 border-indigo-200">
                      <span className="text-indigo-600 font-semibold text-sm">{like.userName?.[0]}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{like.userName}</p>
                    {like.userModel === 'Society' && (
                      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                        Society
                      </span>
                    )}
                  </div>
                  <Heart size={16} className="text-red-500" fill="currentColor" />
                </motion.div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CommunityBoard;
