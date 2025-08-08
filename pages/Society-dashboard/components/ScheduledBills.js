import React, { useState, useEffect } from 'react';
import { Clock, Plus, Filter, Calendar, AlertCircle, Check, X, Edit, Pause, Play, RefreshCw } from 'lucide-react';
import PreloaderSociety from '../../components/PreloaderSociety';
import { useRouter } from 'next/router';
import { usePermissions } from "../../../components/PermissionsContext";
import AccessDenied from "../widget/societyComponents/accessRestricted";
import ScheduledBillModal from '../../../components/Society/widgets/ScheduledBillModal';

export default function ScheduledBills() {
  const permissions = usePermissions();
  if (!permissions.includes("manage_bills") && !permissions.includes("full_access")) {
    return <AccessDenied />;
  }

  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [billHeads, setBillHeads] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    frequency: '',
    billHeadId: ''
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const router = useRouter();

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    if (!loading) {
      fetchScheduledBills();
    }
  }, [filters]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchScheduledBills(),
        fetchBillHeads()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledBills = async () => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // First get society details
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();

      if (!societyData.societyId) {
        throw new Error('Society ID not found in response');
      }

      // Build query params
      const queryParams = new URLSearchParams({
        societyId: societyData._id,
        ...(filters.status && { status: filters.status }),
        ...(filters.frequency && { frequency: filters.frequency }),
        ...(filters.billHeadId && { billHeadId: filters.billHeadId })
      });

      // Then fetch scheduled bills
      const response = await fetch(`/api/ScheduledBill-Api/get-scheduled-bills?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scheduled bills');
      }

      const data = await response.json();
      setBills(data.scheduledBills);
      setSummary(data.summary);
      setUpcomingBills(data.upcomingBills);
    } catch (error) {
      console.error('Error fetching scheduled bills:', error);
      showNotification('Failed to fetch scheduled bills', 'error');
    }
  };

  const fetchBillHeads = async () => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // First get society details
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();

      if (!societyData.societyId) {
        throw new Error('Society ID not found in response');
      }

      // Then fetch bill heads
      const response = await fetch(`/api/BillHead-Api/get-bill-heads?societyId=${societyData.societyId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bill heads');
      }

      const data = await response.json();
      // Filter to only show Maintenance and Amenity bill heads for scheduled bills
      const filteredBillHeads = data.data.filter(head => 
        head.category === 'Maintenance' || head.category === 'Amenity'
      );
      setBillHeads(filteredBillHeads);
    } catch (error) {
      console.error('Error fetching bill heads:', error);
      showNotification('Failed to fetch bill heads', 'error');
    }
  };

  const handleStatusChange = async (billId, newStatus) => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // Get society details first
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();

      const response = await fetch(`/api/ScheduledBill-Api/update-scheduled-bill?id=${billId}&societyId=${societyData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        showNotification(`Bill status updated to ${newStatus}`, 'success');
        fetchScheduledBills();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating bill status:', error);
      showNotification('Failed to update bill status', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  if (loading) {
    return <PreloaderSociety />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b-4 border-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <Clock className="mr-3" size={32} />
              Scheduled Bills
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-200 flex items-center"
            >
              <Plus className="mr-2" size={20} />
              New Schedule
            </button>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <p className="flex items-center">
            {notification.type === 'success' ? (
              <Check className="mr-2" size={20} />
            ) : (
              <AlertCircle className="mr-2" size={20} />
            )}
            {notification.message}
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Bills</h3>
              <p className="text-2xl font-bold text-gray-900">{summary?.total || 0}</p>
              <div className="mt-2 text-sm text-gray-500">
                Active: {summary?.active || 0} | Paused: {summary?.paused || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">By Frequency</h3>
              <div className="space-y-1">
                {Object.entries(summary?.byFrequency || {}).map(([freq, count]) => (
                  <div key={freq} className="flex justify-between text-sm">
                    <span>{freq}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">By Category</h3>
              <div className="space-y-1">
                {Object.entries(summary?.byCategory || {}).map(([category, count]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span>{category}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Upcoming Bills</h3>
              <div className="space-y-2">
                {upcomingBills.length > 0 ? (
                  upcomingBills.map((bill, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{bill.title}</div>
                      <div className="text-gray-500">
                        {new Date(bill.nextGenerationDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No upcoming bills in the next 7 days
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={filters.frequency}
                onChange={(e) => setFilters(prev => ({ ...prev, frequency: e.target.value }))}
              >
                <option value="">All Frequencies</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Yearly">Yearly</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill Head</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={filters.billHeadId}
                onChange={(e) => setFilters(prev => ({ ...prev, billHeadId: e.target.value }))}
              >
                <option value="">All Bill Heads</option>
                {/* Maintenance Bills */}
                {billHeads.filter(head => head.category === 'Maintenance').length > 0 && (
                  <optgroup label="Maintenance Bills">
                    {billHeads
                      .filter(head => head.category === 'Maintenance')
                      .map(head => (
                        <option key={head._id} value={head._id}>
                          {head.code} - {head.name}
                        </option>
                      ))
                    }
                  </optgroup>
                )}
                {/* Amenity Bills */}
                {billHeads.filter(head => head.category === 'Amenity').length > 0 && (
                  <optgroup label="Amenity Bills">
                    {billHeads
                      .filter(head => head.category === 'Amenity')
                      .map(head => (
                        <option key={head._id} value={head._id}>
                          {head.code} - {head.name}
                        </option>
                      ))
                    }
                  </optgroup>
                )}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', frequency: '', billHeadId: '' })}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200 flex items-center"
              >
                <RefreshCw className="mr-2" size={16} />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Head</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Generation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{bill.title}</div>
                      <div className="text-sm text-gray-500">{bill.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bill.billHeadId?.name}</div>
                      <div className="text-sm text-gray-500">{bill.billHeadId?.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bill.frequency}</div>
                      {bill.frequency === 'Custom' && (
                        <div className="text-sm text-gray-500">Every {bill.customFrequencyDays} days</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {bill.nextGenerationDate
                          ? new Date(bill.nextGenerationDate).toLocaleDateString()
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        bill.status === 'Active' ? 'bg-green-100 text-green-800' :
                        bill.status === 'Paused' ? 'bg-yellow-100 text-yellow-800' :
                        bill.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {bill.status === 'Active' && (
                        <button
                          onClick={() => handleStatusChange(bill._id, 'Paused')}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Pause"
                        >
                          <Pause size={20} />
                        </button>
                      )}
                      {bill.status === 'Paused' && (
                        <button
                          onClick={() => handleStatusChange(bill._id, 'Active')}
                          className="text-green-600 hover:text-green-900"
                          title="Resume"
                        >
                          <Play size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedBill(bill);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit size={20} />
                      </button>
                      {['Active', 'Paused'].includes(bill.status) && (
                        <button
                          onClick={() => handleStatusChange(bill._id, 'Cancelled')}
                          className="text-red-600 hover:text-red-900"
                          title="Cancel"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <ScheduledBillModal
          isOpen={true}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedBill(null);
          }}
          billHeads={billHeads}
          selectedBill={selectedBill}
          onSubmit={async (formData) => {
            try {
              const token = localStorage.getItem('Society');
              if (!token) {
                router.push('/societyLogin');
                return;
              }

              // First get society details
              const societyResponse = await fetch('/api/Society-Api/get-society-details', {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!societyResponse.ok) {
                throw new Error('Failed to fetch society details');
              }

              const societyData = await societyResponse.json();

              if (!societyData.societyId) {
                throw new Error('Society ID not found in response');
              }

              const response = await fetch(
                selectedBill
                  ? `/api/ScheduledBill-Api/update-scheduled-bill?id=${selectedBill._id}&societyId=${societyData.societyId}`
                  : '/api/ScheduledBill-Api/create-scheduled-bill',
                {
                  method: selectedBill ? 'PUT' : 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    ...formData,
                    societyId: societyData._id
                  })
                }
              );

              if (response.ok) {
                showNotification(
                  `Scheduled bill ${selectedBill ? 'updated' : 'created'} successfully`,
                  'success'
                );
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedBill(null);
                fetchScheduledBills();
              } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save scheduled bill');
              }
            } catch (error) {
              console.error('Error saving scheduled bill:', error);
              showNotification(error.message, 'error');
            }
          }}
        />
      )}
    </div>
  );
} 