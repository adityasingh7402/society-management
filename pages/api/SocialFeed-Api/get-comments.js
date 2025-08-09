import SocialComment from '../../../models/SocialComment';
import SocialPost from '../../../models/SocialPost';
import Resident from '../../../models/Resident';
import Society from '../../../models/Society';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    const { postId, page = 1, limit = 20 } = req.query;
    const userType = req.headers['x-user-type']; // 'resident' or 'society'

    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    // Verify access permissions
    if (userType === 'resident') {
      const resident = await Resident.findById(decoded.id);
      if (!resident || resident.societyVerification !== 'Approved') {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (userType === 'society') {
      const society = await Society.findById(decoded.id);
      if (!society) {
        return res.status(404).json({ message: 'Society not found' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // Verify post exists
    const post = await SocialPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get top-level comments (not replies)
    const comments = await SocialComment.find({ 
      postId, 
      parentComment: null 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get replies for each comment (limit to 3 most recent)
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await SocialComment.find({
          parentComment: comment._id
        })
          .sort({ createdAt: 1 }) // Oldest first for replies
          .limit(3)
          .lean();

        // Check if current user liked this comment
        const isLikedByUser = comment.likes.some(
          like => like.userId.toString() === decoded.id
        );

        return {
          ...comment,
          replies,
          isLikedByUser,
          hasMoreReplies: comment.repliesCount > 3
        };
      })
    );

    // Get total count for pagination
    const total = await SocialComment.countDocuments({ 
      postId, 
      parentComment: null 
    });

    res.status(200).json({
      success: true,
      comments: commentsWithReplies,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch comments', 
      error: error.message 
    });
  }
}
