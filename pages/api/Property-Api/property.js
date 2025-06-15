import connectToDatabase from "../../../lib/mongodb";
import Property from "../../../models/Property";
import Resident from "../../../models/Resident";
import Society from "../../../models/Society";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await connectToDatabase();

      // Authorization check
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
      }

      const {
        title,
        description,
        price,
        propertyType,
        bedrooms,
        bathrooms,
        area,
        furnishingStatus,
        amenities,
        location,
        images,
        sellerId,
        societyId
      } = req.body;

      // Input validation
      if (!title || !description || !price || !propertyType || !bedrooms || 
          !bathrooms || !area || !furnishingStatus || !sellerId || !societyId ||
          !location.block || !location.floor || !location.flatNumber) {
        return res.status(400).json({ message: 'Required fields are missing' });
      }

      // Find seller and society
      const seller = await Resident.findById(sellerId);
      const society = await Society.findById(societyId);

      if (!seller || !society) {
        return res.status(404).json({ message: 'Seller or Society not found' });
      }

      // Create new property
      const newProperty = new Property({
        title,
        description,
        price: parseFloat(price),
        propertyType,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        area: parseFloat(area),
        furnishingStatus,
        amenities: amenities || [],
        images: images || [],
        location: {
          societyName: society.societyName,
          block: location.block,
          floor: location.floor,
          flatNumber: location.flatNumber
        },
        sellerId,
        sellerName: seller.name,
        sellerPhone: seller.phone,
        sellerImage: seller.userImage,
        societyId,
        likes: [],
        comments: [],
        interestedBuyers: []
      });

      const savedProperty = await newProperty.save();

      res.status(201).json({
        message: 'Property listed successfully',
        property: savedProperty
      });
    } catch (error) {
      console.error('Error creating property listing:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      await connectToDatabase();
      
      const { id, societyId, sellerId, status, propertyType } = req.query;

      // If ID is provided, return single property
      if (id) {
        const property = await Property.findById(id);
        if (!property) {
          return res.status(404).json({ message: 'Property not found' });
        }
        return res.status(200).json(property);
      }
      
      // Build filter object for multiple properties
      const filter = {};
      if (societyId) filter.societyId = societyId;
      if (sellerId) filter.sellerId = sellerId;
      if (status) filter.status = status;
      if (propertyType) filter.propertyType = propertyType;
      
      // Get all properties based on filters
      const properties = await Property.find(filter)
        .sort({ createdAt: -1 })
        .limit(50);
      
      res.status(200).json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
} 