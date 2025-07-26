import React from 'react';

const FloorSelector = ({
  structuredResidents,
  selectedBlock,
  selectedFloor,
  onSelectBlock,
  onSelectFloor,
  className = ""
}) => {
  // Count residents per floor for the selected block
  const getFloorResidentCount = (blockName, floorNumber) => {
    if (!structuredResidents[blockName] || !structuredResidents[blockName][floorNumber]) {
      return 0;
    }
    
    return Object.values(structuredResidents[blockName][floorNumber]).reduce(
      (total, residents) => total + residents.length, 0
    );
  };

  return (
    <div className={className}>
      {/* Block selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
        <select 
          className="w-full px-3 py-2 border rounded-md"
          value={selectedBlock}
          onChange={(e) => {
            onSelectBlock(e.target.value);
            onSelectFloor(''); // Reset floor when block changes
          }}
        >
          <option value="">Select Block</option>
          {Object.keys(structuredResidents).sort().map((blockName) => (
            <option key={blockName} value={blockName}>Block {blockName}</option>
          ))}
        </select>
      </div>
      
      {/* Floor selector - only show if block is selected */}
      {selectedBlock && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
          <div className="space-y-2 mt-2 max-h-[40vh] overflow-y-auto pr-1">
            {structuredResidents[selectedBlock] && 
              Object.keys(structuredResidents[selectedBlock]).length > 0 ? (
                Object.keys(structuredResidents[selectedBlock]).sort().map((floorNumber) => {
                  const residentCount = getFloorResidentCount(selectedBlock, floorNumber);
                  
                  return (
                    <div 
                      key={floorNumber}
                      className={`p-3 border rounded-md cursor-pointer ${
                        selectedFloor === floorNumber 
                          ? 'bg-purple-50 border-purple-300' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => onSelectFloor(floorNumber)}
                    >
                      <div className="font-medium">Floor {floorNumber}</div>
                      <div className="text-sm text-gray-500">
                        {residentCount} residents
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-4 text-gray-500">
                  No floors found in this block
                </div>
              )
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorSelector; 