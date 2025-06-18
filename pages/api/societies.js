import connectToDatabase from '../../lib/mongodb';
import Society from '../../models/Society';

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectToDatabase();

        const { pincode, search } = req.query;
        let query = {};

        // If pincode is provided, filter by it
        if (pincode) {
            query.pinCode = pincode;
        }

        // If search term is provided, filter by society name
        if (search) {
            query.societyName = { $regex: search, $options: 'i' };
        }

        const societies = await Society.find(query)
            .select('societyName street city state pinCode societyId')
            .sort({ societyName: 1 })
            .limit(50); // Limit results for better performance

        if (societies.length === 0) {
            return res.status(200).json({
                societies: [],
                message: pincode 
                    ? `No societies found for PIN code ${pincode}`
                    : 'No societies found'
            });
        }

        res.status(200).json({
            societies,
            message: 'Societies fetched successfully',
            total: societies.length
        });

    } catch (error) {
        console.error('Error in societies API:', error);
        res.status(500).json({
            error: "Failed to fetch societies",
            message: error.message
        });
    }
};

export default handler;
