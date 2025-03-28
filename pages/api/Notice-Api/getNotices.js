import Notice from '../../../models/Notice';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { societyId, status, type, priority } = req.query;
    
    let query = { societyId };
    
    if (status) query.status = status;
    if (type) query.noticeType = type;
    if (priority) query.priorityLevel = priority;

    const notices = await Notice.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: notices });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ message: 'Failed to fetch notices', error: error.message });
  }
}