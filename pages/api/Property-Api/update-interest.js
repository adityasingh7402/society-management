import connectToDatabase from "../../../lib/mongodb";
import Property from "../../../models/Property";

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();
    
    // Authorization check
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    
    const { propertyId, buyerId, status } = req.body;
    
    if (!propertyId || !buyerId || !status) {
      return res.status(400).json({ message: 'Property ID, Buyer ID and Status are required' });
    }

    // Validate status
    const validStatuses = ['Interested', 'Scheduled Visit', 'Negotiating', 'Withdrawn'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find property
    const property = await Property.findById(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Find and update buyer's interest status
    const interest = property.interestedBuyers.find(
      interest => interest.buyerId.toString() === buyerId
    );

    if (!interest) {
      return res.status(404).json({ message: 'Interest record not found' });
    }

    interest.status = status;
    await property.save();
    
    return res.status(200).json({ 
      message: 'Interest status updated successfully',
      status
    });
  } catch (error) {
    console.error('Error updating interest status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 