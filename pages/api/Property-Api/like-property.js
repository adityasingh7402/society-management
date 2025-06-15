import connectToDatabase from "../../../lib/mongodb";
import Property from "../../../models/Property";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();
    
    // Authorization check
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    
    const { propertyId, residentId } = req.body;
    
    if (!propertyId || !residentId) {
      return res.status(400).json({ message: 'Property ID and Resident ID are required' });
    }

    // Find property
    const property = await Property.findById(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user has already liked the property
    const likeIndex = property.likes.indexOf(residentId);
    let liked;
    let update;

    if (likeIndex === -1) {
      // Add like
      update = { $push: { likes: residentId } };
      liked = true;
    } else {
      // Remove like
      update = { $pull: { likes: residentId } };
      liked = false;
    }

    // Use findOneAndUpdate to bypass validation of existing comments
    await Property.findOneAndUpdate(
      { _id: propertyId },
      update,
      { runValidators: false }
    );
    
    return res.status(200).json({ 
      message: liked ? 'Property liked' : 'Property unliked',
      liked
    });
  } catch (error) {
    console.error('Error handling property like:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 