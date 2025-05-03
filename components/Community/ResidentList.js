import React, { useEffect } from 'react';
import { User, MessageSquare, Phone, Search, WifiOff, Bell } from 'lucide-react';

export default function ResidentList({
  residents,
  isLoading,
  unreadCounts,
  searchQuery,
  setSearchQuery,
  onChatSelect,
  onCallStart,
  inCall,
  socketConnected
}) {
  // Log unread counts for debugging
  useEffect(() => {
    console.log('Unread counts in ResidentList:', unreadCounts);
  }, [unreadCounts]);

  // Helper function to check if resident has unread messages
  const hasUnreadMessages = (residentId) => {
    return unreadCounts && unreadCounts[residentId] && unreadCounts[residentId] > 0;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search Bar */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search residents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {!socketConnected && (
          <div className="ml-2 flex items-center text-yellow-600 text-sm">
            <WifiOff className="w-4 h-4 mr-1" />
            <span>Offline</span>
          </div>
        )}
      </div>

      {/* Residents List */}
      <div className="divide-y">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : residents.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No residents found</div>
        ) : (
          residents.map(resident => (
            <div 
              key={resident._id} 
              className={`p-4 hover:bg-gray-50 flex items-center justify-between ${hasUnreadMessages(resident._id) ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center relative">
                  <User className="text-gray-500" />
                  {hasUnreadMessages(resident._id) && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCounts[resident._id]}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">{resident.name}</h3>
                    {hasUnreadMessages(resident._id) && (
                      <Bell size={14} className="ml-2 text-red-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Flat: {resident.flatDetails?.flatNumber || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onChatSelect(resident)}
                  className={`p-2 rounded-full relative ${hasUnreadMessages(resident._id) ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-blue-600 hover:bg-blue-50'}`}
                >
                  <MessageSquare />
                  {hasUnreadMessages(resident._id) && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {unreadCounts[resident._id]}
                    </div>
                  )}
                </button>
                <button
                  onClick={() => onCallStart(resident)}
                  className={`p-2 ${socketConnected ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 cursor-not-allowed'} rounded-full`}
                  disabled={inCall || !socketConnected}
                  title={!socketConnected ? "Call functionality unavailable while offline" : "Start call"}
                >
                  <Phone />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 