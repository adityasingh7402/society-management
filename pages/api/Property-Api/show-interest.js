import connectToDatabase from "../../../lib/mongodb";
import Property from "../../../models/Property";
import Resident from "../../../models/Resident";

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
    
    const { propertyId, residentId, message } = req.body;
    
    if (!propertyId || !residentId || !message) {
      return res.status(400).json({ message: 'Property ID, Resident ID, and message are required' });
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

    // Check if resident has already shown interest
    const existingInterest = property.interestedBuyers.find(
      buyer => buyer.buyerId.toString() === residentId
    );

    if (existingInterest) {
      return res.status(400).json({ message: 'You have already shown interest in this property' });
    }

    // Create new interest object
    const newInterest = {
      buyerId: residentId,
      buyerName: resident.name,
      buyerImage: resident.userImage,
      message,
      status: 'Interested',
      createdAt: new Date()
    };

    // Add interest to property
    await Property.findByIdAndUpdate(propertyId, {
      $push: { interestedBuyers: newInterest }
    });

    // Return updated interest list (fetch fresh data to ensure we have the latest)
    const updatedProperty = await Property.findById(propertyId);
    
    return res.status(200).json({
      message: 'Interest shown successfully',
      interestedBuyers: updatedProperty.interestedBuyers
    });
  } catch (error) {
    console.error('Error showing interest:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 