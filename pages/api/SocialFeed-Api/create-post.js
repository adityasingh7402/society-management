import SocialPost from '../../../models/SocialPost';
import Society from '../../../models/Society';
import Resident from '../../../models/Resident';
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

    const { content, images = [] } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Determine if it's a resident or society posting
    const userType = req.headers['x-user-type']; // 'resident' or 'society'
    let author, authorName, authorImage, societyId;

    if (userType === 'resident') {
      // Check if resident exists and is approved
      const resident = await Resident.findById(decoded.id);
      if (!resident) {
        return res.status(404).json({ message: 'Resident not found' });
      }

      if (resident.societyVerification !== 'Approved') {
        return res.status(403).json({ 
          message: 'Only approved residents can post in community board' 
        });
      }

      // Check if resident is blocked from posting
      const society = await Society.findById(resident.societyId);
      const isBlocked = society?.blockedResidents?.some(
        blocked => blocked.residentId.toString() === resident._id.toString()
      ) || false;

      if (isBlocked) {
        return res.status(403).json({ 
          message: 'You are blocked from posting. Please contact your society manager.' 
        });
      }

      author = resident._id;
      authorName = resident.name;
      authorImage = resident.userImage || '';
      societyId = resident.societyId;
    } else if (userType === 'society') {
      const society = await Society.findById(decoded.id);
      if (!society) {
        return res.status(404).json({ message: 'Society not found' });
      }

      author = society._id;
      authorName = society.societyName;
      authorImage = society.societyImages?.[0] || '';
      societyId = society._id;
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // Create the post
    const newPost = new SocialPost({
      content: content.trim(),
      images,
      author,
      authorModel: userType === 'resident' ? 'Resident' : 'Society',
      authorName,
      authorImage,
      societyId
    });

    await newPost.save();

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: newPost
    });

  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create post', 
      error: error.message 
    });
  }
}
