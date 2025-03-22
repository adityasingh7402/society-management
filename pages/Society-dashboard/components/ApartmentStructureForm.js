import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Preloader from '@/pages/components/Preloader';
import { ChevronDown, ChevronUp, Home, Layers, Grid, Plus, Trash2, Save, Building, Settings } from 'lucide-react';

export default function ApartmentStructureForm() {
  const [blocks, setBlocks] = useState([{ blockName: '', floors: [{ flats: [{ flatNumber: '', residents: [] }] }], isOpen: true }]);
  const [loading, setLoading] = useState(true);
  const [structureType, setStructureType] = useState('block');
  const [customStructureName, setCustomStructureName] = useState('');
  const router = useRouter();

  // Get structure type label (singular)
  const getStructureLabel = () => {
    if (structureType === 'block') return 'Block';
    if (structureType === 'wing') return 'Wing';
    if (structureType === 'tower') return 'Tower';
    if (structureType === 'custom') return customStructureName || 'Unit';
    return 'Block';
  };

  // Get structure type label (plural)
  const getStructureLabelPlural = () => {
    if (structureType === 'block') return 'Blocks';
    if (structureType === 'wing') return 'Wings';
    if (structureType === 'tower') return 'Towers';
    if (structureType === 'custom') return `${customStructureName}s` || 'Units';
    return 'Blocks';
  };

  // Get the structure icon
  const getStructureIcon = () => {
    if (structureType === 'tower') return <Building className="mr-2" size={20} />;
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

        // Fetch apartment structure using societyId
        const structureResponse = await fetch(`/api/Society-Api/update-apartment-structure?societyId=${societyId}`);
        if (!structureResponse.ok) {
          throw new Error('Failed to fetch apartment structure');
        }

        const structureData = await structureResponse.json();
        
        // Set structure type and custom name if available
        if (structureData.data.structureType) {
          setStructureType(structureData.data.structureType);
        }
        

        if (structureData.data.customStructureName) {
          setCustomStructureName(structureData.data.customStructureName);
        }
        
        // Add isOpen property to each block and floor for dropdown functionality
        const blocksWithOpenState = (structureData.data.apartmentStructure || [{ blockName: '', floors: [{ flats: [{ flatNumber: '', residents: [] }] }] }])
          .map(block => ({
            ...block,
            isOpen: true,
            floors: block.floors.map(floor => ({
              ...floor,
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

  console.log(structureType)
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
    updatedBlocks[blockIndex].floors[floorIndex].flats.push({ flatNumber: '', residents: [] });
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
        floors: block.floors.map(floor => ({
          flats: floor.flats
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
          apartmentStructure: cleanedBlocks,
          structureType,
          customStructureName: structureType === 'custom' ? customStructureName : ''
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Apartment structure updated successfully!');
      } else {
        console.error('Error updating apartment structure:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
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

  // Update flat number
  const updateFlatNumber = (blockIndex, floorIndex, flatIndex, value) => {
    const updatedBlocks = [...blocks];
    const blockName = updatedBlocks[blockIndex].blockName;
    
    if (value === '') {
      updatedBlocks[blockIndex].floors[floorIndex].flats[flatIndex].flatNumber = '';
    } else {
      updatedBlocks[blockIndex].floors[floorIndex].flats[flatIndex].flatNumber = 
        blockName ? `${blockName}-${value}` : value;
    }
    
    setBlocks(updatedBlocks);
  };

  if (loading) {
    return <Preloader />;
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6 mb-10">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 flex items-center justify-center">
        <Building className="mr-2" size={28} /> Apartment Structure Management
      </h1>
      
      {/* Structure Type Selection */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center mb-2">
          <Settings className="mr-2" size={20} />
          <h2 className="text-lg font-semibold">Structure Configuration</h2>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="structure-block"
              name="structureType"
              value="block"
              checked={structureType === 'block'}
              onChange={() => setStructureType('block')}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="structure-block" className="text-gray-700">Blocks</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="structure-wing"
              name="structureType"
              value="wing"
              checked={structureType === 'wing'}
              onChange={() => setStructureType('wing')}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="structure-wing" className="text-gray-700">Wings</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="structure-tower"
              name="structureType"
              value="tower"
              checked={structureType === 'tower'}
              onChange={() => setStructureType('tower')}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="structure-tower" className="text-gray-700">Towers</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="structure-custom"
              name="structureType"
              value="custom"
              checked={structureType === 'custom'}
              onChange={() => setStructureType('custom')}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="structure-custom" className="text-gray-700">Custom</label>
          </div>
        </div>
        
        {structureType === 'custom' && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Enter custom structure name (e.g., Building, Phase)"
              value={customStructureName}
              onChange={(e) => setCustomStructureName(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
            />
          </div>
        )}
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
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            type="button"
            onClick={addBlock}
            className="flex items-center bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-md transition-all shadow-md"
          >
            {getStructureIcon()}
            <Plus size={16} className="mr-1" />
            Add {getStructureLabel()}
          </button>
          
          <button 
            type="submit" 
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-all shadow-md"
          >
            <Save className="mr-1" size={16} />
            Save Structure
          </button>
        </div>
      </form>
    </div>
  );
}