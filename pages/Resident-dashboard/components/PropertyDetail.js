import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

const {
  Heart, ArrowLeft, Share, Flag, MessageCircle, Send, Phone,
  Calendar, Tag, MapPin, Package, X, CheckCircle, Facebook,
  Twitter, Linkedin, Copy, Check, WhatsApp, Home
} = LucideIcons;

const PropertyDetail = () => {
  const router = useRouter();
  const { id } = router.query;

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [residentData, setResidentData] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    fetchResidentData();
  }, []);

  useEffect(() => {
    // Fetch property details when id is available
    if (id) {
      fetchPropertyDetails();
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

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Resident');
      const response = await axios.get(`/api/Property-Api/get-property?propertyId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setProperty(response.data);
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!residentData) {
      alert('Please login to like properties');
      return;
    }

    try {
      const token = localStorage.getItem('Resident');
      const response = await axios.post('/api/Property-Api/like-property',
        {
          propertyId: id,
          residentId: residentData._id
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      // Update property state with updated like status
      setProperty(prevProperty => {
        if (response.data.liked) {
          return {
            ...prevProperty,
            likes: [...prevProperty.likes, residentData._id]
          };
        } else {
          return {
            ...prevProperty,
            likes: prevProperty.likes.filter(likeId => likeId !== residentData._id)
          };
        }
      });
    } catch (error) {
      console.error('Error liking property:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!residentData) {
      alert('Please login to comment on properties');
      return;
    }

    if (!comment.trim()) {
      return;
    }

    try {
      setSubmittingComment(true);
      const token = localStorage.getItem('Resident');

      const response = await axios.post('/api/Property-Api/add-comment',
        {
          propertyId: id,
          residentId: residentData._id,
          residentName: residentData.name,
          residentImage: residentData.userImage,
          text: comment
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      // Update property state with new comments
      setProperty(prevProperty => ({
        ...prevProperty,
        comments: response.data.comments
      }));

      // Clear comment text
      setComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const isLikedByUser = () => {
    return residentData && property?.likes.includes(residentData._id);
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
    if (!property) return;

    const title = `Check out this property: ${property.title}`;
    const text = `${property.title} - ${formatPrice(property.price)}`;
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

    switch (platform) {
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

      // Wait for property and resident data to be loaded
      if (!residentData) {
        toast.error('Please wait while we load your profile');
        return;
      }

      if (!property) {
        toast.error('Please wait while we load the property details');
        return;
      }

      if (!property._id || !property.sellerId || !property.title) {
        toast.error('Invalid property data. Please refresh the page.');
        console.error('Invalid property data:', property);
        return;
      }

      // Don't allow contacting your own listing
      if (residentData._id === property.sellerId) {
        toast.error('This is your own listing');
        return;
      }

      // Format property details in a structured way
      const formattedPrice = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(property.price);

      const initialMessage = `
Title: ${property.title}
Details:
- Type: ${property.propertyType}
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
- Area: ${property.area} sq.ft
- Furnishing: ${property.furnishingStatus}
- Location: Block ${property.location.block}, Floor ${property.location.floor}, Flat ${property.location.flatNumber}
Price: ${formattedPrice}

I'm interested in this property. Would like to know more details.`;

      // Send initial interest message
      const response = await axios.post('/api/Property-Api/send-message', {
        propertyId: property._id,
        message: initialMessage,
        receiverId: property.sellerId
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('Message sent successfully!');
        // Navigate to chat
        router.push(`/Resident-dashboard/components/PropertyChat?buyerId=${property.sellerId}&propertyId=${property._id}`);
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 mx-auto mb-4 text-red-500">
            <X size={80} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Property Not Found</h1>
          <p className="text-gray-600 mb-6">
            Sorry, the property you're looking for doesn't exist or may have been removed.
          </p>
          <button
            onClick={goBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      {/* Header */}
      <div className="bg-white shadow-md py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="p-2">
            <button
              onClick={goBack}
              className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-base">Back</span>
            </button>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mt-2">
            {property.title}
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-64 md:h-80 lg:h-96 bg-gray-200">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[activeImageIndex]}
                    alt={property.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Home size={64} className="text-gray-400" />
                  </div>
                )}

                {/* Image Navigation buttons if multiple images */}
                {property.images && property.images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                    {property.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${activeImageIndex === index ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail images */}
              {property.images && property.images.length > 1 && (
                <div className="flex overflow-x-auto p-2 space-x-2">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${activeImageIndex === index ? 'border-blue-500' : 'border-transparent'
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

            {/* Price and Share Section - Moved here */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-blue-600">{formatPrice(property.price)}</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${property.status === 'Available' ? 'bg-green-100 text-green-800' :
                    property.status === 'Reserved' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  {property.status}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleLike}
                  className={`flex-1 py-3 rounded-lg border flex items-center justify-center ${isLikedByUser() ?
                      'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' :
                      'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  <Heart size={18} className="mr-2" fill={isLikedByUser() ? 'currentColor' : 'none'} />
                  {isLikedByUser() ? 'Liked' : 'Like'} ({property.likes ? property.likes.length : 0})
                </button>

                {/* Share button */}
                {hasNativeShare ? (
                  <button
                    onClick={() => shareOnSocial('native')}
                    className="flex-1 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
                  >
                    <Share size={18} className="mr-2" />
                    Share
                  </button>
                ) : (
                  <button
                    onClick={toggleShareOptions}
                    className="flex-1 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
                  >
                    <Share size={18} className="mr-2" />
                    Share
                  </button>
                )}
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

            {/* Property Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{property.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center">
                  <Home className="text-gray-500 mr-2" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Property Type</p>
                    <p className="text-sm font-medium">{property.propertyType}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Tag className="text-gray-500 mr-2" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Furnishing</p>
                    <p className="text-sm font-medium">{property.furnishingStatus}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPin className="text-gray-500 mr-2" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-sm font-medium">Block {property.location.block}, Floor {property.location.floor}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="text-gray-500 mr-2" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Posted On</p>
                    <p className="text-sm font-medium">{formatDate(property.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Package className="text-gray-500 mr-2" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Property Size</p>
                    <p className="text-sm font-medium">{property.size} sq ft</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Home className="text-gray-500 mr-2" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Bedrooms</p>
                    <p className="text-sm font-medium">{property.bedrooms} BHK</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Home className="text-gray-500 mr-2" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Bathrooms</p>
                    <p className="text-sm font-medium">{property.bathrooms}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Home className="text-gray-500 mr-2" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Parking</p>
                    <p className="text-sm font-medium">{property.parking ? 'Available' : 'Not Available'}</p>
                  </div>
                </div>

                {/* <div className="flex items-center">
                  <Home className="text-gray-500 mr-2" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Balcony</p>
                    <p className="text-sm font-medium">{property.balcony ? 'Yes' : 'No'}</p>
                  </div>
                </div> */}
              </div>

              {/* Additional Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-2 text-gray-700">
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Comments ({property.comments.length})
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
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-800">
                          {residentData?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow relative">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                    <button
                      type="submit"
                      disabled={!comment.trim() || submittingComment}
                      className={`absolute right-2 bottom-6 p-1.5 rounded-full ${!comment.trim() || submittingComment
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
                {property.comments.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageCircle size={36} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  property.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((comment, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        {comment.commenterImage || comment.residentImage ? (
                          <img
                            src={comment.commenterImage || comment.residentImage}
                            alt={comment.commenterName || comment.residentName}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-500">
                              {(comment.commenterName || comment.residentName)?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="bg-gray-50 rounded-lg px-4 py-3">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-medium text-sm text-gray-900">{comment.commenterName || comment.residentName}</p>
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-blue-600">{formatPrice(property.price)}</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${property.status === 'Available' ? 'bg-green-100 text-green-800' :
                    property.status === 'Reserved' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  {property.status}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Only show Contact Seller button if user is not the seller */}
                {residentData && property && residentData._id !== property.sellerId && (
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
                  className={`w-full py-3 rounded-lg border flex items-center justify-center ${isLikedByUser() ?
                      'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' :
                      'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  <Heart size={18} className="mr-2" fill={isLikedByUser() ? 'currentColor' : 'none'} />
                  {isLikedByUser() ? 'Liked' : 'Like'} ({property.likes ? property.likes.length : 0})
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Seller Information</h2>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {property.sellerImage ? (
                    <img
                      src={property.sellerImage}
                      alt={property.sellerName}
                      className="h-14 w-14 rounded-full"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xl font-medium text-gray-500">
                        {property.sellerName ? property.sellerName.charAt(0) : 'S'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">{property.sellerName}</p>
                  <p className="text-sm text-gray-500">{property.location.societyName}</p>
                  <div className="mt-1 flex items-center">
                    <CheckCircle size={14} className="text-green-500 mr-1" />
                    <span className="text-xs text-green-600">Verified Resident</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <Link
                  href={`/Resident-dashboard/components/SellerProfile?id=${property.sellerId}`}
                  className="text-blue-600 text-sm hover:underline"
                >
                  View all listings from this seller
                </Link>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Safety Tips</h2>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  Meet seller at a safe public place
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  Check the property before finalizing
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  Complete documentation properly
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail; 