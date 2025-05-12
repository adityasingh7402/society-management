import connectToDatabase from "../../../lib/mongodb";
import Product from "../../../models/Product";
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
    
    const { productId, residentId } = req.body;
    
    if (!productId || !residentId) {
      return res.status(400).json({ message: 'Product ID and Resident ID are required' });
    }

    // Check if product and resident exist
    const product = await Product.findById(productId);
    const resident = await Resident.findById(residentId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Check if resident already liked the product
    const alreadyLiked = product.likes.includes(residentId);
    
    if (alreadyLiked) {
      // If already liked, unlike it
      await Product.findByIdAndUpdate(productId, {
        $pull: { likes: residentId }
      });
      
      return res.status(200).json({ 
        message: 'Product unliked successfully',
        liked: false,
        likeCount: product.likes.length - 1
      });
    } else {
      // If not liked, like it
      await Product.findByIdAndUpdate(productId, {
        $push: { likes: residentId }
      });
      
      return res.status(200).json({ 
        message: 'Product liked successfully',
        liked: true,
        likeCount: product.likes.length + 1
      });
    }
  } catch (error) {
    console.error('Error handling product like:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 