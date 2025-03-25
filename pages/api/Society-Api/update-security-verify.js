import connectToDatabase from '../../../lib/mongodb';
import Security from '../../../models/Security';

export default async function handler(req, res) {
    // Ensure database connection
    await connectToDatabase();

    // Only allow PUT method
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Extract both securityId and status from query parameters
        const { securityId, status } = req.query;

        // Validate inputs
        if (!securityId || !status) {
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
            return res.status(404).json({ error: 'Security profile not found.' });
        }

        // Return successful response
        return res.status(200).json({
            success: true,
            message: `Security guard status updated to ${status}`,
            data: updatedSecurity
        });

    } catch (error) {
        console.error('Error updating security profile status:', error);

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