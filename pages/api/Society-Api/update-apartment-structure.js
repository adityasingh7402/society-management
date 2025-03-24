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

      // Replace with your actual token verification logic
      // const user = verifyToken(token);
      // if (!user) {
      //   return res.status(403).json({ error: 'Forbidden: Invalid token.' });
      // }

      const { societyId, apartmentStructure } = req.body;

      if (!societyId || !apartmentStructure) {
        return res.status(400).json({ error: 'Society ID and apartment structure are required.' });
      }

      // Validate apartmentStructure (optional, depending on your needs)
      if (!Array.isArray(apartmentStructure.structures)) {
        return res.status(400).json({ error: 'Invalid apartment structure format.' });
      }

      // Find the society by ID and update its apartment structure
      const updatedSociety = await Society.findOneAndUpdate(
        { societyId }, // Find by societyId
        { $set: { apartmentStructure } }, // Update the apartment structure
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
        },
      });
    } catch (error) {
      console.error('Error fetching apartment structure:', error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}