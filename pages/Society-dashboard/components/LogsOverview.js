import React, { useEffect, useState } from 'react';
import PreloaderSociety from '../../components/PreloaderSociety';
import { Eye, Calendar, Filter, ChevronDown, ChevronUp, User, X, Shield, Clock, MapPin, Activity, AlertCircle } from 'lucide-react';
import Notification from '../../../components/Society/widgets/Notification';

// Helper to render action details
function renderActionDetails(log) {
  const { details, actionType } = log;

  // Handle bulk bill generation actions
  if (actionType && actionType.includes('BULK_BILLS_CREATE') && details && details.generatedBills) {
    return (
      <div>
        <div className="mb-4">
          <p className="font-medium text-sm text-gray-700">
            Successful Bills: {details.successfulBills || 0}
          </p>
          <p className="font-medium text-sm text-gray-700">
            Failed Bills: {details.failedBills || 0}
          </p>
          <p className="font-medium text-sm text-gray-700">
            Total Bills: {details.totalBills || 0}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Generated Bills:</h4>
          <div className="max-h-60 overflow-y-auto">
            <ul className="space-y-2">
              {details.generatedBills.map((bill, index) => (
                <li key={index} className="text-sm text-gray-700 bg-white p-2 rounded border">
                  <strong>Flat:</strong> {bill.flatNumber} | <strong>Owner:</strong> {bill.ownerName} | <strong>Amount:</strong> ₹{bill.totalAmount} | <strong>Bill No:</strong> {bill.billNumber}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Handle other action types - show raw details as fallback
  if (details && typeof details === 'object') {
    return (
      <div className="space-y-2">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="bg-white p-2 rounded border">
            <strong className="text-gray-600">{key}:</strong> 
            <span className="ml-2 text-gray-700">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-sm text-gray-500">No additional details available</p>;
}

// Helper to group logs by date range
function groupLogsByDate(logs) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfToday.getDate() - 1);
  const startOfLastWeek = new Date(startOfToday); startOfLastWeek.setDate(startOfToday.getDate() - 7);
  const startOfLastMonth = new Date(startOfToday); startOfLastMonth.setMonth(startOfToday.getMonth() - 1);
  const startOfLastYear = new Date(startOfToday); startOfLastYear.setFullYear(startOfToday.getFullYear() - 1);

  const groups = {
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
    lastYear: [],
  };

  logs.forEach(log => {
    const entry = new Date(log.timestamp);
    if (entry >= startOfToday) {
      groups.today.push(log);
    } else if (entry >= startOfYesterday) {
      groups.yesterday.push(log);
    } else if (entry >= startOfLastWeek) {
      groups.lastWeek.push(log);
    } else if (entry >= startOfLastMonth) {
      groups.lastMonth.push(log);
    } else if (entry >= startOfLastYear) {
      groups.lastYear.push(log);
    }
  });
  return groups;
}

export default function LogsOverview() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [filters, setFilters] = useState({ userRole: '', status: '', from: '', to: '' });
  const [openGroup, setOpenGroup] = useState(''); // which group is open (except today)
  const [selectedLog, setSelectedLog] = useState(null); // for detailed popup

  // Fetch logs when filters change
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts
    let timeoutId;

    const fetchLogs = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        const url = new URL('/api/logs/activity-logs', window.location.origin);
        if (filters.from) url.searchParams.append('startDate', filters.from);
        if (filters.to) url.searchParams.append('endDate', filters.to);
        if (filters.userRole) url.searchParams.append('userRole', filters.userRole);
        if (filters.status) url.searchParams.append('status', filters.status);
        
        // Debug: Log the URL being called
        console.log('API URL:', url.toString());
        console.log('Filters:', filters);

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('Society')}` },
        });

        if (!res.ok) throw new Error('Failed to fetch logs');
        const { data } = await res.json();
        
        if (isMounted) {
          setLogs(data.logs);
        }
      } catch (error) {
        if (isMounted) {
          setNotification({ show: true, message: error.message, type: 'error' });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Debounce the API call to prevent rapid successive calls
    timeoutId = setTimeout(fetchLogs, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Format date/time
  const formatDate = (date) => date ? new Date(date).toLocaleString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : 'N/A';

  // Group logs by date for accordion rendering
  const grouped = groupLogsByDate(logs);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b-4 border-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Activity Log
            </h1>
          </div>
        </div>
      </header>

      {/* Notification */}
      <Notification {...notification} />

      {/* Filters */}
      <div className="mx-auto py-4 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 mb-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Filter Logs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User Role Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                User Role
              </label>
              <select
                name="userRole"
                value={filters.userRole}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">All Roles</option>
                <option value="manager">Manager</option>
                <option value="accountant">Accountant</option>
                <option value="security_admin">Security Admin</option>
                <option value="maintenance_admin">Maintenance Admin</option>
                <option value="member">Member</option>
                <option value="resident">Resident</option>
                <option value="tenant">Tenant</option>
                <option value="family_member">Family Member</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="attempted">Attempted</option>
              </select>
            </div>

            {/* From Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                From Date
              </label>
              <input
                type="date"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>

            {/* To Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                To Date
              </label>
              <input
                type="date"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({ userRole: '', status: '', from: '', to: '' })}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Table */}
      <div className="mx-auto py-4 px-4">
        {loading ? (
          <PreloaderSociety />
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
            {/* Today log group (always open) */}
            <div className="border-b">
              <button className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-t-lg font-semibold text-blue-800 text-lg focus:outline-none cursor-default" disabled>
                <span className="flex items-center">
                  <Calendar className="mr-2 text-blue-600" size={20}/>Today
                </span>
                <span className="ml-2 text-xs bg-blue-200 text-blue-800 rounded-full px-2 py-0.5">{grouped.today.length}</span>
              </button>
              <div className="transition-all duration-300">
                {grouped.today.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {grouped.today.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {log.userName || log.userId}
                            <br />
                            <small className="text-gray-600">({log.userRole || 'Unknown'})</small>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{log.actionType}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {log.status === 'success' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Success</span>}
                            {log.status === 'failed' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Failed</span>}
                            {log.status === 'attempted' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Attempted</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-6 text-gray-500">No logs today.</div>
                )}
              </div>
            </div>
            {/* Other groups: yesterday, lastWeek, lastMonth, lastYear */}
            {[
              { key: 'yesterday', label: 'Yesterday', color: 'yellow', icon: <Calendar className="mr-2 text-yellow-600" size={20}/> },
              { key: 'lastWeek', label: 'Last Week', color: 'purple', icon: <Calendar className="mr-2 text-purple-600" size={20}/> },
              { key: 'lastMonth', label: 'Last Month', color: 'green', icon: <Calendar className="mr-2 text-green-600" size={20}/> },
              { key: 'lastYear', label: 'Last Year', color: 'gray', icon: <Calendar className="mr-2 text-gray-600" size={20}/> },
            ].map(group => (
              <div key={group.key} className="border-b">
                <button
                  className={`w-full flex items-center justify-between px-4 py-3 bg-${group.color}-50 hover:bg-${group.color}-100 font-semibold text-${group.color}-800 text-lg focus:outline-none transition-colors duration-200`}
                  onClick={() => setOpenGroup(openGroup === group.key ? '' : group.key)}
                >
                  <span className="flex items-center">{group.icon}{group.label}</span>
                  <span className="flex items-center">
                    <span className={`ml-2 text-xs bg-${group.color}-200 text-${group.color}-800 rounded-full px-2 py-0.5`}>{grouped[group.key].length}</span>
                    {openGroup === group.key ? <ChevronUp className="ml-2" size={18}/> : <ChevronDown className="ml-2" size={18}/>}
                  </span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${openGroup === group.key ? 'max-h-[2000px]' : 'max-h-0'}`}
                >
                  {openGroup === group.key && grouped[group.key].length > 0 && (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {grouped[group.key].map((log) => (
                          <tr key={log._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">{log.userId}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{log.actionType}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {log.status === 'success' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Success</span>}
                              {log.status === 'failed' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Failed</span>}
                              {log.status === 'attempted' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Attempted</span>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">{log.details?.description || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {openGroup === group.key && grouped[group.key].length === 0 && (
                    <div className="text-center py-6 text-gray-500">No logs in this range.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Log Popup */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Activity Log Details</h2>
                    <p className="text-sm text-gray-500">View detailed information about this activity</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
              <div className="grid grid-cols-12 gap-6">
                
                {/* Left Column - User Profile Section */}
                <div className="col-span-12 lg:col-span-4">
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                    <div className="flex flex-col items-center space-y-4">
                      
                      {/* Profile Image */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                          <User className="w-12 h-12 text-white" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                          selectedLog.status === 'success' ? 'bg-green-500' : 
                          selectedLog.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}>
                          <div className="w-3 h-3 rounded-full bg-white" />
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-gray-900">{selectedLog.userName || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-600 flex items-center justify-center">
                          <Shield className="w-3 h-3 mr-1" />
                          {selectedLog.userRole || 'Unknown Role'}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center justify-center">
                          <User className="w-3 h-3 mr-1" />
                          {selectedLog.userType || 'N/A'}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="w-full">
                        <div className={`w-full px-4 py-2 text-center text-sm font-medium rounded-md ${
                          selectedLog.status === 'success' ? 'bg-green-100 text-green-800' :
                          selectedLog.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedLog.status.charAt(0).toUpperCase() + selectedLog.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Details */}
                <div className="col-span-12 lg:col-span-8 space-y-5">
                  
                  {/* Action Details Card */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-base font-semibold text-gray-900 flex items-center">
                        <Activity className="h-4 w-4 text-gray-600 mr-2" />
                        Action Details
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1">Action Type</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedLog.actionType || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1">Timestamp</p>
                          <p className="text-sm font-semibold text-gray-900">{formatDate(selectedLog.timestamp)}</p>
                        </div>
                        {selectedLog.userType && (
                          <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 mb-1">User Type</p>
                            <p className="text-sm capitalize font-semibold text-gray-900">{selectedLog.userType}</p>
                          </div>
                        )}
                        {selectedLog.userId && (
                          <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 mb-1">User ID</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedLog.userId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Details Card */}
                  {(selectedLog.details || selectedLog.errorMessage || selectedLog.societyId) && (
                    <div className="bg-white rounded-lg border border-gray-200">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-base font-semibold text-gray-900 flex items-center">
                          <AlertCircle className="h-4 w-4 text-gray-600 mr-2" />
                          Additional Information
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* {selectedLog.societyId && (
                            <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                              <p className="text-xs font-medium text-gray-500 mb-1">Society ID</p>
                              <p className="text-sm font-semibold text-gray-900">{selectedLog.societyId}</p>
                            </div>
                          )} */}
                          {selectedLog.targetResource && (
                            <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                              <p className="text-xs font-medium text-gray-500 mb-1">Target Resource</p>
                              <p className="text-sm font-semibold text-gray-900">{selectedLog.targetResource}</p>
                            </div>
                          )}
                          {selectedLog.errorMessage && (
                            <div className="bg-red-50 rounded-md p-3 border border-red-100 md:col-span-2">
                              <p className="text-xs font-medium text-red-500 mb-1">Error Message</p>
                              <p className="text-sm font-semibold text-red-900">{selectedLog.errorMessage}</p>
                            </div>
                          )}
                          {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                            <div className="bg-blue-50 rounded-md p-3 border border-blue-100 md:col-span-2">
                              <p className="text-xs font-medium text-blue-500 mb-3">Action Details</p>
                              {renderActionDetails(selectedLog)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
