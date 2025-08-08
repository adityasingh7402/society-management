import React, { useState, useEffect } from 'react';
import PreloaderSociety from '../../components/PreloaderSociety';
import { Building, CreditCard, Search, Filter, Eye, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/router';
import { usePermissions } from "../../../components/PermissionsContext";
import AccessDenied from "../widget/societyComponents/accessRestricted";
import PaymentDetailsPopup from '../../../components/Society/widgets/PaymentDetailsPopup';

export default function PaymentTracking() {
  const router = useRouter();
  const permissions = usePermissions();
  if (!permissions.includes("manage_bills") && !permissions.includes("full_access")) {
    return <AccessDenied />;
  }
  
  // State management
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({});
  const [filterOptions, setFilterOptions] = useState({ blocks: [], floors: [] });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [societyId, setSocietyId] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    billType: 'all',
    paymentMode: 'all',
    block: 'all',
    floor: 'all',
    fromDate: '',
    toDate: '',
    residentMobile: '',
    residentName: '',
    flatNumber: ''
  });

  // Fetch society details first
  const fetchSocietyDetails = async () => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return null;
      }

      const response = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch society details');
      }

      const data = await response.json();
      if (data._id) {
        setSocietyId(data._id);
        return data._id;
      } else {
        throw new Error('Society ID not found');
      }
    } catch (error) {
      console.error('Error fetching society details:', error);
      setNotificationWithTimeout('Failed to fetch society details', 'error');
      return null;
    }
  };

  // Fetch payment records
  const fetchPaymentRecords = async (page = 1, currentSocietyId = societyId) => {
    if (!currentSocietyId) {
      console.log('Society ID not available yet, waiting...');
      return;
    }

    setLoading(true);
    try {
      // Build query parameters with filters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        societyId: currentSocietyId,
        ...(filters.billType && filters.billType !== 'all' && { billType: filters.billType }),
        ...(filters.paymentMode && filters.paymentMode !== 'all' && { paymentMode: filters.paymentMode }),
        ...(filters.block && filters.block !== 'all' && { block: filters.block }),
        ...(filters.floor && filters.floor !== 'all' && { floor: filters.floor }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        ...(filters.residentMobile && { residentMobile: filters.residentMobile }),
        ...(filters.residentName && { residentName: filters.residentName }),
        ...(filters.flatNumber && { flatNumber: filters.flatNumber })
      });

      const response = await fetch(`/api/PaymentEntry-Api/getPaymentRecords?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('Society')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment records');
      }

      const data = await response.json();
      if (data.success) {
        setPayments(data.data.payments);
        setSummary(data.data.summary);
        setPagination(data.data.pagination);
        setFilterOptions(data.data.filterOptions);
      } else {
        throw new Error(data.message || 'Failed to fetch payment records');
      }
    } catch (error) {
      console.error('Error fetching payment records:', error);
      setNotificationWithTimeout('Failed to fetch payment records', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Notification helper
  const setNotificationWithTimeout = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchPaymentRecords(1);
  };

  // Reset filters
  const resetFilters = () => {
    const defaultFilters = {
      billType: 'all',
      paymentMode: 'all',
      block: 'all',
      floor: 'all',
      fromDate: '',
      toDate: '',
      residentMobile: '',
      residentName: '',
      flatNumber: ''
    };
    setFilters(defaultFilters);
    // Fetch data with default filters
    fetchPaymentRecords(1);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchPaymentRecords(newPage);
  };

  // Handle payment details view
  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  // Close payment details
  const closePaymentDetails = () => {
    setShowPaymentDetails(false);
    setSelectedPayment(null);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get payment mode icon
  const getPaymentModeIcon = (mode) => {
    switch (mode) {
      case 'Cash': return '💵';
      case 'UPI': return '📱';
      case 'Bank Transfer':
      case 'NEFT':
      case 'RTGS': return '🏦';
      case 'Card': return '💳';
      case 'Cheque': return '📋';
      default: return '💰';
    }
  };

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      const fetchedSocietyId = await fetchSocietyDetails();
      if (fetchedSocietyId) {
        // Call fetchPaymentRecords directly with the fetched societyId
        await fetchPaymentRecords(1, fetchedSocietyId);
      }
    };
    initializeComponent();
  }, []);

  return (
    <div>
      {loading ? (
        <PreloaderSociety />
      ) : (
        <div className="min-h-screen bg-gray-100">
          <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                  <CreditCard className="mr-3" size={32} />
                  Payment Tracking
                </h1>
                <div className="text-white text-sm">
                  <span>Total Payments: {pagination.totalCount || 0}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto px-4 py-8">
            {/* Summary Cards */}
            {summary && Object.keys(summary).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Total Amount</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(summary.totalAmount || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Total Payments</h3>
                      <p className="text-2xl font-bold text-blue-600">{summary.totalPayments || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Avg Payment</h3>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(summary.avgPaymentAmount || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <Calendar className="w-8 h-8 text-orange-600" />
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
                      <p className="text-2xl font-bold text-orange-600">
                        {payments.filter(p => {
                          const paymentDate = new Date(p.paymentDate);
                          const now = new Date();
                          return paymentDate.getMonth() === now.getMonth() && 
                                 paymentDate.getFullYear() === now.getFullYear();
                        }).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Advanced Filters
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Bill Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill Type</label>
                  <select
                    value={filters.billType}
                    onChange={(e) => handleFilterChange('billType', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="MaintenanceBill">Maintenance</option>
                    <option value="UtilityBill">Utility</option>
                    <option value="AmenityBill">Amenity</option>
                  </select>
                </div>

                {/* Payment Mode Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={filters.paymentMode}
                    onChange={(e) => handleFilterChange('paymentMode', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Modes</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Card">Card</option>
                    <option value="Wallet">Wallet</option>
                  </select>
                </div>

                {/* Block Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                  <select
                    value={filters.block}
                    onChange={(e) => handleFilterChange('block', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Blocks</option>
                    {filterOptions.blocks.map(block => (
                      <option key={block} value={block}>{block}</option>
                    ))}
                  </select>
                </div>

                {/* Flat Number Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flat Number</label>
                  <input
                    type="text"
                    placeholder="Search by flat..."
                    value={filters.flatNumber}
                    onChange={(e) => handleFilterChange('flatNumber', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Floor Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                  <select
                    value={filters.floor}
                    onChange={(e) => handleFilterChange('floor', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Floors</option>
                    {filterOptions.floors.map(floor => (
                      <option key={floor} value={floor}>{floor}</option>
                    ))}
                  </select>
                </div>

                {/* Resident Mobile Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="Search by mobile..."
                    value={filters.residentMobile}
                    onChange={(e) => handleFilterChange('residentMobile', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Resident Name Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resident Name</label>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={filters.residentName}
                    onChange={(e) => handleFilterChange('residentName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Date Range Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Records Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Payment Records</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {payments.length} of {pagination.totalCount} payments
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resident
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bill Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.residentDetails?.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.residentDetails?.flatNumber || 'N/A'} • {payment.residentDetails?.phone || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </div>
                          {payment.billDetails?.billNumber && (
                            <div className="text-xs text-gray-500">
                              Bill: {payment.billDetails.billNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{getPaymentModeIcon(payment.paymentMode)}</span>
                            <span className="text-sm text-gray-900">{payment.paymentMode}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {payment.billType?.replace('Bill', '') || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        pagination.hasPrev
                          ? 'text-gray-700 bg-white hover:bg-gray-50'
                          : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        pagination.hasNext
                          ? 'text-gray-700 bg-white hover:bg-gray-50'
                          : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                        <span className="font-medium">{pagination.totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={!pagination.hasPrev}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            pagination.hasPrev
                              ? 'text-gray-500 hover:bg-gray-50'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={!pagination.hasNext}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            pagination.hasNext
                              ? 'text-gray-500 hover:bg-gray-50'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* Payment Details Popup */}
          {showPaymentDetails && selectedPayment && (
            <PaymentDetailsPopup
              payment={selectedPayment}
              onClose={closePaymentDetails}
            />
          )}

          {/* Notification */}
          {notification.show && (
            <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            } text-white`}>
              {notification.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}