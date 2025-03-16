// pages/emergency-alerts.js
import React, { useState } from 'react';

export default function EmergencyAlerts() {
  // Define alert types with their corresponding colors and icons
  const alertTypes = [
    {
      id: 'emergency',
      name: 'Emergency',
      color: 'bg-red-600',
      textColor: 'text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'urgent',
      name: 'Urgent',
      color: 'bg-orange-500',
      textColor: 'text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'important',
      name: 'Important',
      color: 'bg-yellow-500',
      textColor: 'text-gray-900',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
      )
    },
    {
      id: 'info',
      name: 'Information',
      color: 'bg-blue-500',
      textColor: 'text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'success',
      name: 'Success/Resolved',
      color: 'bg-green-500',
      textColor: 'text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  // State for alerts
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'emergency',
      title: 'Fire Alarm in Block C',
      message: 'There is a fire alarm triggered in Block C. Please evacuate the building immediately and proceed to the designated assembly point. Emergency services have been notified.',
      createdAt: '2025-03-14T08:30:00',
      active: false,
      sentBy: 'System Admin'
    },
    {
      id: 2,
      type: 'urgent',
      title: 'Water Main Break',
      message: 'A water main break has been reported in the south wing. Maintenance is working on repairs. Please avoid the area and expect water service disruption for the next 2-3 hours.',
      createdAt: '2025-03-14T10:15:00',
      active: false,
      sentBy: 'Maintenance Supervisor'
    },
    {
      id: 3,
      type: 'important',
      title: 'Scheduled Power Outage',
      message: 'There will be a scheduled power outage tomorrow from 10:00 AM to 2:00 PM for electrical maintenance. Please plan accordingly.',
      createdAt: '2025-03-15T09:00:00',
      active: true,
      sentBy: 'Building Manager'
    },
    {
      id: 4,
      type: 'info',
      title: 'Pool Maintenance',
      message: 'The swimming pool will be closed for maintenance on Monday. We apologize for any inconvenience.',
      createdAt: '2025-03-15T14:20:00',
      active: true,
      sentBy: 'Amenities Manager'
    },
    {
      id: 5,
      type: 'success',
      title: 'Elevator Repairs Completed',
      message: 'The repairs on Elevator B have been completed. The elevator is now back in service. Thank you for your patience.',
      createdAt: '2025-03-16T11:45:00',
      active: true,
      sentBy: 'Maintenance Team'
    }
  ]);

  // State for creating new alert
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: alertTypes[0].id,
    title: '',
    message: '',
    sendEmail: true,
    sendPush: true,
    sendSMS: false
  });

  // User info (simulated)
  const currentUser = {
    name: 'Admin User',
    isAdmin: true
  };

  // Filter states
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'past'
  const [typeFilter, setTypeFilter] = useState('all');

  // Function to create new alert
  const handleCreateAlert = () => {
    if (!newAlert.title.trim() || !newAlert.message.trim()) return;

    const createdAlert = {
      id: alerts.length + 1,
      ...newAlert,
      createdAt: new Date().toISOString(),
      active: true,
      sentBy: currentUser.name
    };

    setAlerts([createdAlert, ...alerts]);
    setIsCreating(false);
    setNewAlert({
      type: alertTypes[0].id,
      title: '',
      message: '',
      sendEmail: true,
      sendPush: true,
      sendSMS: false
    });
  };

  // Function to delete alert
  const handleDeleteAlert = (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    }
  };

  // Function to toggle alert active status
  const handleToggleActive = (alertId) => {
    setAlerts(alerts.map(alert => {
      if (alert.id === alertId) {
        return { ...alert, active: !alert.active };
      }
      return alert;
    }));
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === 'active' && !alert.active) return false;
    if (activeFilter === 'past' && alert.active) return false;
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
    return true;
  });

  // Get alert type details
  const getAlertTypeDetails = (typeId) => {
    return alertTypes.find(type => type.id === typeId) || alertTypes[0];
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Emergency Alerts</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Actions */}
        {currentUser.isAdmin && (
          <div className="mb-8">
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Create New Alert
              </button>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Alert</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newAlert.type}
                      onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
                    >
                      {alertTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alert Title</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter alert title"
                      value={newAlert.title}
                      onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alert Message</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                      placeholder="Enter alert message"
                      value={newAlert.message}
                      onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notification Methods</label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="sendEmail"
                          checked={newAlert.sendEmail}
                          onChange={(e) => setNewAlert({ ...newAlert, sendEmail: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="sendEmail" className="ml-2 text-sm text-gray-700">Send Email</label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="sendPush"
                          checked={newAlert.sendPush}
                          onChange={(e) => setNewAlert({ ...newAlert, sendPush: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="sendPush" className="ml-2 text-sm text-gray-700">Send Push Notification</label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="sendSMS"
                          checked={newAlert.sendSMS}
                          onChange={(e) => setNewAlert({ ...newAlert, sendSMS: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="sendSMS" className="ml-2 text-sm text-gray-700">Send SMS</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <button
                      onClick={handleCreateAlert}
                      disabled={!newAlert.title.trim() || !newAlert.message.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                      Send Alert
                    </button>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="all">All Alerts</option>
              <option value="active">Active Alerts</option>
              <option value="past">Past Alerts</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {alertTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => {
              const alertType = getAlertTypeDetails(alert.type);
              return (
                <div key={alert.id} className={`${alert.active ? 'border-l-4' : 'border-l-0'} ${alert.active ? alertType.color : 'border-gray-200'} bg-white rounded-lg shadow overflow-hidden`}>
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center justify-center p-2 rounded-full ${alertType.color}`}>
                          {alertType.icon}
                        </span>
                        <span className="font-medium text-gray-900">{alertType.name}</span>
                        {!alert.active && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">Inactive</span>
                        )}
                      </div>
                      {currentUser.isAdmin && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleActive(alert.id)}
                            className="text-gray-500 hover:text-gray-700"
                            title={alert.active ? "Mark as Inactive" : "Mark as Active"}
                          >
                            {alert.active ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteAlert(alert.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete Alert"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="mt-3 text-lg font-medium text-gray-900">{alert.title}</h3>
                    <p className="mt-1 text-gray-600">{alert.message}</p>

                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <span>By {alert.sentBy} • {formatDate(alert.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">No alerts found matching your filters.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}