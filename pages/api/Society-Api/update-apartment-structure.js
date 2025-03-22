import connectToDatabase from '../../../lib/mongodb'; // Import the DB connection helper
import Society from '../../../models/Society'; // Import your Society model

export default async function handler(req, res) {
  await connectToDatabase(); // Ensure the database connection is established

  if (req.method === 'PUT') {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Token missing.' });
      }

      // Assume you have token verification logic here
      // const user = verifyToken(token); // Replace with your token verification logic
      // if (!user) {
      //   return res.status(403).json({ error: 'Forbidden: Invalid token.' });
      // }

      const { societyId, apartmentStructure, structureType, customStructureName } = req.body;
      
      if (!societyId || !apartmentStructure) {
        return res.status(400).json({ error: 'Society ID and apartment structure are required.' });
      }

      // Prepare update object
      const updateObj = { apartmentStructure };
      
      // Add structure type if provided
      if (structureType) {
        updateObj.structureType = structureType;
      }
      
      // Add custom structure name if provided
      if (structureType === 'custom' && customStructureName) {
        updateObj.customStructureName = customStructureName;
      }

      // Find the society by ID and update its apartment structure and structure settings
      const updatedSociety = await Society.findOneAndUpdate(
        { societyId }, // Find by societyId
        { $set: updateObj }, // Update the apartment structure and structure type settings
        { new: true } // Return the updated document
      );

      if (!updatedSociety) {
        return res.status(404).json({ error: 'Society not found.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Apartment structure updated successfully!',
        data: {
          apartmentStructure: updatedSociety.apartmentStructure,
          structureType: updatedSociety.structureType,
          customStructureName: updatedSociety.customStructureName
        },
      });
    } catch (error) {
      console.error('Error updating apartment structure:', error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      const { societyId } = req.query;
      
      if (!societyId) {
        return res.status(400).json({ error: 'Society ID is required.' });
      }
      
      const society = await Society.findOne({ societyId });
      
      if (!society) {
        return res.status(404).json({ error: 'Society not found.' });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          apartmentStructure: society.apartmentStructure,
          structureType: society.structureType,
          customStructureName: society.customStructureName
        }
      });
    } catch (error) {
      console.error('Error fetching apartment structure:', error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}