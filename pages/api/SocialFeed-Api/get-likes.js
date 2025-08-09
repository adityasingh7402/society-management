import SocialPost from '../../../models/SocialPost';
import SocialComment from '../../../models/SocialComment';
import Resident from '../../../models/Resident';
import Society from '../../../models/Society';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Starting get-likes API call');
    await connectDB();
    console.log('Database connected successfully');

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { targetId, targetType } = req.query; // targetType: 'post' or 'comment'
    const userType = req.headers['x-user-type']; // 'resident' or 'society'

    console.log('Request params:', { targetId, targetType, userType });

    if (!targetId || !targetType) {
      return res.status(400).json({ message: 'Target ID and type are required' });
    }

    // Verify user exists and is approved (for residents)
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

    let targetDoc;
    
    console.log('Searching for target document...');
    // Get the target document
    if (targetType === 'post') {
      targetDoc = await SocialPost.findById(targetId);
    } else if (targetType === 'comment') {
      targetDoc = await SocialComment.findById(targetId);
    } else {
      return res.status(400).json({ message: 'Invalid target type' });
    }

    console.log('Target document found:', !!targetDoc);
    if (targetDoc) {
      console.log('Target document likes:', targetDoc.likes?.length || 0);
    }

    if (!targetDoc) {
      return res.status(404).json({ message: `${targetType} not found` });
    }

    // Get detailed information for each user who liked this post/comment
    const likesWithUserInfo = [];
    
    console.log('Processing likes:', targetDoc.likes.length);
    
    for (const like of targetDoc.likes || []) {
      try {
        let userInfo = null;
        
        if (like.userModel === 'Resident') {
          userInfo = await Resident.findById(like.userId).select('name image');
          if (userInfo) {
            likesWithUserInfo.push({
              _id: like._id,
              userId: like.userId,
              userName: userInfo.name,
              userImage: userInfo.image || '',
              userModel: 'Resident',
              likedAt: like.likedAt
            });
          }
        } else if (like.userModel === 'Society') {
          userInfo = await Society.findById(like.userId).select('societyName societyImages');
          if (userInfo) {
            likesWithUserInfo.push({
              _id: like._id,
              userId: like.userId,
              userName: userInfo.societyName,
              userImage: userInfo.societyImages?.[0] || '',
              userModel: 'Society',
              likedAt: like.likedAt
            });
          }
        }
      } catch (likeError) {
        console.error('Error processing like:', likeError);
        // Continue with next like instead of failing completely
      }
    }

    // Sort by most recent likes first
    likesWithUserInfo.sort((a, b) => new Date(b.likedAt) - new Date(a.likedAt));

    res.status(200).json({
      success: true,
      likes: likesWithUserInfo,
      totalLikes: targetDoc.likesCount || targetDoc.likes.length
    });

  } catch (error) {
    console.error('Error fetching likes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch likes', 
      error: error.message 
    });
  }
}
