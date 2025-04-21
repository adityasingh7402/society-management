import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Camera, User, Clock, LogOut, Home, Building,
  CheckCircle, XCircle, Layers, MessageSquare,
  Calendar, Shield, Loader, Check, X
} from 'lucide-react';
import { FaArrowLeft } from "react-icons/fa";

const ApproveVisitor = () => {
  const router = useRouter();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [securityDetails, setSecurityDetails] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approve', 'reject'
  const [fullScreenImage, setFullScreenImage] = useState(null); // Add this state for full-screen image

  // Fetch security details on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("Security");
        if (!token) {
          router.push("/SecurityLogin");
          return;
        }

        const response = await fetch("/api/Security-Api/get-security-details", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setSecurityDetails(data);
        fetchTodayVisitors(data.societyId);
      } catch (error) {
        console.error("Error fetching profile:", error);
        showNotification("Failed to fetch security profile", "error");
      }
    };

    fetchProfile();
  }, [router]);

  // Show notification popup
  const showNotification = (message, type) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);

    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  // Fetch today's visitors
  const fetchTodayVisitors = async (societyId) => {
    try {
      setLoading(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const response = await fetch(`/api/VisitorApi/Get-All-Visitors?societyId=${societyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch visitors');
      }
      
      const result = await response.json();
      
      // Filter visitors for today only
      const todayVisitors = result.data.filter(visitor => {
        const visitorDate = new Date(visitor.createdAt || visitor.entryTime);
        return visitorDate >= today && visitorDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      });
      
      setVisitors(todayVisitors);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      showNotification("Failed to fetch visitors", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle approval or rejection - updated to use 'approve'/'reject'
  const handleApprovalStatus = async (visitorId, status) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/VisitorApi/update-visitor/${visitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: status,
          approvedBy: securityDetails._id,
          // No need to include approvedAt as we'll use updatedAt from DB
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update visitor status');
      }
      
      // Update local state to reflect the change
      setVisitors(prevVisitors => 
        prevVisitors.map(visitor => 
          visitor._id === visitorId 
            ? { ...visitor, status: status, approvedBy: securityDetails._id, updatedAt: new Date().toISOString() } 
            : visitor
        )
      );
      
      showNotification(`Visitor ${status === 'approve' ? 'approved' : 'rejected'} successfully`, "success");
    } catch (error) {
      console.error('Error updating visitor status:', error);
      showNotification("Failed to update visitor status", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter visitors based on status - updated for 'approve'/'reject'
  const filteredVisitors = filterStatus === 'all' 
    ? visitors 
    : visitors.filter(visitor => visitor.status === filterStatus);

  // Format date and time
  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to display status label
  const getStatusLabel = (status) => {
    if (status === 'approve') return 'Approved';
    if (status === 'reject') return 'Rejected';
    return 'Pending';
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      {/* Header with back button */}
      <div className="mb-4">
        <button 
          onClick={() => router.back()} 
          className="flex items-center p-2 space-x-2 text-blue-500 hover:text-blue-600 font-medium transition-colors"
        >
          <FaArrowLeft size={18} />
          <span className="text-base">Back</span>
        </button>
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-4 text-center">
        Today's Visitor Approval
      </h1>

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <button 
              onClick={() => setFullScreenImage(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-40 transition-all"
              aria-label="Close full screen image"
            >
              <X size={28} />
            </button>
            <img 
              src={fullScreenImage} 
              alt="Visitor" 
              className="max-h-[90vh] max-w-full mx-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Notification Popup */}
      {showPopup && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-xs animate-fade-in ${
          popupType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            <span className="mr-2 flex-shrink-0">
              {popupType === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            </span>
            <p className="text-sm">{popupMessage}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="ml-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 flex-shrink-0"
              aria-label="Close notification"
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center">
            <Loader className="animate-spin h-8 w-8 text-blue-500 mb-2" />
            <p className="text-center">Processing...</p>
          </div>
        </div>
      )}

      {/* Filter tabs - updated for 'approve'/'reject' */}
      <div className="mb-6 bg-gray-100 rounded-lg p-2 flex space-x-2 overflow-x-auto">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'pending' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus('approve')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'approve' 
              ? 'bg-green-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilterStatus('reject')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'reject' 
              ? 'bg-red-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Visitors List */}
      <div className="space-y-4">
        {filteredVisitors.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <User size={40} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 font-medium">No visitors found for today</p>
            <p className="text-gray-400 text-sm mt-1">
              {filterStatus !== 'all' ? 'Try changing your filter or check back later' : 'Check back later'}
            </p>
          </div>
        ) : (
          filteredVisitors.map((visitor) => (
            <div 
              key={visitor._id} 
              className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
                visitor.status === 'approve' 
                  ? 'border-green-500' 
                  : visitor.status === 'reject' 
                    ? 'border-red-500' 
                    : 'border-yellow-500'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-800 flex items-center">
                      <User size={18} className="mr-2 text-blue-600" />
                      {visitor.visitorName}
                      {visitor.status && (
                        <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                          visitor.status === 'approve' 
                            ? 'bg-green-100 text-green-800' 
                            : visitor.status === 'reject' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusLabel(visitor.status)}
                        </span>
                      )}
                    </h3>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="text-sm text-gray-600 flex items-center">
                        <MessageSquare size={14} className="mr-1 text-gray-500" />
                        <span className="font-medium mr-1">Purpose:</span> {visitor.visitorReason}
                      </div>
                      
                      <div className="text-sm text-gray-600 flex items-center">
                        <Clock size={14} className="mr-1 text-gray-500" />
                        <span className="font-medium mr-1">Entry:</span> {formatDateTime(visitor.entryTime)}
                      </div>
                      
                      <div className="text-sm text-gray-600 flex items-center">
                        <Building size={14} className="mr-1 text-gray-500" />
                        <span className="font-medium mr-1">Location:</span> 
                        Block {visitor.blockName}, Floor {visitor.floorNumber}, Flat {visitor.flatNumber}
                      </div>
                      
                      <div className="text-sm text-gray-600 flex items-center">
                        <User size={14} className="mr-1 text-gray-500" />
                        <span className="font-medium mr-1">Resident:</span> {visitor.ownerName}
                      </div>
                    </div>
                  </div>
                  
                  {/* Visitor image if available - updated to be clickable */}
                  <div className="ml-4 flex flex-col items-center">
                    {visitor.visitorImage ? (
                      <div 
                        className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer"
                        onClick={() => setFullScreenImage(visitor.visitorImage)}
                      >
                        <img 
                          src={visitor.visitorImage} 
                          alt={visitor.visitorName} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/profile.png'; // Fallback image
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-md bg-gray-100 flex items-center justify-center">
                        <User size={32} className="text-gray-400" />
                      </div>
                    )}
                    
                    {/* Large status icon */}
                    <div className="mt-2">
                      {visitor.status === 'approve' && (
                        <CheckCircle size={28} className="text-green-500" />
                      )}
                      {visitor.status === 'reject' && (
                        <XCircle size={28} className="text-red-500" />
                      )}
                      {visitor.status === 'pending' && (
                        <Clock size={28} className="text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Approval actions - uncomment if needed */}
                {/* {visitor.status === 'pending' && (
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleApprovalStatus(visitor._id, 'approve')}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center"
                    >
                      <Check size={16} className="mr-1" /> Approve
                    </button>
                    <button
                      onClick={() => handleApprovalStatus(visitor._id, 'reject')}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center justify-center"
                    >
                      <X size={16} className="mr-1" /> Reject
                    </button>
                  </div>
                )} */}
                
                {/* Status information - now using updatedAt instead of approvedAt */}
                {visitor.status !== 'pending' && visitor.updatedAt && (
                  <div className={`mt-3 text-xs p-2 rounded-md ${
                    visitor.status === 'approve' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <span className="font-medium">{visitor.status === 'approve' ? 'Approved' : 'Rejected'}</span> on {formatDateTime(visitor.updatedAt)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApproveVisitor;