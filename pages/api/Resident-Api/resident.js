import connectToDatabase from "../../../lib/mongodb";
import Resident from '../../../models/Resident';
import Society from '../../../models/Society';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectToDatabase();
        
        const {
            name,
            phone,
            email,
            societyId,
            societyName,
            street,
            city,
            state,
            pinCode
        } = req.body;

        // Validate required fields
        if (!name || !phone || !email || !societyId || !societyName) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if resident already exists
        const existingResident = await Resident.findOne({ phone });
        if (existingResident) {
            return res.status(400).json({ message: 'Resident already exists with this phone number' });
        }

        // Find society by societyId (which is actually the society code)
        const society = await Society.findOne({ societyId });
        if (!society) {
            return res.status(404).json({ message: 'Society not found' });
        }

        // Create new resident with proper structure
        const resident = new Resident({
            name,
            phone,
            email,
            societyId: society._id,
            societyCode: societyId,
            societyName,
            address: {
                societyName,
                street,
                city,
                state,
                pinCode
            }
        });

        await resident.save();
        return res.status(201).json({ message: 'Resident signed up successfully!' });

    } catch (error) {
        console.error('Error in resident signup:', error);
        return res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
}