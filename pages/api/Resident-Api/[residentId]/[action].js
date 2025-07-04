import connectToDatabase from '../../../../lib/mongodb';
import Resident from '../../../../models/Resident';
import Society from '../../../../models/Society';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const { residentId, action } = req.query;
    const { flatDetails, adminDetails } = req.body;

    await connectToDatabase();

    try {
      // First, get the resident details
      const resident = await Resident.findById(residentId);
      
      if (!resident) {
        return res.status(404).json({ message: 'Resident not found' });
      }

      // Update the resident's status
      resident.societyVerification = action;
      
      // Update flat details if provided
      if (flatDetails) {
        resident.flatDetails = flatDetails;
      }

      // Add admin approval details if action is 'Approved'
      if (action === 'Approved' && adminDetails) {
        resident.approvedBy = {
          adminId: adminDetails.adminId,
          adminName: adminDetails.adminName,
          approvedAt: adminDetails.approvedAt
        };
      }
      
      await resident.save();

      // If action is 'Approved', update the flat's residents array
      if (action === 'Approved' && resident.flatDetails) {
        const { blockName, floorIndex, flatNumber } = resident.flatDetails;
        
        // Validate required fields
        if (!blockName || floorIndex === undefined || !flatNumber) {
          return res.status(400).json({ message: 'Missing required flat details' });
        }

        // Get the society using societyId
        const society = await Society.findOne({ _id: resident.societyId });
        
        if (!society) {
          return res.status(404).json({ message: 'Society not found' });
        }

        // Ensure apartmentStructure exists
        if (!society.apartmentStructure) {
          society.apartmentStructure = { structures: [] };
        }
        
        if (!society.apartmentStructure.structures) {
          society.apartmentStructure.structures = [];
        }

        // Fix all existing structures first
        society.apartmentStructure.structures.forEach((structure) => {
          if (!structure.floors) {
            structure.floors = [];
          }
          
          structure.floors.forEach((floor, idx) => {
            if (!floor.floorNumber) {
              floor.floorNumber = (idx + 1).toString();
            }
            
            if (!floor.flats) {
              floor.flats = [];
            }
          });
        });

        // Convert to 0-based index for array access
        const floorIndexZeroBased = floorIndex - 1;

        // Find or create the block
        let blockIndex = society.apartmentStructure.structures.findIndex(
          b => b.blockName === blockName
        );

        if (blockIndex === -1) {
          society.apartmentStructure.structures.push({
            blockName: blockName,
            structureType: 'block',
            floors: []
          });
          blockIndex = society.apartmentStructure.structures.length - 1;
        }

        // Get the current structure type
        const structure = society.apartmentStructure.structures[blockIndex];
        const currentStructureType = structure.customStructureName || structure.structureType || 'block';

        // Ensure the floor exists with proper floor number
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

        // Add resident to flat if not already there
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
        await resident.save();

        // Save changes to society
        society.markModified('apartmentStructure');
        await society.save();
      }

      res.status(200).json({ 
        message: `Resident ${action} successfully!`,
        resident: resident
      });
    } catch (error) {
      console.error('Error updating resident status:', error);
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