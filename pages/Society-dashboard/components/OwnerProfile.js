import React, { useEffect, useState } from 'react';
import Preloader from '@/pages/components/Preloader';
import { ChevronDown, ChevronUp, Home, Layers, Grid, User } from 'lucide-react';

export default function OwnerProfile() {
  const [residentList, setResidentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [structuredResidents, setStructuredResidents] = useState({});
  const [openBlocks, setOpenBlocks] = useState({});
  const [openFloors, setOpenFloors] = useState({});
  const [openFlats, setOpenFlats] = useState({});

  // Fetch residents from the API
  useEffect(() => {
    const fetchResidents = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/Resident-Api/getAllResidents');
        if (response.ok) {
          const data = await response.json();
          setResidentList(data);
          organizeResidentsByStructure(data);
        } else {
          console.error('Failed to fetch residents');
        }
      } catch (error) {
        console.error('Error fetching residents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  // Organize residents by block, floor and flat
  const organizeResidentsByStructure = (residents) => {
    const structure = {};
    const blockOpenState = {};
    const floorOpenState = {};
    const flatOpenState = {};

    residents.forEach(resident => {
      if (!resident.flatDetails || !resident.flatDetails.flatNumber) return;
      
      // Parse flat number format (e.g., "A-101" where A is block and 101 is flat number)
      const flatNumberParts = resident.flatDetails.flatNumber.split('-');
      if (flatNumberParts.length !== 2) return;
      
      const blockName = flatNumberParts[0];
      const flatNumber = flatNumberParts[1];
      const floorNumber = flatNumber.substring(0, 1); // Assuming first digit of flat number is floor
      
      // Initialize block if it doesn't exist
      if (!structure[blockName]) {
        structure[blockName] = {};
        blockOpenState[blockName] = false; // Default closed
      }
      
      // Initialize floor if it doesn't exist
      if (!structure[blockName][floorNumber]) {
        structure[blockName][floorNumber] = {};
        floorOpenState[`${blockName}-${floorNumber}`] = false; // Default closed
      }
      
      // Initialize flat if it doesn't exist
      if (!structure[blockName][floorNumber][flatNumber]) {
        structure[blockName][floorNumber][flatNumber] = [];
        flatOpenState[`${blockName}-${flatNumber}`] = false; // Default closed
      }
      
      // Add resident to the flat
      structure[blockName][floorNumber][flatNumber].push(resident);
    });
    
    // Set first block open
    const blocks = Object.keys(structure).sort();
    if (blocks.length > 0) {
      const firstBlock = blocks[0];
      blockOpenState[firstBlock] = true;
      
      // Set first floor of first block open
      const floors = Object.keys(structure[firstBlock]).sort();
      if (floors.length > 0) {
        const firstFloor = floors[0];
        floorOpenState[`${firstBlock}-${firstFloor}`] = true;
        
        // Set all flats in the first floor closed
        Object.keys(structure[firstBlock][firstFloor]).forEach(flatNumber => {
          flatOpenState[`${firstBlock}-${flatNumber}`] = false;
        });
      }
    }
    
    setStructuredResidents(structure);
    setOpenBlocks(blockOpenState);
    setOpenFloors(floorOpenState);
    setOpenFlats(flatOpenState);
  };

  // Toggle functions for dropdowns
  const toggleBlock = (blockName) => {
    setOpenBlocks(prev => ({
      ...prev,
      [blockName]: !prev[blockName]
    }));
  };

  const toggleFloor = (blockFloorKey) => {
    setOpenFloors(prev => ({
      ...prev,
      [blockFloorKey]: !prev[blockFloorKey]
    }));
  };

  const toggleFlat = (flatKey) => {
    // Extract block and floor from flatKey (e.g., "A-101" -> "A" and "1")
    const blockName = flatKey.split('-')[0];
    const flatNumber = flatKey.split('-')[1];
    const floorNumber = flatNumber.substring(0, 1);
    
    // Create a new state object
    const newOpenFlats = { ...openFlats };
    
    // Close all flats in the same floor
    Object.keys(structuredResidents[blockName][floorNumber]).forEach(flat => {
      newOpenFlats[`${blockName}-${flat}`] = false;
    });
    
    // Toggle the selected flat
    newOpenFlats[flatKey] = !openFlats[flatKey];
    
    setOpenFlats(newOpenFlats);
  };

  // Handle approval or rejection of a resident
  const handleAction = async (residentId, action) => {
    try {
      const response = await fetch(`/api/Resident-Api/${residentId}/${action}`, {
        method: 'PUT',
      });

      if (response.ok) {
        // Update the resident list locally
        setResidentList(prevResidents =>
          prevResidents.map(resident =>
            resident._id === residentId
              ? { ...resident, societyVerification: action }
              : resident
          )
        );
        
        // Re-organize structured data
        organizeResidentsByStructure(
          residentList.map(resident =>
            resident._id === residentId
              ? { ...resident, societyVerification: action }
              : resident
          )
        );
      } else {
        console.error('Failed to update resident status');
      }
    } catch (error) {
      console.error('Error updating resident status:', error);
    }
  };

  // Handle removal of a resident
  const handleRemove = async (residentId) => {
    const confirmRemove = window.confirm('Are you sure you want to remove this resident?');
    if (confirmRemove) {
      try {
        const response = await fetch(`/api/Resident-Api/${residentId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove the resident from the list locally
          const updatedResidents = residentList.filter(resident => resident._id !== residentId);
          setResidentList(updatedResidents);
          
          // Re-organize structured data
          organizeResidentsByStructure(updatedResidents);
        } else {
          console.error('Failed to remove resident');
        }
      } catch (error) {
        console.error('Error removing resident:', error);
      }
    }
  };

  if (loading) {
    return <Preloader />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Society Resident Profiles</h1>
          <p className="mt-2 text-sm text-gray-600">Manage and monitor all resident profiles in your society</p>
        </div>
      </header>

      {Object.keys(structuredResidents).length > 0 ? (
        <div className="max-w-7xl mx-auto space-y-6">
          {Object.keys(structuredResidents).sort().map(blockName => (
            <div key={blockName} className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl">
              {/* Block Header */}
              <div 
                className="bg-gradient-to-r from-blue-600 to-blue-800 p-5 flex justify-between items-center cursor-pointer hover:from-blue-700 hover:to-blue-900 transition-all duration-200"
                onClick={() => toggleBlock(blockName)}
              >
                <div className="flex items-center text-white font-bold text-xl">
                  <Home className="mr-3" size={24} />
                  Block {blockName}
                </div>
                <div className="flex items-center text-white text-sm">
                  <span className="mr-3">{Object.keys(structuredResidents[blockName]).length} Floors</span>
                  {openBlocks[blockName] ? (
                    <ChevronUp size={24} />
                  ) : (
                    <ChevronDown size={24} />
                  )}
                </div>
              </div>

              {/* Block Content */}
              {openBlocks[blockName] && (
                <div className="p-4 bg-gray-50">
                  {Object.keys(structuredResidents[blockName]).sort().map(floorNumber => (
                    <div key={`${blockName}-${floorNumber}`} className="mb-4 bg-white rounded-lg shadow-md overflow-hidden">
                      {/* Floor Header */}
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-indigo-700 p-4 flex justify-between items-center cursor-pointer hover:from-indigo-600 hover:to-indigo-800 transition-all duration-200"
                        onClick={() => toggleFloor(`${blockName}-${floorNumber}`)}
                      >
                        <div className="flex items-center text-white font-medium">
                          <Layers className="mr-2" size={20} />
                          Floor {floorNumber}
                        </div>
                        {openFloors[`${blockName}-${floorNumber}`] ? (
                          <ChevronUp className="text-white" size={20} />
                        ) : (
                          <ChevronDown className="text-white" size={20} />
                        )}
                      </div>

                      {/* Flat Cards Grid */}
                      {openFloors[`${blockName}-${floorNumber}`] && (
                        <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                          {Object.keys(structuredResidents[blockName][floorNumber]).sort().map(flatNumber => (
                            <div key={`${blockName}-${flatNumber}`} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden h-auto">
                              <div 
                                className="bg-gradient-to-r from-teal-500 to-teal-700 p-3 flex justify-between items-center cursor-pointer"
                                onClick={() => toggleFlat(`${blockName}-${flatNumber}`)}
                              >
                                <div className="flex items-center text-white font-medium">
                                  <Grid className="mr-2" size={18} />
                                  Flat {flatNumber}
                                </div>
                                {openFlats[`${blockName}-${flatNumber}`] ? (
                                  <ChevronUp className="text-white" size={18} />
                                ) : (
                                  <ChevronDown className="text-white" size={18} />
                                )}
                              </div>

                              {/* Resident Cards */}
                              {openFlats[`${blockName}-${flatNumber}`] && (
                                <div className="divide-y divide-gray-100">
                                  {structuredResidents[blockName][floorNumber][flatNumber].map(resident => (
                                    <div key={resident._id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ring-offset-2 ring-blue-500">
                                          <img 
                                            className="w-full h-full object-cover" 
                                            src={resident.userImage || "/profile.png"} 
                                            alt={resident.name} 
                                            onError={(e) => {e.target.src = "/profile.png"}}
                                          />
                                        </div>
                                        
                                        <div className="flex-grow">
                                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            {resident.name}
                                          </h3>
                                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                                            <p>{resident.email}</p>
                                            <p>{resident.phone}</p>
                                            <p className="text-xs">{resident.address.street}, {resident.address.city}</p>
                                          </div>
                                        </div>

                                        <div className="sm:text-right flex flex-col items-start sm:items-end gap-2 mt-3 sm:mt-0">
                                          {resident.societyVerification === 'Pending' ? (
                                            <div className="flex flex-wrap gap-2 w-full justify-start sm:justify-end">
                                              <button
                                                onClick={() => handleAction(resident._id, 'Approved')}
                                                className="bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition duration-200 text-xs sm:text-sm font-medium whitespace-nowrap"
                                              >
                                                Approve
                                              </button>
                                              <button
                                                onClick={() => handleAction(resident._id, 'Rejected')}
                                                className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition duration-200 text-xs sm:text-sm font-medium whitespace-nowrap"
                                              >
                                                Reject
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex flex-col items-start sm:items-end gap-2">
                                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                resident.societyVerification === 'Approved' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                              }`}>
                                                {resident.societyVerification}
                                              </span>
                                              <button
                                                onClick={() => handleRemove(resident._id)}
                                                className="text-gray-600 hover:text-red-600 transition duration-200 text-sm"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <User size={48} className="text-gray-400" />
            <p className="text-xl text-gray-600">No residents found</p>
            <p className="text-sm text-gray-500">There are no residents registered in the system yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}