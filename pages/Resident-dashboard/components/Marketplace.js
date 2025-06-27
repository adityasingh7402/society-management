import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Plus, Filter, Search, Tag, ShoppingCart, Bell, ArrowLeft, Heart, MessageCircle, Trash2, AlertTriangle, X, ChevronDown, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';
import { toast } from 'react-hot-toast';

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

const Marketplace = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [residentData, setResidentData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    condition: '',
    minPrice: '',
    maxPrice: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [formattedProducts, setFormattedProducts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [myListings, setMyListings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      fetchResidentData();
    }
  }, [router.isReady]);

  useEffect(() => {
    if (residentData) {
      fetchProducts(residentData.societyId);
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
    // Function to set active tab from hash
    const setTabFromHash = () => {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      if (['all', 'my-listings', 'responses'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    // Set initial tab from URL hash
    setTabFromHash();

    // Listen for hash changes
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
      
      // Fetch products after resident data is loaded
      if (data.societyId) {
      fetchProducts(data.societyId);
      }
    } catch (error) {
      toast.error('Error fetching resident details');
    }
  };

  const fetchUnreadMessageCounts = async () => {
    try {
      const token = localStorage.getItem('Resident');
      const response = await axios.get('/api/Product-Api/get-unread-counts', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setUnreadMessages(response.data);
    } catch (error) {
      toast.error('Error fetching message counts');
    }
  };

  const fetchProducts = async (societyId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Resident');
      const response = await axios.get('/api/Product-Api/product', {
        params: { societyId: societyId },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setProducts(response.data);
      setFormattedProducts(response.data);
    } catch (error) {
      toast.error('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    router.push('/Resident-dashboard/components/AddProduct');
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
    let filtered = [...products];

    // Apply search query
    if (search) {
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(search.toLowerCase()) || 
        product.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply category filter
    if (filterValues.category) {
      filtered = filtered.filter(product => product.category === filterValues.category);
    }

    // Apply condition filter
    if (filterValues.condition) {
      filtered = filtered.filter(product => product.condition === filterValues.condition);
    }

    // Apply price filters
    if (filterValues.minPrice) {
      filtered = filtered.filter(product => product.price >= parseFloat(filterValues.minPrice));
    }

    if (filterValues.maxPrice) {
      filtered = filtered.filter(product => product.price <= parseFloat(filterValues.maxPrice));
    }

    setFormattedProducts(filtered);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      condition: '',
      minPrice: '',
      maxPrice: ''
    });
    setSearchQuery('');
    setFormattedProducts(products);
    setShowFilters(false);
  };

  const handleLike = async (productId) => {
    if (!residentData) {
      toast.error('Please login to like products');
      return;
    }

    try {
      const token = localStorage.getItem('Resident');
      const response = await axios.post('/api/Product-Api/like-product', 
        {
          productId,
          residentId: residentData._id
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      // Update products state with updated like status
      const updateProducts = (prevProducts) => 
        prevProducts.map(product => 
          product._id === productId 
            ? { 
                ...product, 
                likes: response.data.liked 
                  ? [...product.likes, residentData._id]
                  : product.likes.filter(id => id !== residentData._id)
              } 
            : product
        );

      setProducts(updateProducts);
      setFormattedProducts(updateProducts);

      toast.success(response.data.liked ? 'Product liked' : 'Product unliked');
    } catch (error) {
      toast.error('Error liking product');
    }
  };

  const isLikedByUser = (product) => {
    return residentData && product.likes.includes(residentData._id);
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

  const handleDeleteProduct = async (productId) => {
    try {
      const token = localStorage.getItem('Resident');
      
      await axios.delete(`/api/Product-Api/delete-product?productId=${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      setProducts(prevProducts => prevProducts.filter(product => product._id !== productId));
      setFormattedProducts(prevProducts => prevProducts.filter(product => product._id !== productId));
      
      setShowDeleteModal(false);
      setProductToDelete(null);
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const openDeleteModal = (e, product) => {
    e.stopPropagation();
    e.preventDefault();
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const getMyListings = () => {
    if (!residentData) return [];
    return products.filter(product => product.sellerId === residentData._id);
  };

  const handleTabChange = (tabId) => {
    window.location.hash = tabId;
    setActiveTab(tabId);
    if (tabId === 'my-listings') {
      setFormattedProducts(getMyListings());
    } else if (tabId === 'all') {
      setFormattedProducts(products);
    } else if (tabId === 'responses') {
      fetchMessages(); // Fetch messages when switching to responses tab
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

      // Get all messages for the user
      const response = await axios.get('/api/Product-Api/get-messages', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      // Reset unread messages state
      setUnreadMessages({});
      
      // Group messages by unique conversation (product + other user combination)
      const conversations = {};
      const unreadCounts = {};

      response.data.forEach(msg => {
        const isUserSender = msg.senderId === residentData._id;
        const otherUserId = isUserSender ? msg.receiverId : msg.senderId;
        const conversationKey = `${msg.productId}-${otherUserId}`;
        
        // Only update the conversation if this message is newer
        if (!conversations[conversationKey] || 
            new Date(msg.createdAt) > new Date(conversations[conversationKey].createdAt)) {
          conversations[conversationKey] = {
            otherUser: {
              id: otherUserId,
              name: isUserSender ? msg.receiverName : msg.senderName,
              image: isUserSender ? msg.receiverImage : msg.senderImage
            },
            product: {
              id: msg.productId,
              title: msg.productTitle
            },
            message: msg.message,
            createdAt: msg.createdAt,
            isUserSender
          };
        }

        // Track unread messages per product
        if (!msg.isRead && msg.receiverId === residentData._id) {
          if (!unreadCounts[msg.productId]) {
            unreadCounts[msg.productId] = 0;
          }
          unreadCounts[msg.productId]++;
        }
      });

      // Update unread counts state
      setUnreadMessages(unreadCounts);
      
      // Convert to array and sort by latest message
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

  // Add effect to handle initial loading of messages when on responses tab
  useEffect(() => {
    const loadMessages = async () => {
      if (activeTab === 'responses' && residentData?._id) {
        await fetchMessages();
      }
    };
    loadMessages();
  }, [activeTab, residentData]);

  // Filter products based on active tab
  const getFilteredProducts = () => {
    if (activeTab === 'my-listings') {
      return formattedProducts.filter(prop => prop.sellerId === residentData?._id);
    } else if (activeTab === 'responses') {
      if (messagesLoading) {
        return []; // Return empty array while loading
      }
      return messages;
    } else {
      // Show all products in the Products tab
      return formattedProducts;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Head>
        <style>{animationStyles}</style>
      </Head>
      
      {/* Header */}
      <div className="bg-white z-20 shadow-md py-4 sticky top-0">
        <div className="max-w-6xl mx-auto px-4">
          <div className="p-2">
            <button
              onClick={() => router.push('/Resident-dashboard')}
              className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-base">Back</span>
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-2xl font-bold text-gray-800">Marketplace</h1>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
              >
                <Plus size={24} className="" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex mt-6 border-b">
            <button
              onClick={() => handleTabChange('all')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'all'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => handleTabChange('my-listings')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'my-listings'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Listings
            </button>
            <button
              onClick={() => handleTabChange('responses')}
              className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center relative ${
                activeTab === 'responses'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Bell width={20} height={20}/>
                {Object.values(unreadMessages).reduce((a, b) => a + b, 0) > 0 && 
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {Object.values(unreadMessages).reduce((a, b) => a + b, 0)}
                  </span>
                }
              </div>
            </button>
          </div>

          {/* Search and Filter - Only show for 'all' and 'my-listings' tabs */}
          {activeTab !== 'responses' && (
            <>
          <div className="mt-4 flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search products..."
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
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : getFilteredProducts().length === 0 && !messagesLoading ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'responses' ? 'No messages yet' : 'No products found'}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'my-listings'
                ? "You haven't listed any products yet"
                : activeTab === 'responses'
                ? "When you receive messages about products, they'll appear here"
                : "There are no products available in your society yet"}
            </p>
            {activeTab !== 'responses' && (
              <button
                onClick={handleAddNew}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="h-5 w-5 mr-2" />
                List a Product
              </button>
            )}
          </div>
        ) : (
          <div className="w-full mx-auto px-1 mt-3">
            {activeTab === 'responses' ? (
              // Messages View
              <div className="bg-white rounded-lg shadow">
                {messagesLoading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No messages yet</h2>
                    <p className="text-gray-500">When you receive messages about products, they'll appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {messages.map((conversation) => {
                      const { otherUser, product, message, createdAt } = conversation;
                      
                      return (
                        <Link
                          key={`${product.id}-${otherUser.id}`}
                          href={`/Resident-dashboard/components/ProductChat?buyerId=${otherUser.id}&productId=${product.id}`}
                          className="block p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            {otherUser.image ? (
                              <img src={otherUser.image} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium">{otherUser.name?.[0]}</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-gray-900">{otherUser.name}</h3>
                                <span className="text-sm text-gray-500">
                                  {new Date(createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{product.title}</p>
                              <p className="text-sm text-gray-500 mt-1">{truncateMessage(message)}</p>
                            </div>
                            {unreadMessages[product.id] > 0 && (
                              <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                                {unreadMessages[product.id]}
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Regular Products Grid
              <div className="grid grid-cols-2 gap-1 auto-rows-fr">
                {getFilteredProducts().map((product, index) => (
                  <Link 
                    key={product._id} 
                    href={`/Resident-dashboard/components/ProductDetail?id=${product._id}`}
                    className="block bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition-all duration-300 cursor-pointer h-full transform hover:-translate-y-1"
                    style={{ order: index + 1 }}
                  >
                    {/* Product Image */}
                    <div className="relative w-full h-40">
                      {/* Delete button - only show for the product owner */}
                      {residentData && product.sellerId === residentData._id && (
                        <button 
                          onClick={(e) => openDeleteModal(e, product)} 
                          className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-md hover:bg-red-100 transition-colors z-10"
                          title="Delete product"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      )}
                      
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Tag size={28} className="text-gray-400" />
                        </div>
                      )}
                      
                      {/* Status Tag */}
                      <div className="absolute top-2 left-2 px-3 py-1 text-xs font-medium rounded-full bg-green-500 text-white">
                        Available
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-3">
                      <h3 className="text-base font-semibold text-gray-800 hover:text-blue-600 line-clamp-1">
                        {product.title}
                      </h3>
                      
                      <div className="mt-1">
                        <span className="text-lg font-bold text-blue-600">₹{formatPrice(product.price)}</span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                        <div className="flex items-center text-gray-600">
                          <span>{product.category}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <span>{product.condition}</span>
                        </div>
                      </div>
                      
                      <p className="mt-1.5 text-xs text-gray-600 line-clamp-2">{product.description}</p>
                      
                      {/* Seller Info */}
                      <div className="mt-2 flex items-center justify-between border-t pt-2">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {product.sellerImage ? (
                              <img
                                src={product.sellerImage}
                                alt={product.sellerName}
                                className="h-5 w-5 rounded-full"
                              />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-500">
                                  {product.sellerName.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-1.5">
                            <p className="text-xs text-gray-500 line-clamp-1">{product.sellerName}</p>
                            <p className="text-[10px] text-gray-400">{formatDate(product.createdAt)}</p>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => handleLike(product._id)}
                            className={`flex items-center space-x-1 ${
                              isLikedByUser(product) ? 'text-red-500' : 'text-gray-500'
                            }`}
                          >
                            <Heart size={12} fill={isLikedByUser(product) ? 'currentColor' : 'none'} />
                            <span className="text-[10px]">{product.likes.length}</span>
                          </button>
                          {unreadMessages[product._id] > 0 && (
                            <div className="flex items-center space-x-1">
                              <MessageCircle size={12} className="text-blue-500" />
                              <span className="text-[10px] text-blue-500 font-medium">
                                {unreadMessages[product._id]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Modal */}
          {showFilters && (
            <div className="mt-4 bg-white p-4 border rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Books">Books</option>
                    <option value="Sports">Sports</option>
                    <option value="Home Appliances">Home Appliances</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Condition</label>
                  <select
                    name="condition"
                    value={filters.condition}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Condition</option>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
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
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg max-w-md w-full p-5 transform transition-all animate-fade-in-up"
            style={{animation: 'fadeInUp 0.3s ease-out'}}
          >
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Product</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <span className="font-medium">"{productToDelete.title}"</span>? 
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
                onClick={() => handleDeleteProduct(productToDelete._id)}
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

export default Marketplace; 