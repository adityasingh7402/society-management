import connectToDatabase from "../../../lib/mongodb";
import Resident from "../../../models/Resident";

export default async function handler(req, res) {
    if (req.method === 'POST') {
        let { blockName, floorIndex, flatNumber, residentId, structureType } = req.body;

        if (!blockName || floorIndex === undefined || !flatNumber || !residentId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        try {
            await connectToDatabase();

            // Get the resident
            const resident = await Resident.findById(residentId);
            if (!resident) {
                return res.status(404).json({ message: 'Resident not found' });
            }

            // Update resident's flat details with the provided structure type
            resident.flatDetails = { 
                blockName, 
                floorIndex, 
                flatNumber,
                structureType: structureType || 'block' // Use provided structureType, fallback to 'block' if not provided
            };

            // Save changes to resident
            await resident.save();

            res.status(200).json({ 
                message: 'Flat details updated successfully',
                flatDetails: resident.flatDetails
            });

        } catch (error) {
            console.error('Error updating flat details:', error);
            res.status(500).json({
                message: 'Internal server error',
                error: error.message
            });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}