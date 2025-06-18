import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Building, AlertTriangle } from 'lucide-react';
import Webcam from 'react-webcam';
import PreloaderSociety from '../../components/PreloaderSociety';
import { set } from 'mongoose';

export default function EmergencyAlerts() {
  // State for alerts
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for image handling
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  // State for creating/editing new alert
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [currentUser, setCurrentUser] = useState({});
  const [newAlert, setNewAlert] = useState({
    title: '',
    description: '',
    noticeType: 'Emergency',
    category: 'Security Threat',
    priorityLevel: 'High',
    sendEmail: true,
    sendPush: true,
    sendSMS: false
  });


  // Filter states
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'past'
  const [typeFilter, setTypeFilter] = useState('all');
  const [profileData, setProfileData] = useState({})
  const [loading, setLoading] = useState(true);

  // Fetch notices on component mount
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
    // Remove fetchNotices from here
  }, []);

  // Add this state at the top with other states
  const [apiLoading, setApiLoading] = useState(false);

  // Modify each API call function:
  
  // In fetchNotices
  const fetchNotices = async (societyId) => {
    setLoading(true);
    try {
      // Use the societyId parameter instead of profileData.societyId
      if (!societyId) {
        console.error('Society ID is undefined');
        setError('Unable to load alerts: Society ID is missing');
        return;
      }

      setIsLoading(true);
      const response = await fetch(`/api/Notice-Api/getNotices?societyId=${societyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch notices');
      }

      const data = await response.json();
      setAlerts(data.data || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
      setError('Failed to load alerts. Please try again later.');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  };

  // Handle camera capture
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();

      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `emergency-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setSelectedFiles(prev => [...prev, file]);
          setShowCamera(false);
        })
        .catch((err) => {
          console.error('Error converting image:', err);
          alert('Failed to capture photo');
        });
    }
  }, [webcamRef]);

  // Function to create new notice
  const handleCreateAlert = async () => {
    if (isEditing) {
      await handleUpdateAlert();
      return;
    }
    
    if (!newAlert.title.trim() || !newAlert.description.trim()) return;

    try {
      setLoading(true);
      let attachments = [];

      // Upload images if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('image', file);
        });

        const uploadResponse = await fetch('/api/Announcement-Api/upload-images', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload images');
        }

        const uploadData = await uploadResponse.json();
        attachments = uploadData.imageUrls.map(url => ({
          fileName: url.split('/').pop(),
          fileUrl: url,
          fileType: 'image/jpeg'
        }));
      }

      const noticeData = {
        title: newAlert.title,
        description: newAlert.description,
        noticeType: newAlert.noticeType,
        category: newAlert.category,
        priorityLevel: newAlert.priorityLevel,
        societyId: profileData.societyId,
        createdBy: {
          userId: currentUser.userId,
          name: currentUser.name,
          role: currentUser.role
        },
        attachments
      };

      const response = await fetch('/api/Notice-Api/createNotice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noticeData),
      });

      if (!response.ok) {
        throw new Error('Failed to create notice');
      }

      // Refresh notices
      await fetchNotices(profileData.societyId);

      // Reset form
      setIsCreating(false);
      setSelectedFiles([]);
      setNewAlert({
        title: '',
        description: '',
        noticeType: 'Emergency',
        category: 'Security Threat',
        priorityLevel: 'High',
        sendEmail: true,
        sendPush: true,
        sendSMS: false
      });
    } catch (error) {
      console.error('Error creating notice:', error);
      alert('Failed to create alert: ' + error.message);
    }finally {
      setLoading(false); 
    }
  };

  // Function to delete notice
  const handleDeleteAlert = async (noticeId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        const response = await fetch(`/api/Notice-Api/deleteNotice?noticeId=${noticeId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete notice');
        }

        await fetchNotices(profileData.societyId);
      } catch (error) {
        console.error('Error deleting notice:', error);
        alert('Failed to delete alert: ' + error.message);
      }
    }
  };



  // Function to handle edit alert
  const handleEditAlert = (notice) => {
    setIsEditing(true);
    setEditingNoticeId(notice._id);
    setNewAlert({
      title: notice.title,
      description: notice.description,
      noticeType: notice.noticeType || 'Emergency',
      category: notice.category || 'Security Threat',
      priorityLevel: notice.priorityLevel || 'High',
      sendEmail: true,
      sendPush: true,
      sendSMS: false
    });
    setIsCreating(true);
  };

  // Function to update existing notice
  const handleUpdateAlert = async () => {
    if (!newAlert.title.trim() || !newAlert.description.trim()) return;

    try {
      let attachments = [];

      // Upload new images if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('image', file);
        });

        const uploadResponse = await fetch('/api/Announcement-Api/upload-images', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload images');
        }

        const uploadData = await uploadResponse.json();
        attachments = uploadData.imageUrls.map(url => ({
          fileName: url.split('/').pop(),
          fileUrl: url,
          fileType: 'image/jpeg'
        }));
      }

      // Find the current notice to get existing attachments
      const currentNotice = alerts.find(notice => notice._id === editingNoticeId);
      
      // If we have existing attachments and no new files were uploaded, keep the existing ones
      if (currentNotice?.attachments && currentNotice.attachments.length > 0 && selectedFiles.length === 0) {
        attachments = currentNotice.attachments;
      }

      const noticeData = {
        title: newAlert.title,
        description: newAlert.description,
        noticeType: newAlert.noticeType,
        category: newAlert.category,
        priorityLevel: newAlert.priorityLevel,
        societyId: profileData.societyId,
        attachments,
        updatedBy: {
          userId: currentUser.userId,
          name: currentUser.name,
          role: currentUser.role
        }
      };

      const response = await fetch(`/api/Notice-Api/updateNotice?noticeId=${editingNoticeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noticeData),
      });

      if (!response.ok) {
        throw new Error('Failed to update notice');
      }

      // Refresh notices
      await fetchNotices(profileData.societyId);

      // Reset form
      setIsCreating(false);
      setIsEditing(false);
      setEditingNoticeId(null);
      setSelectedFiles([]);
      setNewAlert({
        title: '',
        description: '',
        noticeType: 'Emergency',
        category: 'Security Threat',
        priorityLevel: 'High',
        sendEmail: true,
        sendPush: true,
        sendSMS: false
      });
    } catch (error) {
      console.error('Error updating notice:', error);
      alert('Failed to update alert: ' + error.message);
    }
  };

  // Function to toggle notice status
  const handleToggleActive = async (noticeId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'approved' ? 'rejected' : 'approved';

      const response = await fetch(`/api/Notice-Api/updateNoticeStatus?noticeId=${noticeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          approvedBy: {
            userId: currentUser.userId,
            name: currentUser.name
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notice status');
      }

      // Pass the societyId parameter to fetchNotices
      await fetchNotices(profileData.societyId);
    } catch (error) {
      console.error('Error updating notice status:', error);
      alert('Failed to update alert status: ' + error.message);
    }
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

  // Get color based on priority level
  const getPriorityColor = (priorityLevel) => {
    switch (priorityLevel) {
      case 'High':
        return 'bg-red-600 text-white';
      case 'Medium':
        return 'bg-orange-500 text-white';
      case 'Low':
        return 'bg-yellow-500 text-gray-900';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  // Get icon based on notice type
  const getNoticeIcon = (noticeType, category) => {
    if (noticeType === 'Emergency') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
      );
    }
  };

  // Filter notices
  const filteredAlerts = alerts.filter(notice => {
    if (activeFilter === 'active' && notice.status !== 'approved') return false;
    if (activeFilter === 'past' && notice.status === 'approved') return false;
    if (typeFilter !== 'all' && notice.priorityLevel !== typeFilter) return false;
    return true;
  });

  // Render image upload section
  const renderImageUploadSection = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Attach Images</label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Upload Images
          </button>
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Take Photo
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Show selected images */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Selected ${index + 1}`}
                  className="h-24 w-24 object-cover rounded-md"
                />
                <button
                  onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="mb-4"
            />
            <div className="flex justify-center space-x-2">
              <button
                onClick={capturePhoto}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Capture
              </button>
              <button
                onClick={() => setShowCamera(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return <PreloaderSociety />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <AlertTriangle className="mr-3" size={32} />
              Emergency Alerts
            </h1>
          </div>
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
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {isEditing ? 'Update Alert' : 'Create New Alert'}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newAlert.priorityLevel}
                      onChange={(e) => setNewAlert({ ...newAlert, priorityLevel: e.target.value })}
                    >
                      <option value="High">High (Emergency)</option>
                      <option value="Medium">Medium (Urgent)</option>
                      <option value="Low">Low (Information)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newAlert.category}
                      onChange={(e) => setNewAlert({ ...newAlert, category: e.target.value })}
                    >
                      <option value="Rule Violation">Rule Violation</option>
                      <option value="Noise Complaint">Noise Complaint</option>
                      <option value="Parking Issue">Parking Issue</option>
                      <option value="Fire Hazard">Fire Hazard</option>
                      <option value="Power Outage">Power Outage</option>
                      <option value="Security Threat">Security Threat</option>
                      <option value="Other">Other</option>
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
                      value={newAlert.description}
                      onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                    ></textarea>
                  </div>

                  {/* Image upload section */}
                  {renderImageUploadSection()}

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
                      disabled={!newAlert.title.trim() || !newAlert.description.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                      {isEditing ? 'Update Alert' : 'Send Alert'}
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setSelectedFiles([]);
                      }}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
            <p className="text-gray-500 mt-2">Loading alerts...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Alerts List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((notice) => {
                const isActive = notice.status === 'approved';
                const priorityColor = getPriorityColor(notice.priorityLevel);

                return (
                  <div key={notice._id} className={`${isActive ? 'border-l-4' : 'border-l-0'} ${isActive ? priorityColor.split(' ')[0] : 'border-gray-200'} bg-white rounded-lg shadow overflow-hidden`}>
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center justify-center p-2 rounded-full ${priorityColor}`}>
                            {getNoticeIcon(notice.noticeType, notice.category)}
                          </span>
                          <span className="font-medium text-gray-900">{notice.category}</span>
                          <span className={`text-xs px-2 py-1 rounded ${priorityColor}`}>
                            {notice.priorityLevel}
                          </span>
                          {!isActive && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">Inactive</span>
                          )}
                        </div>
                        {currentUser.isAdmin && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditAlert(notice)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit Alert"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleActive(notice._id, notice.status)}
                              className="text-gray-500 hover:text-gray-700"
                              title={isActive ? "Mark as Inactive" : "Mark as Active"}
                            >
                              {isActive ? (
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
                              onClick={() => handleDeleteAlert(notice._id)}
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

                      <h3 className="mt-3 text-lg font-medium text-gray-900">{notice.title}</h3>
                      <p className="mt-1 text-gray-600">{notice.description}</p>

                      {/* Display attachments if any */}
                      {notice.attachments && notice.attachments.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-4">
                          {notice.attachments.map((attachment, index) => (
                            <a
                              key={index}
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={attachment.fileUrl}
                                alt={`Attachment ${index + 1}`}
                                className="h-24 w-24 object-cover rounded-md"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex items-center text-sm text-gray-500">
                        <span>By {notice.createdBy?.name || 'Unknown'} • {formatDate(notice.createdAt)}</span>
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
        )}
      </main>
    </div>
  );
}