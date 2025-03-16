// pages/incident-logs.js
import React, { useState } from 'react';

export default function IncidentLogs() {
  // Alert categories with their corresponding colors and icons
  const alertCategories = [
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
      id: 'medium',
      name: 'Medium',
      color: 'bg-yellow-500',
      textColor: 'text-gray-900',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
      )
    },
    {
      id: 'low',
      name: 'Low',
      color: 'bg-blue-500',
      textColor: 'text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  // Sample incident logs posted by residents (simulated)
  const [incidentLogs, setIncidentLogs] = useState([
    {
      id: 1,
      title: 'Water Leak in Parking Garage',
      description: 'There is a water leak on level P2 of the parking garage near spot 45. The water is pooling and creating a hazard.',
      location: 'Parking Garage - Level P2',
      category: null, // Not categorized yet
      approved: false,
      timestamp: '2025-03-15T14:25:00',
      reportedBy: 'John Smith',
      unit: '5B',
      attachmentUrl: '/sample-image.jpg',
      contactPhone: '555-123-4567'
    },
    {
      id: 2,
      title: 'Broken Window in Gym',
      description: 'One of the windows in the gym appears to be cracked and might be a safety hazard.',
      location: 'Fitness Center',
      category: null, // Not categorized yet
      approved: false,
      timestamp: '2025-03-15T16:42:00',
      reportedBy: 'Maria Garcia',
      unit: '12F',
      attachmentUrl: null,
      contactPhone: '555-987-6543'
    },
    {
      id: 3,
      title: 'Suspicious Person in Lobby',
      description: 'There was a person in the lobby who seemed to be trying to access the elevators without a key card. Security should be notified.',
      location: 'Main Lobby',
      category: null, // Not categorized yet
      approved: false,
      timestamp: '2025-03-16T08:15:00',
      reportedBy: 'David Chen',
      unit: '7A',
      attachmentUrl: null,
      contactPhone: '555-555-5555'
    },
    {
      id: 4,
      title: 'Elevator Making Strange Noise',
      description: 'The north elevator is making a grinding noise when it travels between floors 3 and 4. It might need maintenance.',
      location: 'North Elevator',
      category: null, // Not categorized yet
      approved: false,
      timestamp: '2025-03-16T10:30:00',
      reportedBy: 'Sarah Johnson',
      unit: '9C',
      attachmentUrl: null,
      contactPhone: '555-111-2222'
    },
    {
      id: 5,
      title: 'Smoke Smell Near Trash Room',
      description: "There's a strong smell of smoke coming from the trash room on the 4th floor. Please investigate as it could be a fire hazard.",
      location: '4th Floor Trash Room',
      category: null, // Not categorized yet
      approved: false,
      timestamp: '2025-03-16T12:05:00',
      reportedBy: 'Michael Lee',
      unit: '4D',
      attachmentUrl: null,
      contactPhone: '555-333-4444'
    }
  ]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'approved', 'all'
  const [searchTerm, setSearchTerm] = useState('');

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

  // Handle approving an incident with a specific category
  const handleApprove = (incidentId, categoryId) => {
    setIncidentLogs(incidentLogs.map(incident => {
      if (incident.id === incidentId) {
        return { ...incident, approved: true, category: categoryId };
      }
      return incident;
    }));
  };

  // Handle removing an incident
  const handleRemove = (incidentId) => {
    if (window.confirm('Are you sure you want to remove this incident report?')) {
      setIncidentLogs(incidentLogs.filter(incident => incident.id !== incidentId));
    }
  };

  // Filter incidents based on current filters
  const filteredIncidents = incidentLogs.filter(incident => {
    // Filter by status
    if (statusFilter === 'pending' && incident.approved) return false;
    if (statusFilter === 'approved' && !incident.approved) return false;

    // Filter by search term
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        incident.title.toLowerCase().includes(searchTermLower) ||
        incident.description.toLowerCase().includes(searchTermLower) ||
        incident.location.toLowerCase().includes(searchTermLower) ||
        incident.reportedBy.toLowerCase().includes(searchTermLower) ||
        incident.unit.toLowerCase().includes(searchTermLower)
      );
    }

    return true;
  });

  // Get category details by ID
  const getCategoryDetails = (categoryId) => {
    return alertCategories.find(category => category.id === categoryId) || null;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Incident Logs</h1>
          <p className="mt-1 text-gray-600">Review and manage resident-reported incidents</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="all">All Incidents</option>
            </select>
          </div>

          <div className="flex-grow max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by title, description, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Incidents List */}
        <div className="space-y-4">
          {filteredIncidents.length > 0 ? (
            filteredIncidents.map((incident) => {
              const categoryDetails = getCategoryDetails(incident.category);

              return (
                <div
                  key={incident.id}
                  className={`bg-white rounded-lg shadow overflow-hidden ${incident.category ? `border-l-4 ${getCategoryDetails(incident.category).color}` : ''}`}
                >
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-lg font-medium text-gray-900">{incident.title}</h3>

                      <div className="flex flex-wrap items-center gap-2">
                        {incident.approved ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${categoryDetails ? `${categoryDetails.color} ${categoryDetails.textColor}` : 'bg-green-100 text-green-800'}`}>
                            {categoryDetails ? categoryDetails.name : 'Approved'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            Pending Review
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="mt-2 text-gray-600">{incident.description}</p>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Location:</span> {incident.location}
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Reported by:</span> {incident.reportedBy} (Unit {incident.unit})
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Contact:</span> {incident.contactPhone}
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Time:</span> {formatDate(incident.timestamp)}
                      </div>
                    </div>

                    {incident.attachmentUrl && (
                      <div className="mt-4">
                        <a href={incident.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2  0 002 2z" />
                          </svg>
                          View Attachment
                        </a>
                      </div>
                    )}

                    {!incident.approved && (
                      <div className="mt-6 border-t pt-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Approve as:</h4>
                            <div className="flex flex-wrap gap-2">
                              {alertCategories.map((category) => (
                                <button
                                  key={category.id}
                                  onClick={() => handleApprove(incident.id, category.id)}
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${category.color} ${category.textColor} hover:opacity-90`}
                                >
                                  {category.icon}
                                  <span className="ml-1">{category.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemove(incident.id)}
                            className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}

                    {incident.approved && (
                      <div className="mt-6 border-t pt-4">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleRemove(incident.id)}
                            className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">No incident logs found matching your filters.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}