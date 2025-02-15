import connectToDatabase from '../../lib/mongodb';
import Society from '../../models/Society';

const handler = async (req, res) => {
    await connectToDatabase(); // Ensure the DB connection is established

    try {
        let societies = await Society.find();
        res.status(200).json({ societies });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch societies" });
    }
};

export default handler; // Ensure you're exporting a function
