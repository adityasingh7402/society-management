import PollSurvey from '../../../models/PollSurvey';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  console.log('Fetching polls/surveys...');

  try {
    await connectDB();
    
    const { type, societyId } = req.query;

    let query = {};
    if (societyId) {
      query.societyId = societyId;
    }
    
    if (type) {
      query.type = type;
    }

    const pollSurveys = await PollSurvey.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: pollSurveys });
  } catch (error) {
    console.error('Error fetching polls/surveys:', error);
    res.status(500).json({ message: 'Failed to fetch polls/surveys', error: error.message });
  }
}