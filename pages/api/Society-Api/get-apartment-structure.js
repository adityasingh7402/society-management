import connectToDatabase from '../../../lib/mongodb'; // Import the DB connection helper
import Society from '../../../models/Society'; // Import your Society model
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  await connectToDatabase(); // Ensure the database connection is established

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { societyId } = req.query;

    if (!societyId) {
      await logFailure('APARTMENT_STRUCTURE_FETCH', req, 'Missing societyId parameter', {
        query: req.query
      });
      return res.status(400).json({ error: 'Society ID is required.' });
    }

    // Find the society by ID
    const society = await Society.findOne({ societyId });

    if (!society) {
      await logFailure('APARTMENT_STRUCTURE_FETCH', req, 'Society not found', { societyId });
      return res.status(404).json({ error: 'Society not found.' });
    }

    // If apartmentStructure does not exist, return an empty object
    const apartmentStructure = society.apartmentStructure || { structures: [] };

    // Extract structureType and customStructureName from the first block (if it exists)
    const firstBlock = apartmentStructure.structures[0] || {};
    const structureType = firstBlock.structureType || society.societyStructureType || 'block';
    const customStructureName = firstBlock.customStructureName || society.customStructureTypeName || '';

    // Calculate structure statistics for logging
    const structureStats = {
      totalBlocks: apartmentStructure.structures.length,
      totalFloors: apartmentStructure.structures.reduce((sum, block) => sum + (block.floors?.length || 0), 0),
      totalFlats: apartmentStructure.structures.reduce((sum, block) => 
        sum + (block.floors?.reduce((floorSum, floor) => floorSum + (floor.flats?.length || 0), 0) || 0), 0
      ),
      structureType,
      customStructureName
    };

    // Log successful fetch
    await logSuccess('APARTMENT_STRUCTURE_FETCH', req, {
      societyId,
      structureStats,
      hasStructure: apartmentStructure.structures.length > 0
    }, societyId, 'Society');

    return res.status(200).json({
      success: true,
      data: apartmentStructure,
      structureType,
      customStructureName,
    });
  } catch (error) {
    console.error('Error fetching apartment structure:', error);
    
    // Log the failure
    await logFailure('APARTMENT_STRUCTURE_FETCH', req, error.message, {
      societyId: req.query?.societyId,
      errorType: error.name
    });
    
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}