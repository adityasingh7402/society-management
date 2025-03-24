import connectToDatabase from "../../../lib/mongodb";
import Society from "../../../models/Society";
import Resident from "../../../models/Resident";

export default async function handler(req, res) {
    if (req.method === 'POST') {
        let { societyId, blockName, floorIndex, flatNumber, residentId } = req.body;
        
        // Convert to 0-based index (for array access)
        const floorIndexZeroBased = floorIndex - 1;

        if (!societyId || !blockName || floorIndex === undefined || !flatNumber || !residentId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        await connectToDatabase();
        console.log(societyId, blockName, floorIndex, flatNumber, residentId);

        try {
            // Get the society document
            const society = await Society.findOne({ societyId });
            if (!society) {
                return res.status(404).json({ message: 'Society ID not found' });
            }

            // Fix all structures and floors first to ensure validation will pass
            if (!society.apartmentStructure) {
                society.apartmentStructure = { structures: [] };
            }
            
            if (!society.apartmentStructure.structures) {
                society.apartmentStructure.structures = [];
            }
            
            // Fix all structures - ensure every floor has a floorNumber
            society.apartmentStructure.structures.forEach((structure, structureIndex) => {
                if (!structure.floors) {
                    structure.floors = [];
                }
                
                structure.floors.forEach((floor, floorIndex) => {
                    if (!floor.floorNumber) {
                        floor.floorNumber = (floorIndex + 1).toString();
                    }
                    
                    if (!floor.flats) {
                        floor.flats = [];
                    }
                });
            });
            
            // Now handle the specific block/floor/flat update
            
            // Find the block
            let blockIndex = society.apartmentStructure.structures.findIndex(
                b => b.blockName === blockName
            );

            // If block doesn't exist, create it
            if (blockIndex === -1) {
                society.apartmentStructure.structures.push({
                    blockName: blockName,
                    structureType: 'block',
                    floors: []
                });
                
                blockIndex = society.apartmentStructure.structures.length - 1;
            }

            // Get the current structure type or custom structure name
            let currentStructureType = 'block'; // Default value
            const structure = society.apartmentStructure.structures[blockIndex];
            if (structure) {
                currentStructureType = structure.customStructureName || structure.structureType || 'block';
            }

            // Ensure the floor exists
            while (society.apartmentStructure.structures[blockIndex].floors.length <= floorIndexZeroBased) {
                const newFloorIndex = society.apartmentStructure.structures[blockIndex].floors.length;
                society.apartmentStructure.structures[blockIndex].floors.push({
                    floorNumber: (newFloorIndex + 1).toString(),
                    flats: []
                });
            }

            // Get the floor
            const floor = society.apartmentStructure.structures[blockIndex].floors[floorIndexZeroBased];
            
            // Find or create the flat
            let flatIndex = floor.flats.findIndex(f => f.flatNumber === flatNumber);
            
            if (flatIndex === -1) {
                floor.flats.push({
                    flatNumber: flatNumber,
                    residents: []
                });
                flatIndex = floor.flats.length - 1;
            }

            // Get the resident
            const resident = await Resident.findById(residentId);
            if (!resident) {
                return res.status(404).json({ message: 'Resident not found' });
            }

            // Add the resident to the flat if not already there
            const residentIdStr = resident._id.toString();
            const flatResidentExists = floor.flats[flatIndex].residents.some(
                id => id.toString() === residentIdStr
            );
            
            if (!flatResidentExists) {
                floor.flats[flatIndex].residents.push(resident._id);
            }
            
            // Add resident to society's residents array if not already there
            if (!society.residents) {
                society.residents = [];
            }
            
            const societyResidentExists = society.residents.some(
                id => id.toString() === residentIdStr
            );
            
            if (!societyResidentExists) {
                society.residents.push(resident._id);
            }
            
            // Update resident's flat details with structure type
            resident.flatDetails = { 
                blockName, 
                floorIndex, 
                flatNumber,
                structureType: currentStructureType
            };

            // Save changes to both models
            await resident.save();
            
            // Make sure Mongoose knows the nested structure has been modified
            society.markModified('apartmentStructure');
            await society.save();

            res.status(201).json({ message: 'Flat details stored successfully in both models' });
        } catch (error) {
            console.error('Error in storing flat details:', error);
            res.status(500).json({
                message: 'Internal server error',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}