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

    const { targetId, targetType } = req.body; // targetType: 'post' or 'comment'
    const userType = req.headers['x-user-type']; // 'resident' or 'society'

    if (!targetId || !targetType) {
      return res.status(400).json({ message: 'Target ID and type are required' });
    }

    // Verify user exists and is approved (for residents)
    let userName, userImage;
    if (userType === 'resident') {
      const resident = await Resident.findById(decoded.id);
      if (!resident || resident.societyVerification !== 'Approved') {
        return res.status(403).json({ message: 'Access denied' });
      }
      userName = resident.name;
      userImage = resident.image || '';
    } else if (userType === 'society') {
      const society = await Society.findById(decoded.id);
      if (!society) {
        return res.status(404).json({ message: 'Society not found' });
      }
      userName = society.societyName;
      userImage = society.societyImages?.[0] || '';
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    let targetModel, targetDoc;
    
    // Get the target document
    if (targetType === 'post') {
      targetModel = SocialPost;
      targetDoc = await SocialPost.findById(targetId);
    } else if (targetType === 'comment') {
      targetModel = SocialComment;
      targetDoc = await SocialComment.findById(targetId);
    } else {
      return res.status(400).json({ message: 'Invalid target type' });
    }

    if (!targetDoc) {
      return res.status(404).json({ message: `${targetType} not found` });
    }

    const userId = decoded.id;
    const likeIndex = targetDoc.likes.findIndex(
      like => like.userId.toString() === userId
    );

    let isLiked = false;
    
    if (likeIndex === -1) {
      // Add like
      targetDoc.likes.push({
        userId,
        userModel: userType === 'resident' ? 'Resident' : 'Society',
        likedAt: new Date()
      });
      targetDoc.likesCount = targetDoc.likes.length;
      isLiked = true;
    } else {
      // Remove like
      targetDoc.likes.splice(likeIndex, 1);
      targetDoc.likesCount = targetDoc.likes.length;
      isLiked = false;
    }

    await targetDoc.save();

    res.status(200).json({
      success: true,
      isLiked,
      likesCount: targetDoc.likesCount,
      message: isLiked ? `${targetType} liked` : `${targetType} unliked`
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to toggle like', 
      error: error.message 
    });
  }
}
