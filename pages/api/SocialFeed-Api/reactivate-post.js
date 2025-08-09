import SocialPost from '../../../models/SocialPost';
import Society from '../../../models/Society';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { postId } = req.body;
    const userType = req.headers['x-user-type']; // Should be 'society'

    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    // Only societies can reactivate posts
    if (userType !== 'society') {
      return res.status(403).json({ message: 'Only societies can reactivate posts' });
    }

    // Find the post
    const post = await SocialPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Verify society and post relationship
    const society = await Society.findById(decoded.id);
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }

    if (post.societyId.toString() !== society._id.toString()) {
      return res.status(403).json({ message: 'You can only reactivate posts from your society' });
    }

    // Check if post is actually deactivated
    if (post.status !== 'deactivated') {
      return res.status(400).json({ message: 'Post is not deactivated' });
    }

    // Reactivate the post
    await SocialPost.findByIdAndUpdate(postId, {
      status: 'active',
      $unset: {
        deactivatedBy: 1,
        deactivatedAt: 1,
        deactivationReason: 1
      }
    });

    res.status(200).json({
      success: true,
      message: 'Post has been reactivated successfully'
    });

  } catch (error) {
    console.error('Error reactivating post:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reactivate post', 
      error: error.message 
    });
  }
}
