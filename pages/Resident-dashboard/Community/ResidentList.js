import React from 'react';
import { User, MessageSquare, Phone, Search } from 'lucide-react';

export default function ResidentList({
  residents,
  isLoading,
  unreadCounts,
  searchQuery,
  setSearchQuery,
  onChatSelect,
  onCallStart,
  inCall
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search residents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Residents List */}
      <div className="divide-y">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : residents.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No residents found</div>
        ) : (
          residents.map(resident => (
            <div key={resident._id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center relative">
                  <User className="text-gray-500" />
                  {unreadCounts[resident._id] > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCounts[resident._id]}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{resident.name}</h3>
                  <p className="text-sm text-gray-500">
                    Flat: {resident.flatDetails?.flatNumber || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onChatSelect(resident)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full relative"
                >
                  <MessageSquare />
                  {unreadCounts[resident._id] > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCounts[resident._id]}
                    </div>
                  )}
                </button>
                <button
                  onClick={() => onCallStart(resident)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                  disabled={inCall}
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