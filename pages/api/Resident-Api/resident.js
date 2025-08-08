import connectToDatabase from "../../../lib/mongodb";
import Resident from '../../../models/Resident';
import Society from '../../../models/Society';
import { logSuccess, logFailure } from '../../../services/loggingService';

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
            await logFailure('RESIDENT_SIGNUP', req, 'Missing required fields', {
                providedFields: { name: !!name, phone: !!phone, email: !!email, societyId: !!societyId, societyName: !!societyName },
                errorType: 'VALIDATION_ERROR'
            });
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if resident already exists
        const existingResident = await Resident.findOne({ phone });
        if (existingResident) {
            await logFailure('RESIDENT_SIGNUP', req, 'Resident already exists with this phone number', {
                phone,
                existingResidentId: existingResident._id.toString(),
                errorType: 'DUPLICATE_RESIDENT'
            });
            return res.status(400).json({ message: 'Resident already exists with this phone number' });
        }

        // Find society by societyId (which is actually the society code)
        const society = await Society.findOne({ societyId });
        if (!society) {
            await logFailure('RESIDENT_SIGNUP', req, 'Society not found', {
                societyId,
                name,
                phone,
                errorType: 'SOCIETY_NOT_FOUND'
            });
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
        
        // Log successful resident signup
        await logSuccess('RESIDENT_SIGNUP', req, {
            message: 'Resident signed up successfully',
            residentId: resident._id.toString(),
            name: resident.name,
            phone: resident.phone,
            email: resident.email,
            societyId: society._id.toString(),
            societyCode: societyId,
            societyName
        }, resident._id.toString(), 'resident');
        
        return res.status(201).json({ message: 'Resident signed up successfully!' });

    } catch (error) {
        console.error('Error in resident signup:', error);
        
        // Log failure
        await logFailure('RESIDENT_SIGNUP', req, 'Failed to create resident signup', {
            errorMessage: error.message,
            errorType: error.name || 'UNKNOWN_ERROR',
            name: req.body?.name,
            phone: req.body?.phone,
            societyId: req.body?.societyId
        });
        
        return res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
}