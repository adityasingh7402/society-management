import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ApartmentStructureForm() {
  const [blocks, setBlocks] = useState([{ blockName: '', floors: [{ flats: [{ flatNumber: '', residents: [] }] }]}]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
        const societyId = societyData.societyId; // Extract societyId from the response

        // Fetch apartment structure using societyId
        const structureResponse = await fetch(`/api/Society-Api/get-apartment-structure?societyId=${societyId}`);
        if (!structureResponse.ok) {
          throw new Error('Failed to fetch apartment structure');
        }

        const structureData = await structureResponse.json();
        setBlocks(structureData.data || [{ blockName: '', floors: [{ flats: [{ flatNumber: '', residents: [] }] }]}]);
      } catch (error) {
        console.error('Error:', error);
        if (error.message === 'Failed to fetch society details' || error.message === 'Failed to fetch apartment structure') {
          // Handle the error (e.g., show a message or redirect)
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSocietyAndStructure();
  }, [router]);

  // Add a new block
  const addBlock = () => {
    setBlocks([...blocks, { blockName: '', floors: [{ flats: [{ flatNumber: '', residents: [] }] }]}]);
  };

  // Remove a block
  const removeBlock = (blockIndex) => {
    const updatedBlocks = blocks.filter((_, index) => index !== blockIndex);
    setBlocks(updatedBlocks);
  };

  // Add a new floor to a block
  const addFloor = (blockIndex) => {
    const updatedBlocks = [...blocks];
    updatedBlocks[blockIndex].floors.push({ flats: [{ flatNumber: '', residents: [] }] });
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

      // Update apartment structure
      const response = await fetch('/api/Society-Api/update-apartment-structure', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ societyId, apartmentStructure: blocks }),
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

  // Modify the getFlatNumberDisplayValue function to include blockIndex as a parameter
const getFlatNumberDisplayValue = (fullFlatNumber, blockIndex) => {
  // If there's no flat number, return empty string
  if (!fullFlatNumber) {
    return '';
  }
  
  // Extract the number part after the hyphen and block name
  const blockName = blocks[blockIndex]?.blockName;
  if (blockName && fullFlatNumber === `${blockName}-`) {
    return ''; // Return empty string if it's just the prefix
  }
  
  return blockName && fullFlatNumber.startsWith(`${blockName}-`) 
    ? fullFlatNumber.substring(blockName.length + 1) // +1 for the hyphen
    : fullFlatNumber;
};

// Update the updateFlatNumber function to handle backspace correctly
const updateFlatNumber = (blockIndex, floorIndex, flatIndex, value) => {
  const updatedBlocks = [...blocks];
  const blockName = updatedBlocks[blockIndex].blockName;
  
  // Only add the blockName prefix if value is not empty
  if (value === '') {
    // If user deletes everything, set flatNumber to empty string
    updatedBlocks[blockIndex].floors[floorIndex].flats[flatIndex].flatNumber = '';
  } else {
    // Otherwise, add the blockName prefix if blockName exists
    updatedBlocks[blockIndex].floors[floorIndex].flats[flatIndex].flatNumber = 
      blockName ? `${blockName}-${value}` : value;
  }
  
  setBlocks(updatedBlocks);
};

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {blocks.map((block, blockIndex) => (
        <div key={blockIndex} className="p-4 rounded">
          <div className="flex justify-between items-center">
            <input
              type="text"
              placeholder="Block Name (e.g., A, B, C)"
              value={block.blockName}
              onChange={(e) => {
                const updatedBlocks = [...blocks];
                updatedBlocks[blockIndex].blockName = e.target.value;
                setBlocks(updatedBlocks);
              }}
              className="w-full p-2 border rounded"
            />
            <button
              type="button"
              onClick={() => removeBlock(blockIndex)}
              className="ml-2 p-2 min-w-max text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              Remove Block
            </button>
          </div>
          <button
            type="button"
            onClick={() => addFloor(blockIndex)}
            className="mt-2 text-white bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
          >
            Add Floor
          </button>
          {block.floors.map((floor, floorIndex) => (
            <div key={floorIndex} className="ml-4 mt-4 border-l border-green-300 p-4">
              <div className="flex justify-between items-center">
                <h3>Floor {floorIndex + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeFloor(blockIndex, floorIndex)}
                  className="ml-2 p-2 text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
                >
                  Remove Floor
                </button>
              </div>
              <button
                type="button"
                onClick={() => addFlat(blockIndex, floorIndex)}
                className="mt-2 p-2 text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
              >
                Add Flat
              </button>
              {floor.flats.map((flat, flatIndex) => (
                <div key={flatIndex} className="ml-4 mt-4">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      placeholder="Flat Number (e.g., 101)"
                      value={getFlatNumberDisplayValue(flat.flatNumber, blockIndex)}
                      onChange={(e) => updateFlatNumber(blockIndex, floorIndex, flatIndex, e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeFlat(blockIndex, floorIndex, flatIndex)}
                      className="ml-2 p-2 min-w-max text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                    >
                      Remove Flat
                    </button>
                  </div>
                  {/* Display the full flat number (e.g., A-101) */}
                  <div className="mt-1 text-sm text-gray-600">
                    Full Flat Number: {flat.flatNumber}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={addBlock}
        className="p-2 text-white bg-pink-500 hover:bg-pink-600 focus:ring-4 focus:outline-none focus:ring-pink-300 dark:focus:ring-pink-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
      >
        Add Block
      </button>
      <button type="submit" className="p-2 text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">
        Save Structure
      </button>
    </form>
  );
}