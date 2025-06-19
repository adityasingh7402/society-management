import connectToDatabase from "../../../lib/mongodb";
import VehicleTag from "../../../models/VehicleTag";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { tagId, status } = req.body;

    if (!tagId || !status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    // Find and update the tag
    const updatedTag = await VehicleTag.findByIdAndUpdate(
      tagId,
      { status },
      { new: true }
    );

    if (!updatedTag) {
      return res.status(404).json({ message: 'Vehicle tag not found' });
    }

    res.status(200).json({
      message: `Vehicle tag ${status.toLowerCase()} successfully`,
      data: updatedTag
    });

  } catch (error) {
    console.error('Error updating vehicle tag:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 