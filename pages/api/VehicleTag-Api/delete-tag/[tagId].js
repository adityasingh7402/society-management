import connectToDatabase from "../../../../lib/mongodb";
import VehicleTag from "../../../../models/VehicleTag";

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { tagId } = req.query;

    // Find and delete the tag
    const deletedTag = await VehicleTag.findByIdAndDelete(tagId);

    if (!deletedTag) {
      return res.status(404).json({ message: 'Vehicle tag not found' });
    }

    res.status(200).json({ message: 'Vehicle tag deleted successfully' });

  } catch (error) {
    console.error('Error deleting vehicle tag:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 