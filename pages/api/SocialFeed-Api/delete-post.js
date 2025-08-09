import SocialPost from '../../../models/SocialPost';
import Society from '../../../models/Society';
import Resident from '../../../models/Resident';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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

    const { postId, reason = 'Content policy violation' } = req.body;
    const userType = req.headers['x-user-type']; // 'resident' or 'society'

    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    // Find the post
    const post = await SocialPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    let canDelete = false;
    let deleteType = 'hard'; // 'hard' or 'soft'

    if (userType === 'society') {
      // Society can soft delete any post in their society
      const society = await Society.findById(decoded.id);
      if (!society) {
        return res.status(404).json({ message: 'Society not found' });
      }

      if (post.societyId.toString() === society._id.toString()) {
        canDelete = true;
        
        // If society is deleting their own post, hard delete
        // If society is deleting resident's post, soft delete
        if (post.author.toString() === society._id.toString()) {
          deleteType = 'hard';
        } else {
          deleteType = 'soft';
        }
      }
    } else if (userType === 'resident') {
      // Residents can only hard delete their own posts
      const resident = await Resident.findById(decoded.id);
      if (!resident || resident.societyVerification !== 'Approved') {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (post.author.toString() === resident._id.toString() && 
          post.authorModel === 'Resident') {
        canDelete = true;
        deleteType = 'hard';
      }
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    if (!canDelete) {
      return res.status(403).json({ message: 'You are not authorized to delete this post' });
    }

    if (deleteType === 'hard') {
      // Complete removal
      await SocialPost.findByIdAndDelete(postId);
      res.status(200).json({
        success: true,
        message: 'Post deleted successfully'
      });
    } else {
      // Soft delete - deactivate the post
      post.status = 'deactivated';
      post.deactivatedBy = decoded.id;
      post.deactivatedAt = new Date();
      post.deactivationReason = reason;
      
      await post.save();
      
      res.status(200).json({
        success: true,
        message: 'Post has been unlisted successfully'
      });
    }

  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete post', 
      error: error.message 
    });
  }
}
