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
    
    const { productId, residentId, text } = req.body;
    
    if (!productId || !residentId || !text) {
      return res.status(400).json({ message: 'Product ID, Resident ID, and comment text are required' });
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

    // Create new comment object
    const newComment = {
      text: text,
      postedBy: residentId,
      commenterName: resident.name,
      commenterImage: resident.userImage,
      createdAt: new Date()
    };

    // Add comment to product
    await Product.findByIdAndUpdate(productId, {
      $push: { comments: newComment }
    });

    // Return updated comment list (fetch fresh data to ensure we have the latest)
    const updatedProduct = await Product.findById(productId);
    
    return res.status(200).json({
      message: 'Comment added successfully',
      comments: updatedProduct.comments
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 