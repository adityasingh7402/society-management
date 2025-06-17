import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';

export default function IncidentLogs() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [profileData, setProfileData] = useState({});
  const [currentUser, setCurrentUser] = useState({});
  const [apiLoading, setApiLoading] = useState(false);

  // Fetch profile and notices
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('Society');
        if (!token) {
          router.push('/societyLogin');
          return;
        }

        const response = await fetch('/api/Society-Api/get-society-details', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfileData(data);
        setCurrentUser({
          name: data.managerName,
          isAdmin: true,
          userId: data._id,
          role: 'management'
        });

        // Call fetchNotices after profile data is available
        fetchNotices(data.societyId);
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.message === 'Failed to fetch profile') {
          router.push('/societyLogin');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const fetchNotices = async (societyId) => {
    try {
      setApiLoading(true);
      // Use the societyId parameter instead of profileData.societyId
      if (!societyId) {
        console.error('Society ID is undefined');
        setError('Unable to load notices: Society ID is missing');
        return;
      }

      const response = await fetch(`/api/Notice-Api/getNotices?societyId=${societyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch notices');
      }

      const data = await response.json();
      setNotices(data.data || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
      setError('Failed to load notices. Please try again later.');
    } finally {
      setApiLoading(false);
    }
  };

  // Filter notices based on current filters
  const filteredNotices = notices.filter(notice => {
    // Filter by status
    if (statusFilter === 'approved' && notice.status !== 'approved') return false;
    if (statusFilter === 'pending' && notice.status === 'approved') return false;

    // Filter by priority
    if (priorityFilter !== 'all' && notice.priorityLevel !== priorityFilter) return false;

    // Filter by search term
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        notice.title?.toLowerCase().includes(searchTermLower) ||
        notice.description?.toLowerCase().includes(searchTermLower)
      );
    }

    return true;
  });

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

  // Handle removing a notice
  const handleRemove = (noticeId) => {
    if (window.confirm('Are you sure you want to remove this notice?')) {
      setNotices(notices.filter(notice => notice._id !== noticeId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Notice Logs</h1>
          <p className="mt-1 text-gray-600">Review and manage all notices</p>
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
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex-grow max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Notices List */}
        <div className="space-y-4">
          {loading ? (
            <PreloaderSociety />
          ) : error ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-red-500">
              {error}
            </div>
          ) : filteredNotices.length > 0 ? (
            filteredNotices.map(notice => (
              <div key={notice._id} className="bg-white rounded-lg shadow overflow-hidden mb-4">
                <div className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">{notice.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${notice.priorityLevel === 'High' ? 'bg-red-100 text-red-800' :
                        notice.priorityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                      }`}>
                      {notice.priorityLevel}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-600">{notice.description}</p>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Posted: {formatDate(notice.createdAt)}</p>
                    <p>Status: {notice.status}</p>
                    {notice.createdBy && (
                      <p>Created by: {notice.createdBy.name}</p>
                    )}
                  </div>

                  {notice.attachments && notice.attachments.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">Attachments:</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {notice.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            View Attachment {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 border-t pt-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleRemove(notice._id)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">No notices found matching your filters.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}