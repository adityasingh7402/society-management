import React from 'react';

const BlockSelector = ({
  structuredResidents,
  selectedBlock,
  onSelectBlock,
  className = ""
}) => {
  return (
    <div className={`space-y-4 ${className} max-h-[50vh] overflow-y-auto pr-1`}>
      {Object.keys(structuredResidents).length > 0 ? (
        Object.keys(structuredResidents).sort().map((blockName) => {
          // Count residents in this block
          const residentCount = Object.values(structuredResidents[blockName]).reduce((acc, floor) => {
            return acc + Object.values(floor).reduce((acc2, flat) => acc2 + flat.length, 0);
          }, 0);
          
          return (
            <div 
              key={blockName}
              className={`p-4 border rounded-md cursor-pointer ${
                selectedBlock === blockName 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelectBlock(blockName)}
            >
              <div className="font-medium">Block {blockName}</div>
              <div className="text-sm text-gray-500">
                {residentCount} residents
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center p-4 text-gray-500">
          No blocks found
        </div>
      )}
    </div>
  );
};

export default BlockSelector; 