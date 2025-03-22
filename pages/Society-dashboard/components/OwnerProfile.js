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
    setOpenFlats(prev => ({
      ...prev,
      [flatKey]: !prev[flatKey]
    }));
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
      <h1 className="text-3xl font-bold mb-6 text-black text-center">Society Resident Profiles</h1>
      
      {Object.keys(structuredResidents).length > 0 ? (
        <div className="space-y-6">
          {Object.keys(structuredResidents).sort().map(blockName => (
            <div key={blockName} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Block Header */}
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 flex justify-between items-center cursor-pointer"
                onClick={() => toggleBlock(blockName)}
              >
                <div className="flex items-center text-white font-bold text-xl">
                  <Home className="mr-3" size={24} />
                  Block {blockName}
                </div>
                <div>
                  {openBlocks[blockName] ? (
                    <ChevronUp className="text-white" size={24} />
                  ) : (
                    <ChevronDown className="text-white" size={24} />
                  )}
                </div>
              </div>
              
              {/* Block Content */}
              {openBlocks[blockName] && (
                <div className="p-4">
                  {Object.keys(structuredResidents[blockName]).sort().map(floorNumber => (
                    <div key={`${blockName}-${floorNumber}`} className="mb-4 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      {/* Floor Header */}
                      <div 
                        className="bg-gradient-to-r from-purple-400 to-purple-600 p-3 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleFloor(`${blockName}-${floorNumber}`)}
                      >
                        <div className="flex items-center text-white font-medium">
                          <Layers className="mr-2" size={20} />
                          Floor {floorNumber}
                        </div>
                        <div>
                          {openFloors[`${blockName}-${floorNumber}`] ? (
                            <ChevronUp className="text-white" size={20} />
                          ) : (
                            <ChevronDown className="text-white" size={20} />
                          )}
                        </div>
                      </div>
                      
                      {/* Floor Content */}
                      {openFloors[`${blockName}-${floorNumber}`] && (
                        <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                          {Object.keys(structuredResidents[blockName][floorNumber]).sort().map(flatNumber => (
                            <div key={`${blockName}-${flatNumber}`} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                              {/* Flat Header */}
                              <div 
                                className="bg-gradient-to-r from-green-400 to-green-600 p-3 flex justify-between items-center cursor-pointer"
                                onClick={() => toggleFlat(`${blockName}-${flatNumber}`)}
                              >
                                <div className="flex items-center text-white font-medium">
                                  <Grid className="mr-2" size={18} />
                                  Flat {flatNumber}
                                </div>
                                <div>
                                  {openFlats[`${blockName}-${flatNumber}`] ? (
                                    <ChevronUp className="text-white" size={18} />
                                  ) : (
                                    <ChevronDown className="text-white" size={18} />
                                  )}
                                </div>
                              </div>
                              
                              {/* Flat Content - Residents */}
                              {openFlats[`${blockName}-${flatNumber}`] && (
                                <div className="divide-y divide-gray-200">
                                  {structuredResidents[blockName][floorNumber][flatNumber].map(resident => (
                                    <div key={resident._id} className="p-4">
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        {/* Resident Image */}
                                        <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                                          <img 
                                            className="w-full h-full object-cover" 
                                            src={resident.userImage || "/profile.png"} 
                                            alt={resident.name} 
                                          />
                                        </div>
                                        
                                        {/* Resident Details */}
                                        <div className="flex-grow">
                                          <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <User size={16} className="text-gray-500" />
                                            {resident.name}
                                          </h3>
                                          <p className="text-sm text-gray-600">
                                            <span className="font-semibold">Email:</span> {resident.email}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            <span className="font-semibold">Phone:</span> {resident.phone}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            <span className="font-semibold">Address:</span> {resident.address.street}, {resident.address.city}, {resident.address.state} - {resident.address.pinCode}
                                          </p>
                                        </div>
                                        
                                        {/* Status & Actions */}
                                        <div className="sm:text-right flex flex-col items-start sm:items-end gap-2 mt-2 sm:mt-0">
                                          {resident.societyVerification === 'Pending' ? (
                                            <>
                                              <button
                                                onClick={() => handleAction(resident._id, 'Approved')}
                                                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition duration-200 text-sm"
                                              >
                                                Approve
                                              </button>
                                              <button
                                                onClick={() => handleAction(resident._id, 'Rejected')}
                                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition duration-200 text-sm"
                                              >
                                                Reject
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                  resident.societyVerification === 'Approved' 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-red-100 text-red-800'
                                                }`}
                                              >
                                                {resident.societyVerification === 'Approved' ? 'Verified' : 'Rejected'}
                                              </span>
                                              <button
                                                onClick={() => handleRemove(resident._id)}
                                                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition duration-200 text-sm mt-1"
                                              >
                                                Remove
                                              </button>
                                            </>
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
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-lg text-gray-600">No residents found or residents data not properly structured.</p>
        </div>
      )}
    </div>
  );
}