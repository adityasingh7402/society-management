import SocialPost from '../../../models/SocialPost';
import SocialComment from '../../../models/SocialComment';
import Society from '../../../models/Society';
import Resident from '../../../models/Resident';
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

    const { societyId, page = 1, limit = 10 } = req.query;
    const userType = req.headers['x-user-type']; // 'resident' or 'society'

    if (!societyId) {
      return res.status(400).json({ message: 'Society ID is required' });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { societyId };
    let currentUserId = decoded.id;

    // For residents, check if they are approved
    // For society, show all posts with status indication
    if (userType === 'resident') {
      // Check if resident is approved
      const resident = await Resident.findById(decoded.id);
      if (!resident || resident.societyVerification !== 'Approved') {
        return res.status(403).json({ 
          message: 'Only approved residents can access community board' 
        });
      }
      
      // Don't filter by status here - let the frontend handle filtering
      // This allows residents to see their deactivated posts in "My Posts" tab
    }

    // Get total count for pagination
    const total = await SocialPost.countDocuments(query);

    // Get posts with comments
    const posts = await SocialPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get recent comments for each post (limit to 3 most recent)
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const recentComments = await SocialComment.find({ 
          postId: post._id, 
          parentComment: null 
        })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean();

        // Check if current user liked the post
        const isLikedByUser = post.likes.some(
          like => like.userId.toString() === currentUserId
        );

        return {
          ...post,
          recentComments,
          isLikedByUser,
          // For deactivated posts, add status message for residents
          statusMessage: post.status === 'deactivated' && userType === 'resident' 
            ? 'Society has unlisted this post. Contact society management for more information.'
            : null
        };
      })
    );

    res.status(200).json({
      success: true,
      posts: postsWithComments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch posts', 
      error: error.message 
    });
  }
}
