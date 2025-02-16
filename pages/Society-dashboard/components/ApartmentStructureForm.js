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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {blocks.map((block, blockIndex) => (
        <div key={blockIndex} className="border p-4 rounded">
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
              className="ml-2 p-2 bg-red-500 text-white rounded"
            >
              Remove Block
            </button>
          </div>
          <button
            type="button"
            onClick={() => addFloor(blockIndex)}
            className="mt-2 p-2 bg-blue-500 text-white rounded"
          >
            Add Floor
          </button>
          {block.floors.map((floor, floorIndex) => (
            <div key={floorIndex} className="ml-4 mt-4 border-l p-4">
              <div className="flex justify-between items-center">
                <h3>Floor {floorIndex + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeFloor(blockIndex, floorIndex)}
                  className="ml-2 p-2 bg-red-500 text-white rounded"
                >
                  Remove Floor
                </button>
              </div>
              <button
                type="button"
                onClick={() => addFlat(blockIndex, floorIndex)}
                className="mt-2 p-2 bg-green-500 text-white rounded"
              >
                Add Flat
              </button>
              {floor.flats.map((flat, flatIndex) => (
                <div key={flatIndex} className="ml-4 mt-4">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      placeholder="Flat Number (e.g., A-101)"
                      value={flat.flatNumber}
                      onChange={(e) => {
                        const updatedBlocks = [...blocks];
                        updatedBlocks[blockIndex].floors[floorIndex].flats[flatIndex].flatNumber = e.target.value;
                        setBlocks(updatedBlocks);
                      }}
                      className="w-full p-2 border rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeFlat(blockIndex, floorIndex, flatIndex)}
                      className="ml-2 p-2 bg-red-500 text-white rounded"
                    >
                      Remove Flat
                    </button>
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
        className="p-2 bg-purple-500 text-white rounded"
      >
        Add Block
      </button>
      <button type="submit" className="p-2 bg-green-600 text-white rounded">
        Save Structure
      </button>
    </form>
  );
}