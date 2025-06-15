import connectToDatabase from "../../../lib/mongodb";
import Property from "../../../models/Property";

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();
    
    // Authorization check
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    
    const { propertyId } = req.query;
    
    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required' });
    }

    // Find the property first to check ownership
    const property = await Property.findById(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Delete the property
    await Property.findByIdAndDelete(propertyId);
    
    return res.status(200).json({ 
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 