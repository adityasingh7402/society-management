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
  Twitter, Linkedin, Copy, Check, WhatsApp, Info, Star,
  Shield, Truck, RotateCcw, Award, Clock, Users, Eye, ArrowRight,
  ShoppingCart, Zap, Gift, BadgeCheck
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
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    fetchResidentData();
  }, []);

  useEffect(() => {
    if (id) {
      fetchProductDetails(id);
    }
  }, [id]);

  useEffect(() => {
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
      toast.error('Please login to like products');
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

      setProduct(prevProduct => {
        if (response.data.liked) {
          return {
            ...prevProduct,
            likes: [...prevProduct.likes, residentData._id]
          };
        } else {
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
      toast.error('Please login to comment on products');
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
      
      setProduct(prevProduct => ({
        ...prevProduct,
        comments: response.data.comments
      }));
      
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

  const toggleShareOptions = () => {
    setShowShare(!showShare);
  };

  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast.success('Link copied to clipboard!');
    });
  };

  const shareOnSocial = (platform) => {
    if (!product) return;
    
    const title = `Check out this listing: ${product.title}`;
    const text = `${product.title} - ${formatPrice(product.price)}`;
    const url = window.location.href;
    
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
    
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    
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

      if (residentData._id === product.sellerId) {
        toast.error('This is your own listing');
        return;
      }

      const formattedPrice = formatPrice(product.price);
      const initialMessage = `Hi, I'm interested in your product:\n\nTitle: ${product.title}\nPrice: ${formattedPrice}\nCategory: ${product.category}\nCondition: ${product.condition}`;

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
      <div className="min-h-screen bg-gray-50">
        {/* Amazon-style loading skeleton */}
        <div className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="px-4 py-6">
          <div className="w-full h-80 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="w-1/2 h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="space-y-2">
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-5/6 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-4/5 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-24 h-24 mx-auto mb-6 text-gray-400">
            <Package size={96} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist or may have been removed.
          </p>
          <button
            onClick={goBack}
            className="bg-orange-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Amazon-style Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={goBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-lg font-medium text-gray-800 truncate">Product Details</h1>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={hasNativeShare ? () => shareOnSocial('native') : toggleShareOptions}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Share size={20} className="text-gray-700" />
            </button>
            
            <button
              onClick={handleLike}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center space-x-1"
            >
              <Heart 
                size={20} 
                className={isLikedByUser() ? 'text-red-500' : 'text-gray-700'} 
                fill={isLikedByUser() ? 'currentColor' : 'none'} 
              />
              <span className="text-sm text-gray-600">{product.likes.length}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="pb-20">
        {/* Product Images */}
        <div className="bg-white mb-2">
          <div className="relative flex justify-center">
            <div className="w-80 h-80 bg-gray-100 rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[activeImageIndex]}
                  alt={product.title}
                  className="w-80 h-80 object-cover"
                />
              ) : (
                <div className="w-80 h-80 flex items-center justify-center">
                  <Package size={80} className="text-gray-300" />
                </div>
              )}
            </div>
            
            {/* Image indicators */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {product.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      activeImageIndex === index ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Status Badge */}
            <div className="absolute top-4 left-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                product.status === 'Available' ? 'bg-green-500 text-white' :
                product.status === 'Reserved' ? 'bg-yellow-500 text-white' :
                'bg-red-500 text-white'
              }`}>
                {product.status}
              </div>
            </div>
          </div>
          
          {/* Thumbnail scroll */}
          {product.images && product.images.length > 1 && (
            <div className="flex overflow-x-auto space-x-2 p-4 scrollbar-hide">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    activeImageIndex === index ? 'border-orange-500' : 'border-gray-200'
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

        {/* Product Info */}
        <div className="bg-white px-4 py-2 mb-2">
          <h1 className="text-xl font-medium text-gray-900 mb-3 leading-snug">
            {product.title}
          </h1>
          
          {/* Product Stats */}
          <div className="flex items-center mb-4">
            <span className="text-sm text-gray-600">{product.likes.length} likes</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-sm text-gray-600">{product.comments.length} reviews</span>
          </div>

          {/* Price */}
          <div className="mb-4">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-red-600">
                {formatPrice(product.price)}
              </span>
            </div>
          </div>

          {/* Product Condition */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-sm">
              <Award size={16} className="text-orange-600" />
              <span className="text-gray-700">{product.condition}</span>
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="bg-white px-4 py-2 mb-2">
          <h3 className="font-medium text-gray-900 mb-3">Location</h3>
          <div className="flex items-center space-x-3">
            <MapPin size={20} className="text-gray-500" />
            <div>
              <p className="font-medium text-gray-900">Available at</p>
              <p className="text-sm text-gray-600">{product.location.societyName}</p>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white px-4 py-2 mb-2">
          <h3 className="font-medium text-gray-900 mb-3">Product Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Category</span>
              <span className="text-gray-900">{product.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Condition</span>
              <span className="text-gray-900">{product.condition}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Posted on</span>
              <span className="text-gray-900">{formatDate(product.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white px-4 py-2 mb-2">
          <h3 className="font-medium text-gray-900 mb-3">About this item</h3>
          <div className="text-gray-700 text-sm leading-relaxed">
            {showFullDescription ? (
              <p className="whitespace-pre-line">{product.description}</p>
            ) : (
              <p className="whitespace-pre-line">
                {product.description.length > 200 
                  ? `${product.description.substring(0, 200)}...` 
                  : product.description}
              </p>
            )}
            {product.description.length > 200 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-blue-600 hover:underline mt-2 text-sm font-medium"
              >
                {showFullDescription ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        </div>

        {/* Seller Information */}
        <div className="bg-white px-4 py-2 mb-2">
          <h3 className="font-medium text-gray-900 mb-3">Seller Information</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {product.sellerImage ? (
                <img
                  src={product.sellerImage}
                  alt={product.sellerName}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-500">
                    {product.sellerName.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-gray-900">{product.sellerName}</p>
                  <BadgeCheck size={16} className="text-blue-500" />
                </div>
                <p className="text-sm text-gray-500">{product.location.societyName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white px-4 py-2 mb-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Customer Reviews ({product.comments.length})</h3>
          </div>
          
          {/* Review Summary */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Based on {product.comments.length} reviews</div>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-4">
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                {residentData?.userImage ? (
                  <img
                    src={residentData.userImage}
                    alt={residentData.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-500">
                      {residentData?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className="bg-orange-500 text-white px-4 py-1 rounded-md text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? 'Posting...' : 'Post Review'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {product.comments.length === 0 ? (
              <div className="text-center py-6">
                <MessageCircle size={40} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              product.comments.slice(0, 3).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((comment, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      {comment.commenterImage ? (
                        <img
                          src={comment.commenterImage}
                          alt={comment.commenterName}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-500">
                            {comment.commenterName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-sm text-gray-900">{comment.commenterName}</p>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Share Modal */}
        <AnimatePresence>
          {showShare && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center"
              onClick={toggleShareOptions}
            >
              <motion.div
                initial={{ y: 300, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 300, opacity: 0 }}
                className="bg-white w-full max-w-md mx-4 rounded-t-2xl sm:rounded-2xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Share this product</h3>
                  <button 
                    onClick={toggleShareOptions}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <button 
                    onClick={() => shareOnSocial('whatsapp')}
                    className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                  >
                    <WhatsApp size={32} className="text-green-600 mb-2" />
                    <span className="text-xs font-medium text-gray-700">WhatsApp</span>
                  </button>
                  
                  <button 
                    onClick={() => shareOnSocial('facebook')}
                    className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Facebook size={32} className="text-blue-600 mb-2" />
                    <span className="text-xs font-medium text-gray-700">Facebook</span>
                  </button>
                  
                  <button 
                    onClick={() => shareOnSocial('twitter')}
                    className="flex flex-col items-center justify-center p-4 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors"
                  >
                    <Twitter size={32} className="text-sky-500 mb-2" />
                    <span className="text-xs font-medium text-gray-700">Twitter</span>
                  </button>
                  
                  <button 
                    onClick={copyToClipboard}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {linkCopied ? (
                      <Check size={32} className="text-green-600 mb-2" />
                    ) : (
                      <Copy size={32} className="text-gray-600 mb-2" />
                    )}
                    <span className="text-xs font-medium text-gray-700">
                      {linkCopied ? 'Copied!' : 'Copy Link'}
                    </span>
                  </button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                      <p className="text-xs text-gray-500 truncate">{window.location.href}</p>
                    </div>
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      {product.images && product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="flex items-center space-x-3">
          {residentData && product && residentData._id !== product.sellerId ? (
            <>
              <button
                onClick={handleLike}
                className={`flex-shrink-0 p-3 rounded-xl border-2 transition-all flex items-center space-x-2 ${
                  isLikedByUser() 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <Heart 
                  size={20} 
                  className={isLikedByUser() ? 'text-red-500' : 'text-gray-600'} 
                  fill={isLikedByUser() ? 'currentColor' : 'none'} 
                />
                <span className="text-sm font-medium text-gray-600">{product.likes.length}</span>
              </button>
              
              <button
                onClick={handleContactSeller}
                className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-500 hover:to-orange-600 transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <MessageCircle size={20} />
                <span>Contact Seller</span>
              </button>
            </>
          ) : (
            <div className="flex-1 bg-gray-100 text-gray-500 py-3 px-6 rounded-xl font-semibold text-center">
              {residentData && product && residentData._id === product.sellerId 
                ? 'This is your listing' 
                : 'Please log in to contact seller'
              }
            </div>
          )}
        </div>
        
      </div>

      {/* Add some padding at bottom to account for fixed action bar */}
      <div className="h-32"></div>
    </div>
  );
};

export default ProductDetail;