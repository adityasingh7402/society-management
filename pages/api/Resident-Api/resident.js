import connectToDatabase from "../../../lib/mongodb";
import Resident from '../../../models/Resident';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { db } = await connectToDatabase();
        const {
            name,
            phone,
            email,
            societyId,
            societyName,
            street,
            city,
            state,
            pinCode,
            fcmToken
        } = req.body;

        // Validate required fields
        if (!name || !phone || !email || !societyId || !societyName) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if resident already exists with the same phone number
        const existingResident = await Resident.findOne({ phone });
        if (existingResident) {
            return res.status(400).json({ message: 'A resident with this phone number already exists' });
        }

        // Create new resident
        const resident = new Resident({
            name,
            phone,
            email,
            societyId,
            societyName,
            address: {
                street,
                city,
                state,
                pinCode
            },
            fcmToken,
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await resident.save();

        return res.status(201).json({ message: 'Resident signed up successfully!' });
    } catch (error) {
        console.error('Error in resident signup:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}