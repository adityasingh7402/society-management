import connectToDatabase from '../../../../lib/mongodb';
import Resident from '../../../../models/Resident';
import Society from '../../../../models/Society';
import { logSuccess, logFailure } from '../../../../services/loggingService';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { residentId, action } = req.query;
  const { flatDetails } = req.body;

  await connectToDatabase();

  // Verify token and authorization
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await logFailure('RESIDENT_STATUS_UPDATE', req, 'Unauthorized: Token missing', {
      residentId,
      action,
      errorType: 'NO_TOKEN'
    });
    return res.status(401).json({ error: 'Unauthorized: Token missing' });
  }

  let adminDetails = null;
  let decoded = null;
  try {
    const token = authHeader.split(' ')[1];
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    adminDetails = {
      adminId: decoded.id,
      adminName: decoded.name,
      adminPhone: decoded.phone,
      approvedAt: new Date()
    };
  } catch (err) {
    await logFailure('RESIDENT_STATUS_UPDATE', req, 'Unauthorized: Invalid token', {
      residentId,
      action,
      errorType: 'INVALID_TOKEN'
    });
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

    try {
      // First, get the resident details
      const resident = await Resident.findById(residentId);
      
      if (!resident) {
        await logFailure('RESIDENT_STATUS_UPDATE', req, 'Resident not found', {
          residentId,
          action,
          errorType: 'RESIDENT_NOT_FOUND'
        });
        return res.status(404).json({ message: 'Resident not found' });
      }

      // Update the resident's status
      resident.societyVerification = action;
      
      // Update flat details if provided
      if (flatDetails) {
        resident.flatDetails = flatDetails;
      }

      // Add admin approval details if action is 'Approved' and adminDetails is available
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
          await logFailure('RESIDENT_STATUS_UPDATE', req, 'Missing required flat details', {
            residentId,
            action,
            residentName: resident.name,
            providedFlatDetails: { blockName, floorIndex, flatNumber },
            errorType: 'MISSING_FLAT_DETAILS'
          });
          return res.status(400).json({ message: 'Missing required flat details' });
        }

        // Get the society using societyId
        const society = await Society.findOne({ _id: resident.societyId });
        
        if (!society) {
          await logFailure('RESIDENT_STATUS_UPDATE', req, 'Society not found', {
            residentId,
            action,
            residentName: resident.name,
            societyId: resident.societyId,
            errorType: 'SOCIETY_NOT_FOUND'
          });
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

      // Log successful resident status update
      await logSuccess('RESIDENT_STATUS_UPDATE', req, {
        residentId: resident._id,
        residentName: resident.name,
        residentEmail: resident.email,
        residentPhone: resident.phone,
        action: action,
        previousStatus: resident.societyVerification,
        newStatus: action,
        societyName: resident.societyName,
        flatDetails: resident.flatDetails,
        approvedBy: adminDetails?.adminName || 'Unknown',
        approvedById: adminDetails?.adminId,
        approvedAt: new Date().toISOString()
      }, resident._id, 'resident');

      res.status(200).json({ 
        message: `Resident ${action} successfully!`,
        resident: resident
      });
    } catch (error) {
      console.error('Error updating resident status:', error);
      
      // Log the failure
      await logFailure('RESIDENT_STATUS_UPDATE', req, error.message, {
        residentId,
        action,
        errorType: error.name || 'UNKNOWN_ERROR',
        errorMessage: error.message
      });
      
      res.status(500).json({ 
        message: 'Internal server error', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
}