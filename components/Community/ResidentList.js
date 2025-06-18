import React, { useEffect, useState } from 'react';
import { User, MessageSquare, Phone, Search, ChevronDown, ChevronUp, Bell, Home, Building, Building2, Clock, Layers } from 'lucide-react';

// Add this function to format the last seen timestamp
const formatLastSeen = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const lastSeen = new Date(timestamp);
  const now = new Date();
  const diffMs = now - lastSeen;
  
  // Convert to seconds, minutes, hours, days
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    // Format as date for older timestamps
    return lastSeen.toLocaleDateString();
  }
};

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
  const [expandedBuildings, setExpandedBuildings] = useState({});
  const [expandedFloors, setExpandedFloors] = useState({});
  const [hierarchicalResidents, setHierarchicalResidents] = useState({});
  const [filteredResidents, setFilteredResidents] = useState([]); // Add this state variable
  const [organizedResidents, setOrganizedResidents] = useState({}); // Add this if you're using it
  
  // Organize residents hierarchically by building, floor, and flat
  useEffect(() => {
    if (!residents.length) return;

    // Filter residents based on search query
    const filtered = residents.filter(resident => 
      resident.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (resident.flatDetails?.flatNumber && resident.flatDetails.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredResidents(filtered);

    // Organize hierarchically
    const hierarchical = {};
    
    filtered.forEach(resident => {
      // Extract building/wing and floor from flat number (e.g., A-101 -> A, 1)
      const flatNumber = resident.flatDetails?.flatNumber || 'Unknown';
      let building = 'Unknown';
      let floor = 'Unknown';
      
      if (flatNumber.includes('-')) {
        // Format like "A-101"
        const parts = flatNumber.split('-');
        building = parts[0];
        if (parts[1] && parts[1].length >= 1) {
          floor = parts[1].charAt(0);
        }
      } else if (flatNumber.length >= 2) {
        // Format like "A101"
        building = flatNumber.charAt(0);
        floor = flatNumber.charAt(1);
      }
      
      // Create building if it doesn't exist
      if (!hierarchical[building]) {
        hierarchical[building] = {
          floors: {},
          unreadCount: 0
        };
      }
      
      // Create floor if it doesn't exist
      if (!hierarchical[building].floors[floor]) {
        hierarchical[building].floors[floor] = {
          residents: [],
          unreadCount: 0
        };
      }
      
      // Add resident to floor
      hierarchical[building].floors[floor].residents.push(resident);
      
      // Update unread counts
      const residentUnreadCount = unreadCounts?.[resident._id] || 0;
      hierarchical[building].unreadCount += residentUnreadCount;
      hierarchical[building].floors[floor].unreadCount += residentUnreadCount;
    });
    
    // Sort residents within each floor by flat number
    Object.keys(hierarchical).forEach(building => {
      Object.keys(hierarchical[building].floors).forEach(floor => {
        hierarchical[building].floors[floor].residents.sort((a, b) => {
          const flatA = a.flatDetails?.flatNumber || '';
          const flatB = b.flatDetails?.flatNumber || '';
          return flatA.localeCompare(flatB);
        });
      });
    });
    
    setHierarchicalResidents(hierarchical);
    setOrganizedResidents(hierarchical);
    
    // Auto-expand buildings with unread messages
    const buildingsToExpand = {};
    const floorsToExpand = {};
    
    Object.keys(hierarchical).forEach(building => {
      if (hierarchical[building].unreadCount > 0) {
        buildingsToExpand[building] = true;
        
        // Also expand floors with unread messages
        Object.keys(hierarchical[building].floors).forEach(floor => {
          if (hierarchical[building].floors[floor].unreadCount > 0) {
            floorsToExpand[`${building}-${floor}`] = true;
          }
        });
      }
    });
    
    setExpandedBuildings(buildingsToExpand);
    setExpandedFloors(floorsToExpand);
    
  }, [residents, searchQuery, unreadCounts]);

  // Helper functions
  const hasUnreadMessages = (residentId) => {
    return unreadCounts && unreadCounts[residentId] && unreadCounts[residentId] > 0;
  };

  const toggleBuilding = (building) => {
    setExpandedBuildings(prev => ({
      ...prev,
      [building]: !prev[building]
    }));
  };
  
  const toggleFloor = (buildingFloor) => {
    setExpandedFloors(prev => ({
      ...prev,
      [buildingFloor]: !prev[buildingFloor]
    }));
  };

  const handleCall = (resident, e) => {
    e.stopPropagation();
    if (resident.phoneNumber) {
      window.open(`tel:${resident.phoneNumber}`);
    } else {
      onCallStart(resident);
    }
  };

  // Different building icon variants
  const getBuildingVariant = (building) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    if (alphabet.includes(building)) {
      return {
        icon: <Building2 size={18} />,
        bgColor: 'bg-indigo-500',
        textColor: 'text-indigo-500',
        gradientFrom: 'from-indigo-100',
        gradientTo: 'to-indigo-50'
      };
    } else if (!isNaN(building)) {
      return {
        icon: <Building size={18} />,
        bgColor: 'bg-emerald-500',
        textColor: 'text-emerald-500',
        gradientFrom: 'from-emerald-100',
        gradientTo: 'to-emerald-50'
      };
    } else {
      return {
        icon: <Home size={18} />,
        bgColor: 'bg-violet-500',
        textColor: 'text-violet-500',
        gradientFrom: 'from-violet-100',
        gradientTo: 'to-violet-50'
      };
    }
  };
  
  // Get floor color variant
  const getFloorVariant = (floor) => {
    const floorNum = parseInt(floor);
    
    if (isNaN(floorNum)) {
      return {
        bgColor: 'bg-gray-500',
        textColor: 'text-gray-500',
        gradientFrom: 'from-gray-100',
        gradientTo: 'to-gray-50'
      };
    }
    
    // Different colors for different floors
    const colors = [
      { bg: 'bg-blue-500', text: 'text-blue-500', from: 'from-blue-100', to: 'to-blue-50' },
      { bg: 'bg-green-500', text: 'text-green-500', from: 'from-green-100', to: 'to-green-50' },
      { bg: 'bg-yellow-500', text: 'text-yellow-500', from: 'from-yellow-100', to: 'to-yellow-50' },
      { bg: 'bg-red-500', text: 'text-red-500', from: 'from-red-100', to: 'to-red-50' },
      { bg: 'bg-purple-500', text: 'text-purple-500', from: 'from-purple-100', to: 'to-purple-50' },
      { bg: 'bg-pink-500', text: 'text-pink-500', from: 'from-pink-100', to: 'to-pink-50' },
      { bg: 'bg-indigo-500', text: 'text-indigo-500', from: 'from-indigo-100', to: 'to-indigo-50' },
      { bg: 'bg-teal-500', text: 'text-teal-500', from: 'from-teal-100', to: 'to-teal-50' },
    ];
    
    const colorIndex = (floorNum - 1) % colors.length;
    return {
      bgColor: colors[colorIndex].bg,
      textColor: colors[colorIndex].text,
      gradientFrom: colors[colorIndex].from,
      gradientTo: colors[colorIndex].to
    };
  };

  return (
    <div className="h-full bg-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-200 rounded-full opacity-20"></div>
      </div>

      {/* Connection status indicator */}
      {!socketConnected && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-yellow-800 px-4 py-1 text-xs font-medium flex items-center justify-center z-20">
          <div className="animate-pulse h-2 w-2 bg-yellow-500 rounded-full mr-2"></div>
          Reconnecting...
        </div>
      )}
      
      {/* Search input */}
      <div className="sticky top-0 z-10 pt-4 px-4 pb-2 bg-gray-50 backdrop-blur-sm bg-opacity-90">
        <div className="relative flex items-center bg-white rounded-xl shadow-sm">
          <Search className="absolute left-3 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search residents or flats..."
            className="w-full pl-10 pr-12 py-3 bg-transparent border-none rounded-xl focus:outline-none text-sm"
          />
          {searchQuery && (
            <button 
              className="absolute right-3 w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200"
              onClick={() => setSearchQuery('')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Residents List */}
      <div className="relative overflow-auto z-0 h-full pb-24 pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 p-6">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-blue-100"></div>
              <div className="mt-4 h-4 w-32 bg-gray-200 rounded-full"></div>
              <div className="mt-2 h-3 w-24 bg-gray-200 rounded-full"></div>
              <div className="mt-8 space-y-4 w-full max-w-md">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-4 bg-white p-3 rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-gray-100"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
                      <div className="mt-2 h-3 bg-gray-100 rounded-full w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : Object.keys(hierarchicalResidents).length === 0 ? (
          <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center h-64">
            <div className="mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full h-24 w-24 flex items-center justify-center shadow-inner">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <p className="font-bold text-lg text-gray-800">No residents found</p>
            <p className="text-sm mt-2 max-w-xs mx-auto text-gray-500">
              Try adjusting your search or check back later
            </p>
          </div>
        ) : (
          <div className="px-4 space-y-4 pt-2">
            {Object.keys(hierarchicalResidents)
              .sort()
              .map(building => {
                const buildingData = hierarchicalResidents[building];
                const unreadCount = buildingData.unreadCount;
                const isExpanded = expandedBuildings[building];
                const variant = getBuildingVariant(building);
                
                return (
                  <div key={building} className="overflow-hidden bg-white rounded-xl shadow-sm">
                    {/* Building header */}
                    <div 
                      className={`px-4 py-3 flex items-center justify-between cursor-pointer
                        ${unreadCount > 0 ? `bg-gradient-to-r ${variant.gradientFrom} ${variant.gradientTo}` : 'bg-white'}`}
                      onClick={() => toggleBuilding(building)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-full ${variant.bgColor} bg-opacity-20 flex items-center justify-center`}>
                          <div className={`${variant.textColor}`}>
                            {variant.icon}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-gray-800">
                            {building === 'Unknown' ? 'Other Residents' : `Building ${building}`}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {Object.keys(buildingData.floors).length} {Object.keys(buildingData.floors).length === 1 ? 'floor' : 'floors'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                            {unreadCount}
                          </div>
                        )}
                        
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center
                          ${isExpanded ? 'bg-gray-100' : 'bg-gray-50'}`}>
                          {isExpanded ? 
                            <ChevronUp className="text-gray-500 h-5 w-5" /> : 
                            <ChevronDown className="text-gray-500 h-5 w-5" />
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Floors list */}
                    {isExpanded && (
                      <div className="animate-fadeIn">
                        {Object.keys(buildingData.floors)
                          .sort()
                          .map(floor => {
                            const floorData = buildingData.floors[floor];
                            const floorUnreadCount = floorData.unreadCount;
                            const floorKey = `${building}-${floor}`;
                            const isFloorExpanded = expandedFloors[floorKey];
                            const floorVariant = getFloorVariant(floor);
                            
                            return (
                              <div key={floorKey} className="border-t border-gray-100">
                                {/* Floor header */}
                                <div 
                                  className={`px-4 py-2 flex items-center justify-between cursor-pointer pl-12
                                    ${floorUnreadCount > 0 ? `bg-gradient-to-r ${floorVariant.gradientFrom} ${floorVariant.gradientTo}` : 'bg-white hover:bg-gray-50'}`}
                                  onClick={() => toggleFloor(floorKey)}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`h-8 w-8 rounded-full ${floorVariant.bgColor} bg-opacity-20 flex items-center justify-center`}>
                                      <div className={`${floorVariant.textColor}`}>
                                        <Layers size={16} />
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium text-gray-800">
                                        {floor === 'Unknown' ? 'Other Flats' : `Floor ${floor}`}
                                      </h4>
                                      <p className="text-xs text-gray-500">
                                        {floorData.residents.length} {floorData.residents.length === 1 ? 'resident' : 'residents'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    {floorUnreadCount > 0 && (
                                      <div className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {floorUnreadCount}
                                      </div>
                                    )}
                                    
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center
                                      ${isFloorExpanded ? 'bg-gray-100' : 'bg-gray-50'}`}>
                                      {isFloorExpanded ? 
                                        <ChevronUp className="text-gray-500 h-4 w-4" /> : 
                                        <ChevronDown className="text-gray-500 h-4 w-4" />
                                      }
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Residents in this floor */}
                                {isFloorExpanded && (
                                  <div className="animate-fadeIn divide-y divide-gray-100">
                                    {floorData.residents.map(resident => {
                                      const hasUnread = hasUnreadMessages(resident._id);
                                      
                                      return (
                                        <div 
                                          key={resident._id} 
                                          onClick={() => onChatSelect(resident)}
                                          className={`flex items-center transition-all duration-150 gap-3 p-3 pl-16
                                            ${hasUnread ? `bg-gradient-to-r ${floorVariant.gradientFrom} ${floorVariant.gradientTo}` : 'hover:bg-gray-50'}`}
                                        >
                                          {/* Profile picture */}
                                          <div className="relative flex-shrink-0">
                                            <div className="h-12 w-12 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                                              {resident.userImage ? (
                                                <img 
                                                  src={resident.userImage} 
                                                  alt={resident.name} 
                                                  className="h-full w-full object-cover"
                                                  loading="lazy"
                                                />
                                              ) : (
                                                <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                  <User className="text-gray-400" size={20} />
                                                </div>
                                              )}
                                            </div>
                                            
                                            {/* Online status indicator */}
                                            <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white
                                              ${resident.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            
                                            {/* Unread message badge */}
                                            {hasUnread && (
                                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                                                {unreadCounts[resident._id]}
                                              </div>
                                            )}
                                          </div>
                                          
                                          {/* Resident info */}
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 truncate">
                                              {resident.name}
                                            </h4>
                                            
                                            <div className="flex items-center mt-1 text-sm text-gray-600 font-medium">
                                              {resident.flatDetails?.flatNumber ? `Flat ${resident.flatDetails.flatNumber}` : 'Resident'}
                                            </div>
                                            
                                            {/* <div className="flex items-center mt-1 text-xs text-gray-500">
                                              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                              <span className="truncate">
                                                {resident.isOnline ? 'Online' : formatLastSeen(resident.lastSeen)}
                                              </span>
                                            </div> */}
                                          </div>
                                          
                                          {/* Action buttons */}
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onChatSelect(resident);
                                              }}
                                              className={`rounded-full p-2 flex items-center justify-center ${floorVariant.bgColor} bg-opacity-20 ${floorVariant.textColor}`}
                                              title="Chat"
                                              aria-label={`Chat with ${resident.name}`}
                                            >
                                              <MessageSquare size={16} />
                                            </button>
                                            
                                            {/* <button
                                              onClick={(e) => handleCall(resident, e)}
                                              className="bg-green-100 text-green-600 rounded-full p-2 flex items-center justify-center"
                                              title={resident.phoneNumber ? `Call ${resident.phoneNumber}` : "Start call"}
                                              aria-label={`Call ${resident.name}`}
                                            >
                                              <Phone size={16} />
                                            </button> */}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 p-3 flex justify-between items-center shadow-lg z-10">
        <div className="text-xs text-gray-500">
          {filteredResidents.length} {filteredResidents.length === 1 ? 'resident' : 'residents'} found
        </div>
        <div className="flex space-x-2">
          <button 
            className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors flex items-center"
            onClick={() => {
              // Expand all buildings
              const allBuildings = {};
              Object.keys(hierarchicalResidents).forEach(building => {
                allBuildings[building] = true;
              });
              setExpandedBuildings(allBuildings);
            }}
          >
            <ChevronDown className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Expand All</span>
            <span className="sm:hidden">Expand</span>
          </button>
          <button 
            className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors flex items-center"
            onClick={() => {
              // Collapse all
              setExpandedBuildings({});
              setExpandedFloors({});
            }}
          >
            <ChevronUp className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Collapse All</span>
            <span className="sm:hidden">Collapse</span>
          </button>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}