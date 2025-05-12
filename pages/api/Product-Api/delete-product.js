import connectToDatabase from "../../../lib/mongodb";
import Product from "../../../models/Product";

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
    
    const { productId } = req.query;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Find the product first to check ownership
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete the product
    await Product.findByIdAndDelete(productId);
    
    return res.status(200).json({ 
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 