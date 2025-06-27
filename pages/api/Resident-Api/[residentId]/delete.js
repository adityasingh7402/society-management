import connectToDatabase from '../../../../lib/mongodb';
import Resident from '../../../../models/Resident';
import Society from '../../../../models/Society';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { residentId } = req.query;

  try {
    await connectToDatabase();

    // Get the resident to find their society and flat details
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Get the society to update its structure
    const society = await Society.findById(resident.societyId);
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }

    // Find and remove resident from the flat's residents array
    if (resident.flatDetails) {
      const { blockName, floorIndex, flatNumber } = resident.flatDetails;
      
      // Find the block
      const block = society.apartmentStructure.structures.find(
        structure => structure.blockName === blockName
      );

      if (block) {
        // Get the floor (floorIndex is 1-based)
        const floor = block.floors[floorIndex - 1];
        
        if (floor) {
          // Find the flat
          const flat = floor.flats.find(f => f.flatNumber === flatNumber);
          
          if (flat) {
            // Remove resident from flat's residents array
            const residentIdStr = resident._id.toString();
            flat.residents = flat.residents.filter(id => id.toString() !== residentIdStr);
          }
        }
      }
    }

    // Remove resident from society's residents array
    if (society.residents) {
      const residentIdStr = resident._id.toString();
      society.residents = society.residents.filter(id => id.toString() !== residentIdStr);
    }

    // Save society changes
    society.markModified('apartmentStructure');
    await society.save();

    // Delete the resident
    await Resident.findByIdAndDelete(residentId);

    res.status(200).json({ message: 'Resident deleted successfully' });
  } catch (error) {
    console.error('Error deleting resident:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 