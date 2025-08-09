import SocialPost from '../../../models/SocialPost';
import SocialComment from '../../../models/SocialComment';
import Resident from '../../../models/Resident';
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

    const { postId, content, parentComment = null } = req.body;
    const userType = req.headers['x-user-type']; // 'resident' or 'society'

    if (!postId || !content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Post ID and content are required' });
    }

    // Verify the post exists and is active
    const post = await SocialPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.status !== 'active') {
      return res.status(403).json({ message: 'Cannot comment on inactive post' });
    }

    // Verify user exists and get user info
    let author, authorName, authorImage;
    if (userType === 'resident') {
      const resident = await Resident.findById(decoded.id);
      if (!resident || resident.societyVerification !== 'Approved') {
        return res.status(403).json({ message: 'Access denied' });
      }
      author = resident._id;
      authorName = resident.name;
      authorImage = resident.image || '';
    } else if (userType === 'society') {
      const society = await Society.findById(decoded.id);
      if (!society) {
        return res.status(404).json({ message: 'Society not found' });
      }
      author = society._id;
      authorName = society.societyName;
      authorImage = society.societyImages?.[0] || '';
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // If it's a reply, verify parent comment exists
    if (parentComment) {
      const parent = await SocialComment.findById(parentComment);
      if (!parent || parent.postId.toString() !== postId) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    // Create the comment
    const newComment = new SocialComment({
      postId,
      content: content.trim(),
      author,
      authorModel: userType === 'resident' ? 'Resident' : 'Society',
      authorName,
      authorImage,
      parentComment
    });

    await newComment.save();

    // Update post's comments count
    if (!parentComment) {
      post.commentsCount += 1;
      await post.save();
    } else {
      // Update parent comment's replies count
      await SocialComment.findByIdAndUpdate(parentComment, {
        $inc: { repliesCount: 1 }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      comment: newComment
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create comment', 
      error: error.message 
    });
  }
}
