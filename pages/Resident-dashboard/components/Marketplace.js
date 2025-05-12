import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Plus, Filter, Search, Tag, ShoppingCart, X, ChevronDown, Heart, MessageCircle, RefreshCw, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    fetchResidentData();
  }, []);

  const fetchResidentData = async () => {
    try {
      const token = localStorage.getItem('Resident');
      if (!token) {
        router.push('/Login');
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
      fetchProducts(data.societyId);
    } catch (error) {
      console.error('Error fetching resident details:', error);
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
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (residentData?.societyId) {
      fetchProducts(residentData.societyId);
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

  const applyFilters = () => {
    let filtered = [...products];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Apply condition filter
    if (filters.condition) {
      filtered = filtered.filter(product => product.condition === filters.condition);
    }

    // Apply price filters
    if (filters.minPrice) {
      filtered = filtered.filter(product => product.price >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(product => product.price <= parseFloat(filters.maxPrice));
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
      alert('Please login to like products');
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
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === productId 
            ? { 
                ...product, 
                likes: response.data.liked 
                  ? [...product.likes, residentData._id]
                  : product.likes.filter(id => id !== residentData._id)
              } 
            : product
        )
      );

      // Also update formatted products
      setFormattedProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === productId 
            ? { 
                ...product, 
                likes: response.data.liked 
                  ? [...product.likes, residentData._id]
                  : product.likes.filter(id => id !== residentData._id)
              } 
            : product
        )
      );
    } catch (error) {
      console.error('Error liking product:', error);
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
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const token = localStorage.getItem('Resident');
      
      const response = await axios.delete(`/api/Product-Api/delete-product?productId=${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      // Remove the deleted product from both states
      setProducts(prevProducts => prevProducts.filter(product => product._id !== productId));
      setFormattedProducts(prevProducts => prevProducts.filter(product => product._id !== productId));
      
      // Close modal
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const openDeleteModal = (e, product) => {
    e.stopPropagation(); // Prevent triggering the parent click
    e.preventDefault(); // Prevent link navigation
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const goBack = () => {
    router.push('/Resident-dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading products...</p>
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
      <div className="bg-white shadow-md py-4 px-6 sticky top-0 z-10">
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
            <h1 className="text-2xl font-bold text-gray-800">Marketplace</h1>
            <div className="flex items-center space-x-2">
              {/* <button 
                onClick={handleRefresh}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              >
                <RefreshCw size={20} />
              </button> */}
              <button 
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} className="mr-1" />
                <span>List Product</span>
              </button>
            </div>
          </div>

          {/* Search and Filter */}
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

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 bg-white p-4 border rounded-lg shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700">Min Price (₹)</label>
                  <input
                    type="number"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    placeholder="Min"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Max Price (₹)</label>
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    placeholder="Max"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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

      {/* Products Display */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        {formattedProducts.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No products found</h2>
            <p className="text-gray-500 mb-4">There are no products available in your society right now.</p>
            <button
              onClick={handleAddNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Be the first to list a product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formattedProducts.map((product) => (
              <Link 
                key={product._id} 
                href={`/Resident-dashboard/components/ProductDetail?id=${product._id}`}
                className="block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-200">
                  {/* Delete button - only show for the product owner */}
                  {residentData && product.sellerId === residentData._id && (
                    <button 
                      onClick={(e) => openDeleteModal(e, product)} 
                      className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-md hover:bg-red-100 transition-colors z-10"
                      title="Delete product"
                    >
                      <Trash2 size={18} className="text-red-500" />
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
                      <Tag size={48} className="text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Tag */}
                  {product.status !== 'Available' && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 text-xs font-semibold rounded">
                      {product.status}
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 line-clamp-1">{product.title}</h3>
                  
                  <div className="mt-1">
                    <span className="text-xl font-bold text-blue-600">{formatPrice(product.price)}</span>
                  </div>
                  
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span className="mr-2">Condition:</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      product.condition === 'New' ? 'bg-green-100 text-green-800' :
                      product.condition === 'Like New' ? 'bg-emerald-100 text-emerald-800' :
                      product.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                      product.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.condition}
                    </span>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  
                  {/* Seller Info */}
                  <div className="mt-3 flex items-center">
                    <div className="flex-shrink-0">
                      {product.sellerImage ? (
                        <img
                          src={product.sellerImage}
                          alt={product.sellerName}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-500">
                            {product.sellerName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-2">
                      <p className="text-xs text-gray-500">Posted by</p>
                      <p className="text-sm font-medium text-gray-700">{product.sellerName}</p>
                    </div>
                    <div className="ml-auto text-xs text-gray-500">
                      {formatDate(product.createdAt)}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <button 
                      className={`flex items-center space-x-1 ${
                        isLikedByUser(product) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                      }`}
                      onClick={(e) => {
                        e.preventDefault(); // Prevent navigation to product detail
                        e.stopPropagation(); // Prevent event bubbling
                        handleLike(product._id);
                      }}
                    >
                      <Heart size={18} fill={isLikedByUser(product) ? 'currentColor' : 'none'} />
                      <span>{product.likes.length}</span>
                    </button>
                    
                    <div className="flex items-center space-x-1 text-gray-500">
                      <MessageCircle size={18} />
                      <span>{product.comments.length}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
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