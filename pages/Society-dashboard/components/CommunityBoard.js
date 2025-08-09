import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, Clock, Trash2, Upload, Edit, AlertCircle, X, Save, Plus, Loader2, Building, Bell, Heart, MessageCircle, Send, Search, Filter, UserX, UserCheck, Shield, Eye, EyeOff, Camera, RefreshCw, MessageSquare, Share2, User, Ban, ChevronDown, ChevronUp, Image as ImageIcon, Edit3, MoreHorizontal, Flag } from 'lucide-react';
import PreloaderSociety from '../../components/PreloaderSociety';
import { usePermissions } from "../../../components/PermissionsContext";
import AccessDenied from "../widget/societyComponents/accessRestricted";

export default function CommunityBoard() {
  const router = useRouter();
  const permissions = usePermissions();
  
  if (!permissions.includes("manage_community") && !permissions.includes("full_access")) {
    return <AccessDenied />;
  }

  // State variables
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [posts, setPosts] = useState([]);
  const [residents, setResidents] = useState([]);
  const [blockedResidents, setBlockedResidents] = useState([]);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: 'all', // all, active, deactivated
    author: 'all', // all, society, residents
    dateRange: 'all' // all, today, week, month
  });
  
  // Create post states
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImages, setNewPostImages] = useState([]);
  const [newPostImagePreviews, setNewPostImagePreviews] = useState([]);
  const [creating, setCreating] = useState(false);
  
  // Moderation states
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [blockReason, setBlockReason] = useState('Community guidelines violation');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('Content policy violation');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Comment states
  const [commentContent, setCommentContent] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  useEffect(() => {
    fetchPosts();
    fetchResidents();
    fetchBlockedResidents();
  }, [currentPage]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      const decoded = JSON.parse(atob(token.split('.')[1]));
      const societyId = decoded.id;

      const response = await axios.get('/api/SocialFeed-Api/get-posts', {
        params: { 
          societyId: societyId,
          page: currentPage,
          limit: 15
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'society',
        }
      });

      if (response.data.success) {
        setPosts(response.data.posts);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to fetch posts');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      const token = localStorage.getItem('Society');
      const response = await axios.get('/api/Resident-Api/getAllResidents', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      if (response.data.success) {
        console.log('All residents:', response.data.residents); // Debug log
        const approvedResidents = response.data.residents.filter(r => r.societyVerification === 'Approved');
        console.log('Approved residents:', approvedResidents); // Debug log
        setResidents(approvedResidents);
      }
    } catch (error) {
      console.error('Error fetching residents:', error);
    }
  };

  const fetchBlockedResidents = async () => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) return;
      
      const response = await axios.get('/api/SocialFeed-Api/get-blocked-residents', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      if (response.data.success) {
        setBlockedResidents(response.data.blockedResidents || []);
      }
    } catch (error) {
      console.error('Error fetching blocked residents:', error);
      // Set empty array to prevent UI issues
      setBlockedResidents([]);
    }
  };

  const getSocietyId = () => {
    // Get society ID from token or context
    const token = localStorage.getItem('Society');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        return decoded.id;
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      setError('Please enter some content');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('Society');

      // Upload images first if any
      let imageUrls = [];
      if (newPostImages.length > 0) {
        imageUrls = await handleImageUpload(newPostImages);
      }

      const response = await axios.post('/api/SocialFeed-Api/create-post', {
        content: newPostContent,
        images: imageUrls
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'society',
        }
      });

      if (response.data.success) {
        setSuccess('Post created successfully!');
        setShowCreatePost(false);
        setNewPostContent('');
        setNewPostImages([]);
        setNewPostImagePreviews([]);
        fetchPosts();
      }
    } catch (error) {
      setError('Failed to create post');
      console.error('Error:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleImageUpload = async (files) => {
    if (!files.length) return [];

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('image', file);
      });

      const response = await axios.post('/api/Community-Board-Api/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.imageUrls;
      } else {
        throw new Error(response.data.error || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
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
      const token = localStorage.getItem('Society');
      const response = await axios.post('/api/SocialFeed-Api/toggle-like', {
        targetId: postId,
        targetType: 'post'
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'society',
        }
      });

      if (response.data.success) {
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
      setError('Failed to update like');
      console.error('Error:', error);
    }
  };

  const handleComment = async (postId) => {
    const content = commentContent[postId];
    if (!content || !content.trim()) {
      setError('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment({ ...submittingComment, [postId]: true });
      const token = localStorage.getItem('Society');

      const response = await axios.post('/api/SocialFeed-Api/create-comment', {
        postId,
        content
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'society',
        }
      });

      if (response.data.success) {
        setSuccess('Comment added!');
        setCommentContent({ ...commentContent, [postId]: '' });
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
      setError('Failed to add comment');
      console.error('Error:', error);
    } finally {
      setSubmittingComment({ ...submittingComment, [postId]: false });
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      const token = localStorage.getItem('Society');
      const response = await axios.delete('/api/SocialFeed-Api/delete-post', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'society',
        },
        data: { 
          postId: postToDelete._id,
          reason: deleteReason 
        }
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        setShowDeleteModal(false);
        setPostToDelete(null);
        setDeleteReason('Content policy violation');
        fetchPosts();
      }
    } catch (error) {
      setError('Failed to delete post');
      console.error('Error:', error);
    }
  };

  const handleReactivatePost = async (postId) => {
    try {
      const token = localStorage.getItem('Society');
      const response = await axios.post('/api/SocialFeed-Api/reactivate-post', {
        postId
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-type': 'society',
        }
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        fetchPosts(); // Refresh posts to show updated status
      }
    } catch (error) {
      setError('Failed to reactivate post');
      console.error('Error:', error);
    }
  };

  const handleBlockResident = async (action) => {
    if (!selectedResident) return;

    try {
      const token = localStorage.getItem('Society');
      const response = await axios.post('/api/SocialFeed-Api/manage-resident-access', {
        residentId: selectedResident._id,
        action, // 'block' or 'unblock'
        reason: blockReason
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        setShowBlockModal(false);
        setSelectedResident(null);
        setBlockReason('Community guidelines violation');
        fetchBlockedResidents();
        fetchPosts();
      }
    } catch (error) {
      setError(`Failed to ${action} resident`);
      console.error('Error:', error);
    }
  };

  const isResidentBlocked = (residentId) => {
    return blockedResidents.some(blocked => blocked.residentId === residentId);
  };

  const filteredPosts = posts.filter(post => {
    let matches = true;

    if (searchQuery.trim()) {
      matches = matches && (
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      matches = matches && post.status === filters.status;
    }

    if (filters.author !== 'all') {
      if (filters.author === 'society') {
        matches = matches && post.authorModel === 'Society';
      } else if (filters.author === 'residents') {
        matches = matches && post.authorModel === 'Resident';
      }
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const postDate = new Date(post.createdAt);
      const diffDays = Math.floor((now - postDate) / (1000 * 60 * 60 * 24));

      if (filters.dateRange === 'today' && diffDays > 0) {
        matches = false;
      } else if (filters.dateRange === 'week' && diffDays > 7) {
        matches = false;
      } else if (filters.dateRange === 'month' && diffDays > 30) {
        matches = false;
      }
    }

    return matches;
  });

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  if (isLoading) {
    return <PreloaderSociety />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
        <div className="mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <Users className="mr-3" size={32} />
              Community Board
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => fetchPosts()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 py-6">
        {/* Status Messages */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-center">
            <AlertCircle className="mr-2" size={20} />
            {error}
            <button onClick={() => setError('')} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md flex items-center">
            <Plus className="mr-2" size={20} />
            {success}
            <button onClick={() => setSuccess('')} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Community Stats & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create Post Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">Quick Actions</h3>
              <button
                onClick={() => setShowCreatePost(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 mb-4 transition-colors"
              >
                <Plus size={20} />
                <span>Create Post</span>
              </button>
            </div>

            {/* Community Stats */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">Community Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Posts</span>
                  <span className="font-semibold">{posts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Posts</span>
                  <span className="font-semibold">{posts.filter(p => p.status === 'active').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Blocked Residents</span>
                  <span className="font-semibold text-red-600">{blockedResidents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Residents</span>
                  <span className="font-semibold">{residents.length}</span>
                </div>
              </div>
            </div>

            {/* Resident Management */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">Resident Management</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {residents.map(resident => {
                  const isBlocked = isResidentBlocked(resident._id);
                  return (
                    <div key={resident._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        {resident.image ? (
                          <img src={resident.image} alt={resident.name} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-blue-600">{resident.name[0]}</span>
                          </div>
                        )}
                        <span className="text-sm font-medium">{resident.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedResident(resident);
                          setShowBlockModal(true);
                        }}
                        className={`p-1 rounded ${isBlocked 
                          ? 'text-green-600 hover:text-green-700' 
                          : 'text-red-600 hover:text-red-700'
                        }`}
                      >
                        {isBlocked ? <UserCheck size={16} /> : <UserX size={16} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content - Posts */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-blue-100">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-4">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                  </select>

                  <select
                    value={filters.author}
                    onChange={(e) => setFilters({...filters, author: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Authors</option>
                    <option value="society">Society</option>
                    <option value="residents">Residents</option>
                  </select>

                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Posts List */}
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center border border-blue-100">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || Object.values(filters).some(f => f !== 'all') 
                    ? "No posts match your current filters." 
                    : "Be the first to create a post for your community!"}
                </p>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus size={20} />
                  <span>Create First Post</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map(post => (
                  <PostCard 
                    key={post._id}
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                    onDelete={() => {
                      setPostToDelete(post);
                      setShowDeleteModal(true);
                    }}
                    onReactivate={handleReactivatePost}
                    commentContent={commentContent}
                    setCommentContent={setCommentContent}
                    submittingComment={submittingComment}
                    getTimeAgo={getTimeAgo}
                    getSocietyId={getSocietyId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Post Modal */}
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

      {/* Block/Unblock Modal */}
      {showBlockModal && selectedResident && (
        <BlockResidentModal 
          resident={selectedResident}
          isBlocked={isResidentBlocked(selectedResident._id)}
          onClose={() => {
            setShowBlockModal(false);
            setSelectedResident(null);
          }}
          onConfirm={handleBlockResident}
          reason={blockReason}
          setReason={setBlockReason}
        />
      )}

      {/* Delete Post Modal */}
      {showDeleteModal && postToDelete && (
        <DeletePostModal 
          post={postToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setPostToDelete(null);
          }}
          onConfirm={handleDeletePost}
          reason={deleteReason}
          setReason={setDeleteReason}
        />
      )}
    </div>
  );
}

// Post Card Component
const PostCard = ({ post, onLike, onComment, onDelete, onReactivate, commentContent, setCommentContent, submittingComment, getTimeAgo, getSocietyId }) => {
  const isOwnPost = post.author === getSocietyId() && post.authorModel === 'Society';
  const isDeactivated = post.status === 'deactivated';

  return (
    <div className={`bg-white rounded-lg shadow-md border ${isDeactivated ? 'border-red-200 bg-red-50' : 'border-blue-100'} overflow-hidden`}>
      {/* Post Status Banner */}
      {isDeactivated && (
        <div className="bg-red-100 border-b border-red-200 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <EyeOff size={16} className="text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800">This post has been deactivated</span>
            </div>
            <button
              onClick={() => onReactivate(post._id)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-colors"
            >
              <Eye size={12} />
              <span>Reactivate</span>
            </button>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {post.authorImage ? (
              <img
                src={post.authorImage}
                alt={post.authorName}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center border-2 border-blue-200">
                <span className="text-blue-600 font-semibold text-lg">{post.authorName?.[0]}</span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center">
                {post.authorName}
                {post.authorModel === 'Society' && (
                  <Shield size={16} className="ml-2 text-blue-600" />
                )}
              </h3>
              <p className="text-xs text-gray-500 flex items-center">
                <Clock size={12} className="mr-1" />
                {getTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {post.status === 'active' ? (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                <Eye size={12} className="mr-1" />
                Active
              </span>
            ) : (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
                <EyeOff size={12} className="mr-1" />
                Deactivated
              </span>
            )}
            
            <button
              onClick={() => onDelete()}
              className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

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
              <div className="rounded-xl overflow-hidden">
                <img
                  src={post.images[0]}
                  alt="Post image"
                  className="w-full h-64 object-cover"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {post.images.slice(0, 4).map((image, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    {index === 3 && post.images.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold">+{post.images.length - 4} more</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => onLike(post._id)}
              className={`flex items-center space-x-2 ${post.isLikedByUser ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}
            >
              <Heart 
                size={20} 
                fill={post.isLikedByUser ? 'currentColor' : 'none'}
              />
              <span className="text-sm font-medium">{post.likesCount}</span>
            </button>

            <button
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MessageCircle size={20} />
              <span className="text-sm font-medium">{post.commentsCount}</span>
            </button>
          </div>

          <div className="text-xs text-gray-400">
            ID: {post._id.slice(-6)}
          </div>
        </div>

        {/* Recent Comments Preview */}
        {post.recentComments && post.recentComments.length > 0 && (
          <div className="mt-4 space-y-3">
            {post.recentComments.slice(0, 2).map((comment) => (
              <div key={comment._id} className="flex items-start space-x-3 bg-gray-50 rounded-lg p-3">
                {comment.authorImage ? (
                  <img
                    src={comment.authorImage}
                    alt={comment.authorName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">{comment.authorName?.[0]}</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 flex items-center">
                    {comment.authorName}
                    {comment.authorModel === 'Society' && (
                      <Shield size={12} className="ml-1 text-blue-600" />
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment Input */}
        <div className="mt-4 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
            <Building size={16} className="text-blue-600" />
          </div>
          <div className="flex-1 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentContent[post._id] || ''}
              onChange={(e) => setCommentContent({...commentContent, [post._id]: e.target.value})}
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              onKeyPress={(e) => e.key === 'Enter' && onComment(post._id)}
            />
            <button
              onClick={() => onComment(post._id)}
              disabled={submittingComment[post._id] || !commentContent[post._id]?.trim()}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Post Modal Component
const CreatePostModal = ({ onClose, onSubmit, content, setContent, images, imagePreviews, onImageChange, creating }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-blue-700">Create Society Post</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an update with your community..."
            className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 cursor-pointer">
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
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={creating || !content.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {creating && <Loader2 size={16} className="animate-spin" />}
                <span>{creating ? 'Posting...' : 'Post'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Block Resident Modal Component
const BlockResidentModal = ({ resident, isBlocked, onClose, onConfirm, reason, setReason }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-blue-700">
            {isBlocked ? 'Unblock' : 'Block'} Resident
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-700">
            {isBlocked 
              ? `Are you sure you want to unblock ${resident.name}? They will be able to post again.`
              : `Are you sure you want to block ${resident.name} from posting in the community board?`
            }
          </p>

          {!isBlocked && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
          )}

          <div className="flex items-center space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(isBlocked ? 'unblock' : 'block')}
              className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                isBlocked 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isBlocked ? 'Unblock' : 'Block'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Post Modal Component
const DeletePostModal = ({ post, onClose, onConfirm, reason, setReason }) => {
  const isOwnPost = post.authorModel === 'Society';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-red-700">
            {isOwnPost ? 'Delete' : 'Deactivate'} Post
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-700">
            {isOwnPost 
              ? 'Are you sure you want to permanently delete this post? This action cannot be undone.'
              : 'Are you sure you want to deactivate this post? It will be hidden from residents but can be reactivated later.'
            }
          </p>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 truncate">"{post.content}"</p>
            <p className="text-xs text-gray-500 mt-1">by {post.authorName}</p>
          </div>

          {!isOwnPost && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for deactivation</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
          )}

          <div className="flex items-center space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {isOwnPost ? 'Delete' : 'Deactivate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
