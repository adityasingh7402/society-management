import connectToDatabase from '../../../lib/mongodb';
import Security from '../../../models/Security';
import { logSuccess, logFailure } from '../../../services/loggingService';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    // Ensure database connection
    await connectToDatabase();

    // Only allow PUT method
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Verify token and authorization
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        await logFailure('UPDATE_SECURITY_VERIFY', req, 'Unauthorized: Token missing');
        return res.status(401).json({ error: 'Unauthorized: Token missing' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        await logFailure('UPDATE_SECURITY_VERIFY', req, 'Unauthorized: Invalid token');
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    try {
        // Extract both securityId and status from query parameters
        const { securityId, status } = req.query;

        // Validate inputs
        if (!securityId || !status) {
            await logFailure('UPDATE_SECURITY_VERIFY', req, 'Both Security ID and status are required', {
                providedFields: { securityId: !!securityId, status: !!status },
                errorType: 'VALIDATION_ERROR'
            });
            return res.status(400).json({ 
                error: 'Both Security ID and status are required.' 
            });
        }

        // Update the security profile status
        const updatedSecurity = await Security.findByIdAndUpdate(
            securityId,
            { 
                societyVerification: status
            },
            { new: true } // Return the updated document
        );

        // Handle case where security profile is not found
        if (!updatedSecurity) {
            await logFailure('UPDATE_SECURITY_VERIFY', req, 'Security profile not found', {
                securityId,
                status,
                errorType: 'SECURITY_NOT_FOUND'
            });
            return res.status(404).json({ error: 'Security profile not found.' });
        }

        // Log successful security verification update
        await logSuccess('UPDATE_SECURITY_VERIFY', req, {
            securityId,
            guardName: updatedSecurity.guardName,
            guardPhone: updatedSecurity.guardPhone,
            previousStatus: 'unknown', // We don't have the previous status
            newStatus: status,
            societyId: updatedSecurity.societyId
        }, updatedSecurity._id, 'security_guard');

        // Return successful response
        return res.status(200).json({
            success: true,
            message: `Security guard status updated to ${status}`,
            data: updatedSecurity
        });

    } catch (error) {
        console.error('Error updating security profile status:', error);

        // Log the failure
        await logFailure('UPDATE_SECURITY_VERIFY', req, error.message, {
            securityId: req.query?.securityId,
            status: req.query?.status,
            errorType: error.name
        });

        // Handle specific MongoDB validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Validation Error', 
                details: Object.values(error.errors).map(err => err.message) 
            });
        }

        // Generic server error
        return res.status(500).json({ 
            error: 'Internal Server Error', 
            details: error.message 
        });
    }
}