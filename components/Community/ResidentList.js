import React, { useEffect, useState } from 'react';
import { User, MessageSquare, Phone, Search, ChevronDown, ChevronUp, Bell, Home, Building, Building2, Clock } from 'lucide-react';

export default function ResidentList({
  residents,
  isLoading,
  unreadCounts,
  searchQuery,
  setSearchQuery,
  onChatSelect,
  onCallStart,
  socketConnected
}) {
  const [expandedSections, setExpandedSections] = useState({});
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [organizedResidents, setOrganizedResidents] = useState({});

  // Organize residents by building/wing
  useEffect(() => {
    if (!residents.length) return;

    // Filter residents based on search query
    const filtered = residents.filter(resident => 
      resident.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (resident.flatDetails?.flatNumber && resident.flatDetails.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredResidents(filtered);

    // Organize by building/wing and floor
    const organized = {};
    filtered.forEach(resident => {
      // Extract building/wing from flat number (e.g., A-101 -> A)
      const flatNumber = resident.flatDetails?.flatNumber || 'Unknown';
      const building = flatNumber.split('-')[0] || flatNumber.charAt(0) || 'Unknown';
      
      // Create building group if it doesn't exist
      if (!organized[building]) {
        organized[building] = [];
      }
      
      organized[building].push(resident);
    });

    // Sort residents within each building by flat number
    Object.keys(organized).forEach(building => {
      organized[building].sort((a, b) => {
        const flatA = a.flatDetails?.flatNumber || '';
        const flatB = b.flatDetails?.flatNumber || '';
        return flatA.localeCompare(flatB);
      });
    });

    setOrganizedResidents(organized);
    
    // Initialize all sections as closed by default
    const sectionsToExpand = {};
    setExpandedSections(sectionsToExpand);
  }, [residents, searchQuery, unreadCounts]);

  // Helper function to check if resident has unread messages
  const hasUnreadMessages = (residentId) => {
    return unreadCounts && unreadCounts[residentId] && unreadCounts[residentId] > 0;
  };

  const toggleSection = (building) => {
    setExpandedSections(prev => ({
      ...prev,
      [building]: !prev[building]
    }));
  };

  // Get building icon based on name
  const getBuildingIcon = (building) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (alphabet.includes(building)) {
      return <Building2 className="mr-2 text-blue-500" />;
    } else if (!isNaN(building)) {
      return <Building className="mr-2 text-green-500" />;
    } else {
      return <Home className="mr-2 text-purple-500" />;
    }
  };

  // Count total unread messages in a building
  const getBuildingUnreadCount = (building) => {
    return organizedResidents[building].reduce((count, resident) => {
      return count + (unreadCounts[resident._id] || 0);
    }, 0);
  };

  // Opens phone dialer with resident's phone number when call button is clicked
  const handleCall = (resident) => {
    if (resident.phoneNumber) {
      window.open(`tel:${resident.phoneNumber}`);
    } else {
      onCallStart(resident); // Fallback to original call method
    }
  };

  // Format last seen time for display
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Offline';
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  return (
    <div className="h-full bg-white">
      {/* Residents List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-blue-100"></div>
            <div className="mt-4 h-4 w-32 bg-gray-100 rounded"></div>
            <div className="mt-2 h-3 w-24 bg-gray-100 rounded"></div>
          </div>
        </div>
      ) : Object.keys(organizedResidents).length === 0 ? (
        <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center h-full">
          <div className="mb-4 bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <p className="font-medium">No residents found</p>
          <p className="text-sm mt-1">Try changing your search query</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {Object.keys(organizedResidents)
            .sort() // Sort buildings alphabetically
            .map(building => {
              const unreadCount = getBuildingUnreadCount(building);
              
              return (
                <div key={building} className="overflow-hidden">
                  {/* Building/Wing Header */}
                  <div 
                    className={`px-4 py-3 hover:bg-gray-50 flex items-center justify-between cursor-pointer 
                      ${unreadCount > 0 ? 'bg-blue-50' : ''}`}
                    onClick={() => toggleSection(building)}
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {getBuildingIcon(building)}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">
                          {building === 'Unknown' ? 'Other Residents' : `Building ${building}`}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {organizedResidents[building].length} {organizedResidents[building].length === 1 ? 'resident' : 'residents'}
                        </p>
                      </div>
                      
                      {unreadCount > 0 && (
                        <div className="ml-3 bg-blue-600 text-white text-xs rounded-full h-5 px-2 min-w-[20px] flex items-center justify-center">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                    {expandedSections[building] ? 
                      <ChevronUp className="text-gray-400 h-5 w-5" /> : 
                      <ChevronDown className="text-gray-400 h-5 w-5" />
                    }
                  </div>
                  
                  {/* Residents in this building */}
                  {expandedSections[building] && (
                    <div className={`${unreadCount > 0 ? 'bg-gradient-to-r from-blue-50 to-white' : 'bg-white'}`}>
                      {organizedResidents[building].map(resident => (
                        <div 
                          key={resident._id} 
                          onClick={() => onChatSelect(resident)}
                          className={`p-3 px-4 pl-12 hover:bg-gray-50 flex items-center justify-between 
                            cursor-pointer transition-colors border-l-2 
                            ${hasUnreadMessages(resident._id) ? 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-white' : 'border-l-transparent'}`}
                        >
                          <div className="flex items-center border-b border-t p-2 flex-1 min-w-0">
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center relative flex-shrink-0">
                              {resident.userImage ? (
                                <img 
                                  src={resident.userImage} 
                                  alt={resident.name} 
                                  className="h-12 w-12 rounded-full object-cover"
                                />
                              ) : (
                                <User className="text-gray-500" />
                              )}
                              {hasUnreadMessages(resident._id) && (
                                <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center border-2 border-white animate-pulse">
                                  {unreadCounts[resident._id]}
                                </div>
                              )}
                              <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white
                                ${resident.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            </div>
                            
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-gray-900 truncate">{resident.name}</h3>
                                <div className="flex items-center text-xs text-gray-500 ml-2 flex-shrink-0">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {resident.isOnline ? 'Online' : formatLastSeen(resident.lastSeen)}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-sm text-gray-500 truncate">
                                  {resident.flatDetails?.flatNumber ? `Flat ${resident.flatDetails.flatNumber}` : 'Resident'}
                                </p>
                                
                                <div className="flex space-x-2 ml-2 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCall(resident);
                                    }}
                                    className="text-green-600 rounded-full p-1 hover:bg-green-50"
                                    title={resident.phoneNumber ? `Call ${resident.phoneNumber}` : "Start call"}
                                  >
                                    <Phone size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
} 