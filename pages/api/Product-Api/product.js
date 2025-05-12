import connectToDatabase from "../../../lib/mongodb";
import Product from "../../../models/Product";
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
        category,
        condition,
        images,
        sellerId,
        societyId
      } = req.body;

      // Input validation
      if (!title || !description || !price || !category || !sellerId || !societyId) {
        return res.status(400).json({ message: 'Required fields are missing' });
      }

      // Find seller and society
      const seller = await Resident.findById(sellerId);
      const society = await Society.findById(societyId);

      if (!seller || !society) {
        return res.status(404).json({ message: 'Seller or Society not found' });
      }

      // Create new product
      const newProduct = new Product({
        title: title,
        description: description,
        price: parseFloat(price),
        images: images || [],
        category: category,
        condition: condition || 'Good',
        location: {
          societyName: society.societyName,
          city: seller.address.city,
          state: seller.address.state,
        },
        sellerId: sellerId,
        sellerName: seller.name,
        sellerPhone: seller.phone,
        sellerImage: seller.userImage,
        societyId: societyId,
        likes: [],
        comments: []
      });

      const savedProduct = await newProduct.save();

      res.status(201).json({
        message: 'Product created successfully',
        product: savedProduct
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      await connectToDatabase();
      
      const { societyId, sellerId, status, category } = req.query;
      
      // Build filter object
      const filter = {};
      if (societyId) filter.societyId = societyId;
      if (sellerId) filter.sellerId = sellerId;
      if (status) filter.status = status;
      if (category) filter.category = category;
      
      // Get all products based on filters
      const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .limit(50);
      
      res.status(200).json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
} 