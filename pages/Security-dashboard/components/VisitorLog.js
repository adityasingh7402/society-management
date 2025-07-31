import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  User, LogOut, Home, Phone, Search, Filter, XCircle, Shield, CheckCircle,
  Camera, Clock, Building, MessageSquare, Calendar, Loader, X
} from 'lucide-react';
import { FaArrowLeft } from "react-icons/fa";

const VisitorLog = () => {
  const router = useRouter();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');
  const [securityDetails, setSecurityDetails] = useState({});
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // Fetch security details and then visitors
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
        fetchVisitors(data.societyId, token);
      } catch (error) {
        console.error("Error fetching profile:", error);
        showNotification("Failed to fetch security profile", "error");
      }
    };

    fetchProfile();
  }, [router]);

  // Fetch visitors from the DailyAttendance model
  const fetchVisitors = async (societyId, token) => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const queryParams = new URLSearchParams({
        societyId,
        date: today,
        page: 1,
        limit: 100
      });

      const response = await fetch(`/api/DailyAttendance-Api/get-attendance?${queryParams}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch visitor records');
      }

      const data = await response.json();
      // Filter only visitors with 'Inside' status
      const insideVisitors = data.records.flatMap(record => 
        record.visitors.filter(visitor => visitor.status === 'Inside')
      );
      setVisitors(insideVisitors);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      showNotification("Failed to fetch visitors", "error");
    } finally {
      setLoading(false);
    }
  };

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

  // Handle visitor exit
  const handleVisitorExit = async (visitorId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("Security");
      if (!token) {
        router.push("/SecurityLogin");
        return;
      }

      const response = await fetch('/api/DailyAttendance-Api/update-exit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          societyId: securityDetails.societyId,
          visitorId,
          actualExitTime: new Date(),
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update visitor exit');
      }

      // Remove the exited visitor from the list since we only show 'Inside' visitors
      const updatedVisitors = visitors.filter(visitor => visitor._id !== visitorId);
      setVisitors(updatedVisitors);
      showNotification("Visitor exit marked successfully", "success");
    } catch (error) {
      console.error('Error updating visitor exit:', error);
      showNotification("Failed to mark visitor exit", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearchTerm = visitor.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              visitor.visitorPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              visitor.residentDetails?.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearchTerm;
  });

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
        Current Visitors
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

      {/* Main loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center">
            <Loader className="animate-spin h-8 w-8 text-blue-500 mb-2" />
            <p className="text-center">Loading visitors...</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 bg-gray-100 rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by visitor name, phone, or flat number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Visitors List */}
      <div className="space-y-4">
        {filteredVisitors.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <User size={40} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 font-medium">No visitors currently inside</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm ? 'Try changing your search term' : 'All visitors have exited or none have entered today'}
            </p>
          </div>
        ) : (
          filteredVisitors.map((visitor) => (
            <div 
              key={visitor._id} 
              className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-green-500"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-800 flex items-center">
                      <User size={18} className="mr-2 text-blue-600" />
                      {visitor.visitorName}
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Inside
                      </span>
                    </h3>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center mb-1">
                          <MessageSquare size={14} className="mr-1 text-gray-500" />
                          <span className="font-medium">Purpose:</span>
                        </div>
                        <div className="text-gray-800 font-medium">{visitor.purpose}</div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center mb-1">
                          <Clock size={14} className="mr-1 text-gray-500" />
                          <span className="font-medium">Entry:</span>
                        </div>
                        <div className="text-gray-800 font-medium">{formatDateTime(visitor.entryTime)}</div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center mb-1">
                          <Building size={14} className="mr-1 text-gray-500" />
                          <span className="font-medium">Location:</span>
                        </div>
                        <div className="text-gray-800 font-medium">
                          Block {visitor.residentDetails?.blockNumber}, Floor {visitor.residentDetails?.floorNumber}, Flat {visitor.residentDetails?.flatNumber}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center mb-1">
                          <Phone size={14} className="mr-1 text-gray-500" />
                          <span className="font-medium">Phone:</span>
                        </div>
                        <div className="text-gray-800 font-medium">{visitor.visitorPhone}</div>
                      </div>
                      
                      <div className="text-sm text-gray-600 md:col-span-2">
                        <div className="flex items-center mb-1">
                          <User size={14} className="mr-1 text-gray-500" />
                          <span className="font-medium">Resident:</span>
                        </div>
                        <div className="text-gray-800 font-medium">{visitor.residentDetails?.name}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visitor image and action button */}
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
                    
                    {/* Mark Exit Button */}
                    <button
                      onClick={() => handleVisitorExit(visitor._id)}
                      className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center justify-center text-sm font-medium transition-colors"
                    >
                      <LogOut size={16} className="mr-1" />
                      Mark Exit
                    </button>
                  </div>
                </div>
                
                {/* Entry information */}
                <div className="mt-3 text-xs p-2 rounded-md bg-green-50 text-green-700">
                  <span className="font-medium">Entered</span> on {formatDateTime(visitor.entryTime)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorLog
