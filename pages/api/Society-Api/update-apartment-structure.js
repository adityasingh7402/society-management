import connectToDatabase from '../../../lib/mongodb'; // Import the DB connection helper
import Society from '../../../models/Society'; // Import your Society model
import jwt from 'jsonwebtoken';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  await connectToDatabase(); // Ensure the database connection is established

  if (req.method === 'PUT') {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        await logFailure('APARTMENT_STRUCTURE_UPDATE', req, 'No authorization token provided');
        return res.status(401).json({ error: 'Unauthorized: Token missing.' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded) {
        await logFailure('APARTMENT_STRUCTURE_UPDATE', req, 'Invalid authorization token');
        return res.status(403).json({ error: 'Forbidden: Invalid token.' });
      }

      const { societyId, apartmentStructure, structureType, customStructureName } = req.body;

      if (!societyId || !apartmentStructure) {
        await logFailure('APARTMENT_STRUCTURE_UPDATE', req, 'Missing required fields: societyId or apartmentStructure', {
          societyId: societyId || 'missing',
          hasApartmentStructure: !!apartmentStructure
        });
        return res.status(400).json({ error: 'Society ID and apartment structure are required.' });
      }

      // Validate apartmentStructure
      if (!Array.isArray(apartmentStructure.structures)) {
        await logFailure('APARTMENT_STRUCTURE_UPDATE', req, 'Invalid apartment structure format', {
          societyId,
          structureType: typeof apartmentStructure.structures
        });
        return res.status(400).json({ error: 'Invalid apartment structure format.' });
      }

      // Get existing structure for comparison
      const existingSociety = await Society.findOne({ societyId });
      if (!existingSociety) {
        await logFailure('APARTMENT_STRUCTURE_UPDATE', req, 'Society not found', { societyId });
        return res.status(404).json({ error: 'Society not found.' });
      }

      // Calculate structure statistics
      const structureStats = {
        totalBlocks: apartmentStructure.structures.length,
        totalFloors: apartmentStructure.structures.reduce((sum, block) => sum + block.floors.length, 0),
        totalFlats: apartmentStructure.structures.reduce((sum, block) => 
          sum + block.floors.reduce((floorSum, floor) => floorSum + floor.flats.length, 0), 0
        ),
        structureType: structureType || 'block',
        customStructureName: customStructureName || null
      };

      // Find the society by ID and update its apartment structure
      const updatedSociety = await Society.findOneAndUpdate(
        { societyId }, // Find by societyId
        { 
          $set: { 
            apartmentStructure,
            societyStructureType: structureType,
            customStructureTypeName: customStructureName
          } 
        }, // Update the apartment structure
        { new: true } // Return the updated document
      );

      // Log successful update
      await logSuccess('APARTMENT_STRUCTURE_UPDATE', req, {
        societyId,
        structureStats,
        blockNames: apartmentStructure.structures.map(block => block.blockName).filter(Boolean),
        changesApplied: true
      }, societyId, 'Society');

      return res.status(200).json({
        success: true,
        message: 'Apartment structure updated successfully!',
        data: {
          apartmentStructure: updatedSociety.apartmentStructure,
        },
      });
    } catch (error) {
      console.error('Error updating apartment structure:', error);
      
      // Log the failure
      await logFailure('APARTMENT_STRUCTURE_UPDATE', req, error.message, {
        societyId: req.body?.societyId,
        errorType: error.name,
        hasToken: !!req.headers.authorization
      });
      
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      const { societyId } = req.query;

      if (!societyId) {
        await logFailure('APARTMENT_STRUCTURE_VIEW', req, 'Missing societyId parameter', {
          query: req.query
        });
        return res.status(400).json({ error: 'Society ID is required.' });
      }

      const society = await Society.findOne({ societyId });

      if (!society) {
        await logFailure('APARTMENT_STRUCTURE_VIEW', req, 'Society not found', { societyId });
        return res.status(404).json({ error: 'Society not found.' });
      }

      // Calculate structure statistics for logging
      const structureStats = society.apartmentStructure?.structures ? {
        totalBlocks: society.apartmentStructure.structures.length,
        totalFloors: society.apartmentStructure.structures.reduce((sum, block) => sum + (block.floors?.length || 0), 0),
        totalFlats: society.apartmentStructure.structures.reduce((sum, block) => 
          sum + (block.floors?.reduce((floorSum, floor) => floorSum + (floor.flats?.length || 0), 0) || 0), 0
        ),
        structureType: society.societyStructureType || 'block'
      } : { totalBlocks: 0, totalFloors: 0, totalFlats: 0 };

      // Log successful view
      await logSuccess('APARTMENT_STRUCTURE_VIEW', req, {
        societyId,
        structureStats,
        hasStructure: !!society.apartmentStructure
      }, societyId, 'Society');

      return res.status(200).json({
        success: true,
        data: {
          apartmentStructure: society.apartmentStructure,
        },
      });
    } catch (error) {
      console.error('Error fetching apartment structure:', error);
      
      // Log the failure
      await logFailure('APARTMENT_STRUCTURE_VIEW', req, error.message, {
        societyId: req.query?.societyId,
        errorType: error.name
      });
      
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}