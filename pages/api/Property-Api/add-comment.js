import connectToDatabase from "../../../lib/mongodb";
import Property from "../../../models/Property";
import Resident from "../../../models/Resident";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();
    
    const { propertyId, residentId, residentName, residentImage, text } = req.body;
    
    if (!propertyId || !text || !residentId) {
      return res.status(400).json({ message: 'Property ID, resident ID and comment text are required' });
    }

    // Check if property and resident exist
    const property = await Property.findById(propertyId);
    const resident = await Resident.findById(residentId);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Create new comment object
    const newComment = {
      text: text,
      residentId: residentId,
      residentName: residentName || resident.name,
      residentImage: residentImage || resident.userImage,
      createdAt: new Date()
    };

    // Add comment to property
    await Property.findByIdAndUpdate(propertyId, {
      $push: { comments: newComment }
    });

    // Return updated comment list
    const updatedProperty = await Property.findById(propertyId);
    
    return res.status(200).json({
      message: 'Comment added successfully',
      comments: updatedProperty.comments
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 