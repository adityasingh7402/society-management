import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';
import { ChevronDown, ChevronUp, Home, Layers, Grid, Plus, Trash2, Save, Building, Settings, Check, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ApartmentStructureForm() {
  const [blocks, setBlocks] = useState([{ blockName: '', floors: [{ flats: [{ flatNumber: '', residents: [] }] }], isOpen: true }]);
  const [loading, setLoading] = useState(true);
  const [structureType, setStructureType] = useState('block');
  const [customStructureName, setCustomStructureName] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const router = useRouter();

  // Notification animation variants
  const notificationVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 12
      }
    },
    exit: {
      opacity: 0,
      y: -50,
      transition: {
        duration: 0.3
      }
    }
  };

  // Show notification helper function
  const showNotification = (type, message, duration = 5000) => {
    setNotification({
      show: true,
      type,
      message
    });

    // Auto hide notification after duration
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, duration);
  };

  // Sort flats by their number
  const sortFlats = (flats) => {
    return [...flats].sort((a, b) => {
      // Extract numeric part from flat numbers
      const getNumericPart = (flatNumber) => {
        if (!flatNumber) return -1;
        const match = flatNumber.match(/\d+$/);
        return match ? parseInt(match[0]) : -1;
      };

      const numA = getNumericPart(a.flatNumber);
      const numB = getNumericPart(b.flatNumber);
      return numA - numB;
    });
  };

  // Validate flat number format
  const isValidFlatNumber = (value) => {
    // Allow empty value
    if (!value) return true;
    // Only allow numbers
    return /^\d+$/.test(value);
  };

  // Get structure type label (singular)
  const getStructureLabel = () => {
    // Convert to lowercase for comparison since database uses lowercase
    const type = structureType.toLowerCase();
    if (type === 'block') return 'Block';
    if (type === 'wing') return 'Wing';
    if (type === 'tower') return 'Tower';
    if (type === 'custom') return customStructureName || 'Unit';
    return 'Block';
  };

  // Get the structure icon
  const getStructureIcon = () => {
    const type = structureType.toLowerCase();
    if (type === 'tower') return <Building className="mr-2" size={20} />;
    return <Home className="mr-2" size={20} />;
  };

  // Fetch society details and apartment structure
  useEffect(() => {
    const fetchSocietyAndStructure = async () => {
      setLoading(true);
      try {
        // Fetch society details
        const token = localStorage.getItem('Society');
        if (!token) {
          router.push('/societyLogin');
          return;
        }

        const societyResponse = await fetch('/api/Society-Api/get-society-details', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!societyResponse.ok) {
          throw new Error('Failed to fetch society details');
        }

        const societyData = await societyResponse.json();
        const societyId = societyData.societyId;

        // Set structure type from society data (convert to lowercase for consistency)
        if (societyData.societyStructureType) {
          setStructureType(societyData.societyStructureType.toLowerCase());
        }
        if (societyData.customStructureTypeName) {
          setCustomStructureName(societyData.customStructureTypeName);
        }

        // Fetch apartment structure using societyId
        const structureResponse = await fetch(`/api/Society-Api/get-apartment-structure?societyId=${societyId}`);
        if (!structureResponse.ok) {
          throw new Error('Failed to fetch apartment structure');
        }

        const structureData = await structureResponse.json();

        // Add isOpen property to each block and floor for dropdown functionality
        // and sort flats within each floor
        const blocksWithOpenState = (structureData.data.structures || [{ blockName: '', floors: [{ flats: [{ flatNumber: '', residents: [] }] }] }])
          .map(block => ({
            ...block,
            isOpen: true,
            floors: block.floors.map(floor => ({
              ...floor,
              flats: sortFlats(floor.flats),
              isOpen: true
            }))
          }));

        setBlocks(blocksWithOpenState);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSocietyAndStructure();
  }, [router]);

  // Toggle block dropdown
  const toggleBlock = (blockIndex) => {
    const updatedBlocks = [...blocks];
    updatedBlocks[blockIndex].isOpen = !updatedBlocks[blockIndex].isOpen;
    setBlocks(updatedBlocks);
  };

  // Toggle floor dropdown
  const toggleFloor = (blockIndex, floorIndex) => {
    const updatedBlocks = [...blocks];
    updatedBlocks[blockIndex].floors[floorIndex].isOpen = !updatedBlocks[blockIndex].floors[floorIndex].isOpen;
    setBlocks(updatedBlocks);
  };

  // Add a new block
  const addBlock = () => {
    setBlocks([...blocks, { blockName: '', floors: [{ flats: [{ flatNumber: '', residents: [] }], isOpen: true }], isOpen: true }]);
  };

  // Remove a block
  const removeBlock = (blockIndex) => {
    const updatedBlocks = blocks.filter((_, index) => index !== blockIndex);
    setBlocks(updatedBlocks);
  };

  // Add a new floor to a block
  const addFloor = (blockIndex) => {
    const updatedBlocks = [...blocks];
    updatedBlocks[blockIndex].floors.push({ flats: [{ flatNumber: '', residents: [] }], isOpen: true });
    setBlocks(updatedBlocks);
  };

  // Remove a floor from a block
  const removeFloor = (blockIndex, floorIndex) => {
    const updatedBlocks = [...blocks];
    updatedBlocks[blockIndex].floors = updatedBlocks[blockIndex].floors.filter((_, index) => index !== floorIndex);
    setBlocks(updatedBlocks);
  };

  // Add a new flat to a floor
  const addFlat = (blockIndex, floorIndex) => {
    const updatedBlocks = [...blocks];
    const newFlat = { flatNumber: '', residents: [] };
    updatedBlocks[blockIndex].floors[floorIndex].flats.push(newFlat);
    setBlocks(updatedBlocks);
  };

  // Remove a flat from a floor
  const removeFlat = (blockIndex, floorIndex, flatIndex) => {
    const updatedBlocks = [...blocks];
    updatedBlocks[blockIndex].floors[floorIndex].flats = updatedBlocks[blockIndex].floors[floorIndex].flats.filter(
      (_, index) => index !== flatIndex
    );
    setBlocks(updatedBlocks);
  };

  // Update flat number
  const updateFlatNumber = (blockIndex, floorIndex, flatIndex, value) => {
    // Validate the input
    if (!isValidFlatNumber(value)) {
      showNotification('error', 'Please enter only numbers for the flat number.');
      return;
    }

    const updatedBlocks = [...blocks];
    const blockName = updatedBlocks[blockIndex].blockName;

    if (value === '') {
      updatedBlocks[blockIndex].floors[floorIndex].flats[flatIndex].flatNumber = '';
    } else {
      updatedBlocks[blockIndex].floors[floorIndex].flats[flatIndex].flatNumber =
        blockName ? `${blockName}-${value}` : value;
    }

    // No sorting here - keep the order as is
    setBlocks(updatedBlocks);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // Fetch societyId from the token
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();
      const societyId = societyData.societyId;

      // Clean up the blocks data before sending (remove isOpen property)
      const cleanedBlocks = blocks.map(block => ({
        blockName: block.blockName,
        structureType: structureType.toLowerCase(),
        customStructureName: structureType.toLowerCase() === 'custom' ? customStructureName : '',
        floors: block.floors.map(floor => ({
          flats: floor.flats.map(flat => ({
            flatNumber: flat.flatNumber,
            residents: flat.residents
          }))
        }))
      }));

      // Update apartment structure
      const response = await fetch('/api/Society-Api/update-apartment-structure', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          societyId,
          apartmentStructure: { structures: cleanedBlocks },
          structureType: structureType.toLowerCase(),
          customStructureName: structureType.toLowerCase() === 'custom' ? customStructureName : ''
        }),
      });

      const data = await response.json();
      if (response.ok) {
        showNotification('success', 'Apartment structure updated successfully!');
      } else {
        console.error('Error updating apartment structure:', data.error);
        showNotification('error', 'Failed to update apartment structure.');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('error', 'An error occurred while updating the apartment structure.');
    }
  };

  // Check if flat is occupied
  const isFlatOccupied = (flat) => {
    return flat.residents && flat.residents.length > 0;
  };

  // Get flat number display value
  const getFlatNumberDisplayValue = (fullFlatNumber, blockIndex) => {
    if (!fullFlatNumber) {
      return '';
    }

    const blockName = blocks[blockIndex]?.blockName;
    if (blockName && fullFlatNumber === `${blockName}-`) {
      return '';
    }

    return blockName && fullFlatNumber.startsWith(`${blockName}-`)
      ? fullFlatNumber.substring(blockName.length + 1)
      : fullFlatNumber;
  };

  return (
    <div className="container mx-auto p-4">
      {/* Notification Popup */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            className="fixed top-5 left-0 right-0 mx-auto z-50 px-6 py-4 rounded-lg shadow-lg flex items-center max-w-md w-11/12 sm:w-full"
            style={{
              margin: '0 auto',
              backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
              borderLeft: notification.type === 'success' ? '4px solid #22c55e' : '4px solid #ef4444'
            }}
            variants={notificationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="rounded-full p-2 mr-3"
              style={{
                backgroundColor: notification.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: notification.type === 'success' ? '#16a34a' : '#dc2626'
              }}
            >
              {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-1">
              <h3
                className="font-medium"
                style={{ color: notification.type === 'success' ? '#166534' : '#991b1b' }}
              >
                {notification.type === 'success' ? 'Success' : 'Error'}
              </h3>
              <p
                className="text-sm"
                style={{ color: notification.type === 'success' ? '#15803d' : '#b91c1c' }}
              >
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification({ ...notification, show: false })}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <PreloaderSociety />
      ) : (
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6 mb-10">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 flex items-center justify-center">
            <Building className="mr-2" size={28} /> Apartment Structure Management
          </h1>

          {/* Structure Type Information */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center mb-2">
              <Settings className="mr-2" size={20} />
              <h2 className="text-lg font-semibold">Structure Configuration</h2>
            </div>
            <div className="text-gray-700">
              Current Structure Type: <span className="font-semibold">{getStructureLabel()}</span>
              {structureType.toLowerCase() === 'custom' && customStructureName && (
                <span className="ml-2">({customStructureName})</span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {blocks.map((block, blockIndex) => (
              <div key={blockIndex} className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleBlock(blockIndex)}
                >
                  <div className="flex items-center flex-grow">
                    {getStructureIcon()}
                    <input
                      type="text"
                      placeholder={`${getStructureLabel()} Name (e.g., A, B, C)`}
                      value={block.blockName}
                      onChange={(e) => {
                        const updatedBlocks = [...blocks];
                        updatedBlocks[blockIndex].blockName = e.target.value;
                        setBlocks(updatedBlocks);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white text-gray-800 p-2 rounded w-full max-w-xs"
                    />
                  </div>

                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBlock(blockIndex);
                      }}
                      className="mr-2 p-2 text-white bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    {block.isOpen ? <ChevronUp className="text-white" size={20} /> : <ChevronDown className="text-white" size={20} />}
                  </div>
                </div>

                {block.isOpen && (
                  <div className="p-4">
                    <button
                      type="button"
                      onClick={() => addFloor(blockIndex)}
                      className="mb-4 flex items-center bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-all"
                    >
                      <Layers className="mr-1" size={16} />
                      <Plus size={16} className="mr-1" />
                      Add Floor
                    </button>

                    {block.floors.map((floor, floorIndex) => (
                      <div key={floorIndex} className="mb-4 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-400 to-purple-600 p-3 flex justify-between items-center cursor-pointer"
                          onClick={() => toggleFloor(blockIndex, floorIndex)}
                        >
                          <div className="flex items-center text-white font-medium">
                            <Layers className="mr-2" size={18} />
                            Floor {floorIndex + 1}
                          </div>

                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFloor(blockIndex, floorIndex);
                              }}
                              className="mr-2 p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                            {floor.isOpen ? <ChevronUp className="text-white" size={18} /> : <ChevronDown className="text-white" size={18} />}
                          </div>
                        </div>

                        {floor.isOpen && (
                          <div className="p-4">
                            <button
                              type="button"
                              onClick={() => addFlat(blockIndex, floorIndex)}
                              className="mb-4 flex items-center bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-all"
                            >
                              <Grid className="mr-1" size={16} />
                              <Plus size={16} className="mr-1" />
                              Add Flat
                            </button>

                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                              {floor.flats.map((flat, flatIndex) => (
                                <div key={flatIndex} className="bg-white p-4 border rounded-lg shadow-sm">
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <label className="text-sm font-medium text-gray-700 mb-1">Flat Number</label>
                                      <button
                                        type="button"
                                        onClick={() => removeFlat(blockIndex, floorIndex, flatIndex)}
                                        className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Flat Number (e.g., 101)"
                                      value={getFlatNumberDisplayValue(flat.flatNumber, blockIndex)}
                                      onChange={(e) => updateFlatNumber(blockIndex, floorIndex, flatIndex, e.target.value)}
                                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                                    />

                                    <div className="mt-3 flex flex-col">
                                      <div className="text-xs text-gray-500 mb-2">
                                        Full ID: {flat.flatNumber || 'Not set'}
                                      </div>

                                      {isFlatOccupied(flat) ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          Occupied
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                          Vacant
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={addBlock}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-all"
              >
                <Plus size={16} className="mr-1" />
                Add {getStructureLabel()}
              </button>

              <button
                type="submit"
                className="flex items-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-all"
              >
                <Save size={16} className="mr-1" />
                Save Structure
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}