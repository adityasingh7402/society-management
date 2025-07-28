import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

const { 
  Heart, ChevronLeft, Share, Flag, MessageCircle, Send, Phone, 
  Calendar, Tag, MapPin, Package, X, CheckCircle, Facebook, 
  Twitter, Linkedin, Copy, Check, WhatsApp 
} = LucideIcons;

const ProductDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [residentData, setResidentData] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    fetchResidentData();
  }, []);

  useEffect(() => {
    // Fetch product details when id is available
    if (id) {
      fetchProductDetails(id);
    }
  }, [id]);

  useEffect(() => {
    // Check if the Web Share API is available
    setHasNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
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
    } catch (error) {
      console.error('Error fetching resident details:', error);
    }
  };

  const fetchProductDetails = async (productId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Resident');
      const response = await axios.get(`/api/Product-Api/get-product?productId=${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!residentData) {
      alert('Please login to like products');
      return;
    }

    try {
      const token = localStorage.getItem('Resident');
      const response = await axios.post('/api/Product-Api/like-product', 
        {
          productId: id,
          residentId: residentData._id
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      // Update product state with updated like status
      setProduct(prevProduct => {
        if (response.data.liked) {
          // Add user's ID to likes array if not already present
          return {
            ...prevProduct,
            likes: [...prevProduct.likes, residentData._id]
          };
        } else {
          // Remove user's ID from likes array
          return {
            ...prevProduct,
            likes: prevProduct.likes.filter(likeId => likeId !== residentData._id)
          };
        }
      });
    } catch (error) {
      console.error('Error liking product:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!residentData) {
      alert('Please login to comment on products');
      return;
    }
    
    if (!commentText.trim()) {
      return;
    }
    
    try {
      setSubmittingComment(true);
      const token = localStorage.getItem('Resident');
      
      const response = await axios.post('/api/Product-Api/comment-product', 
        {
          productId: id,
          residentId: residentData._id,
          text: commentText
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );
      
      // Update product state with new comments
      setProduct(prevProduct => ({
        ...prevProduct,
        comments: response.data.comments
      }));
      
      // Clear comment text
      setCommentText('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const isLikedByUser = () => {
    return residentData && product?.likes.includes(residentData._id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const goBack = () => {
    router.back();
  };

  const toggleContactInfo = () => {
    setShowContact(!showContact);
  };

  const toggleShareOptions = () => {
    setShowShare(!showShare);
  };

  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const shareOnSocial = (platform) => {
    if (!product) return;
    
    const title = `Check out this listing: ${product.title}`;
    const text = `${product.title} - ${formatPrice(product.price)}`;
    const url = window.location.href;
    
    // Try to use the Web Share API first if available (mobile devices)
    if (platform === 'native' && navigator.share) {
      navigator.share({
        title: title,
        text: text,
        url: url,
      }).catch(error => {
        console.error('Error sharing:', error);
      });
      return;
    }
    
    // Fallback to conventional sharing
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(text);
    
    let shareUrl = '';
    
    switch(platform) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`;
        break;
      default:
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleContactSeller = async () => {
    try {
      const token = localStorage.getItem('Resident');
      if (!token) {
        toast.error('Please log in to contact the seller');
        router.push('/login');
        return;
      }
      
      // Wait for product and resident data to be loaded
      if (!residentData) {
        toast.error('Please wait while we load your profile');
        return;
      }

      if (!product) {
        toast.error('Please wait while we load the product details');
        return;
      }

      if (!product._id || !product.sellerId || !product.title) {
        toast.error('Invalid product data. Please refresh the page.');
        return;
      }

      // Don't allow contacting self
      if (residentData._id === product.sellerId) {
        toast.error('This is your own listing');
        return;
      }

      // Format initial message with product details
      const formattedPrice = formatPrice(product.price);
      const initialMessage = `Hi, I'm interested in your product:\n\nTitle: ${product.title}\nPrice: ${formattedPrice}\nCategory: ${product.category}\nCondition: ${product.condition}`;

      // Send initial message
      const response = await axios.post(
        '/api/Product-Api/send-message',
        {
          productId: product._id,
          message: initialMessage,
          receiverId: product.sellerId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (response.data.success) {
        toast.success('Message sent successfully!');
        // Navigate to chat
        router.push(`/Resident-dashboard/components/ProductChat?buyerId=${residentData._id}&productId=${product._id}`);
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
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
          <p className="text-indigo-700 font-medium">Loading product details...</p>
        </div>
      </motion.div>
    );
  }

  if (!product) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-r from-indigo-100 to-purple-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center max-w-lg bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <div className="w-20 h-20 mx-auto mb-4 text-red-500">
            <X size={80} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-6">
            Sorry, the product you're looking for doesn't exist or may have been removed.
          </p>
          <motion.button
            onClick={goBack}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Back
          </motion.button>
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
          <div className="flex items-center justify-between">
            <motion.button
              onClick={goBack}
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
              Product Details
            </motion.h1>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Images */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-indigo-50 overflow-hidden">
              <div className="relative h-64 md:h-80 lg:h-96 bg-gray-200">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[activeImageIndex]}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Tag size={64} className="text-gray-400" />
                  </div>
                )}
                
                {/* Image Navigation buttons if multiple images */}
                {product.images && product.images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          activeImageIndex === index ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Thumbnail images */}
              {product.images && product.images.length > 1 && (
                <div className="flex overflow-x-auto p-2 space-x-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                        activeImageIndex === index ? 'border-blue-500' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Description */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-50 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{product.title}</h2>
              <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center">
                  <Tag className="text-gray-500 mr-2" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="text-sm font-medium">{product.category}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Package className="text-gray-500 mr-2" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Condition</p>
                    <p className="text-sm font-medium">{product.condition}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="text-gray-500 mr-2" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-sm font-medium">{product.location.societyName}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="text-gray-500 mr-2" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Posted On</p>
                    <p className="text-sm font-medium">{formatDate(product.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Comments Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-50 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Comments ({product.comments.length})
              </h2>
              
              {/* Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {residentData?.userImage ? (
                      <img
                        src={residentData.userImage}
                        alt={residentData.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-800">
                          {residentData?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow relative">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || submittingComment}
                      className={`absolute right-2 bottom-6 p-1.5 rounded-full ${
                        !commentText.trim() || submittingComment
                          ? 'text-gray-400 bg-gray-100'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </form>
              
              {/* Comments List */}
              <div className="space-y-4">
                {product.comments.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageCircle size={36} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  product.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((comment, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        {comment.commenterImage ? (
                          <img
                            src={comment.commenterImage}
                            alt={comment.commenterName}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-500">
                              {comment.commenterName.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="bg-gray-50 rounded-lg px-4 py-3">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-medium text-sm text-gray-900">{comment.commenterName}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(comment.createdAt)} at {formatTime(comment.createdAt)}
                            </p>
                          </div>
                          <p className="text-gray-700 text-xs">{comment.text}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Price, Actions, and Seller Info */}
          <div className="space-y-4">
            {/* Price and Status */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-blue-600">{formatPrice(product.price)}</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.status === 'Available' ? 'bg-green-100 text-green-800' :
                  product.status === 'Reserved' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {product.status}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Only show Contact Seller button if user is not the seller */}
                {residentData && product && residentData._id !== product.sellerId && (
                  <button
                    onClick={handleContactSeller}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <MessageCircle size={18} className="mr-2" />
                    Contact Seller
                  </button>
                )}
                
                <button
                  onClick={handleLike}
                  className={`w-full py-3 rounded-lg border flex items-center justify-center ${
                    isLikedByUser() ? 
                    'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 
                    'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Heart size={18} className="mr-2" fill={isLikedByUser() ? 'currentColor' : 'none'} />
                  {isLikedByUser() ? 'Liked' : 'Like'} ({product.likes.length})
                </button>
                
                {/* Share button */}
                {hasNativeShare ? (
                  <button
                    onClick={() => shareOnSocial('native')}
                    className="w-full py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
                  >
                    <Share size={18} className="mr-2" />
                    Share
                  </button>
                ) : (
                  <button
                    onClick={toggleShareOptions}
                    className="w-full py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
                  >
                    <Share size={18} className="mr-2" />
                    Share
                  </button>
                )}
                
                <button
                  className="w-full py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
                >
                  <Flag size={18} className="mr-2" />
                  Report
                </button>
              </div>
              
              {/* Share Options Modal */}
              {showShare && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-blue-800">Share this listing</h3>
                    <button 
                      onClick={toggleShareOptions}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <button 
                      onClick={() => shareOnSocial('whatsapp')}
                      className="flex flex-col items-center justify-center p-3 bg-green-100 rounded-lg hover:bg-green-200"
                    >
                      <WhatsApp size={24} className="text-green-600 mb-1" />
                      <span className="text-xs">WhatsApp</span>
                    </button>
                    
                    <button 
                      onClick={() => shareOnSocial('facebook')}
                      className="flex flex-col items-center justify-center p-3 bg-blue-100 rounded-lg hover:bg-blue-200"
                    >
                      <Facebook size={24} className="text-blue-600 mb-1" />
                      <span className="text-xs">Facebook</span>
                    </button>
                    
                    <button 
                      onClick={() => shareOnSocial('twitter')}
                      className="flex flex-col items-center justify-center p-3 bg-sky-100 rounded-lg hover:bg-sky-200"
                    >
                      <Twitter size={24} className="text-sky-500 mb-1" />
                      <span className="text-xs">Twitter</span>
                    </button>
                    
                    <button 
                      onClick={() => shareOnSocial('linkedin')}
                      className="flex flex-col items-center justify-center p-3 bg-blue-100 rounded-lg hover:bg-blue-200"
                    >
                      <Linkedin size={24} className="text-blue-700 mb-1" />
                      <span className="text-xs">LinkedIn</span>
                    </button>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="flex-1 truncate px-3 py-2 text-sm text-gray-600">
                        {window.location.href}
                      </div>
                      <button 
                        onClick={copyToClipboard}
                        className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 border-l"
                      >
                        {linkCopied ? (
                          <Check size={18} className="text-green-600" />
                        ) : (
                          <Copy size={18} />
                        )}
                      </button>
                    </div>
                    {linkCopied && (
                      <p className="text-xs text-green-600 mt-1">Link copied to clipboard!</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Seller Info */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-50 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Seller Information</h2>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {product.sellerImage ? (
                    <img
                      src={product.sellerImage}
                      alt={product.sellerName}
                      className="h-14 w-14 rounded-full"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xl font-medium text-gray-500">
                        {product.sellerName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">{product.sellerName}</p>
                  <p className="text-sm text-gray-500">{product.location.societyName}</p>
                  <div className="mt-1 flex items-center">
                    <CheckCircle size={14} className="text-green-500 mr-1" />
                    <span className="text-xs text-green-600">Verified Resident</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <Link 
                  href={`/Resident-dashboard/components/SellerProfile?id=${product.sellerId}`}
                  className="text-blue-600 text-sm hover:underline"
                >
                  View all listings from this seller
                </Link>
              </div>
            </div>
            
            {/* Similar Products Suggestion */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-50 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Safety Tips</h2>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  Meet seller at a safe public place
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  Check the item before you buy
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  Pay only after collecting the item
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetail; 