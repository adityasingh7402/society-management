import connectDB from '../../../lib/mongodb';
import MessageG from '../../../models/MessageG';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { societyId, discussionId } = req.query;

    if (!societyId) {
      return res.status(400).json({ message: 'Society ID is required' });
    }

    // Create filter - if discussionId is provided, filter by it
    let filter = { societyId };
    if (discussionId) {
      filter.discussionId = discussionId;
    }

    const messages = await MessageG.find(filter)
      .sort({ timestamp: 1 })
      .lean();

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
}