import connectToDatabase from "../../../../lib/mongodb";
import AnimalTag from "../../../../models/AnimalTag";

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { tagId } = req.query;
    const updateData = req.body;

    // Find and update the tag
    const updatedTag = await AnimalTag.findByIdAndUpdate(
      tagId,
      updateData,
      { new: true }
    );

    if (!updatedTag) {
      return res.status(404).json({ message: 'Animal tag not found' });
    }

    res.status(200).json({
      message: 'Animal tag updated successfully',
      data: updatedTag
    });

  } catch (error) {
    console.error('Error updating animal tag:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 