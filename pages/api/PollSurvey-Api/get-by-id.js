import PollSurvey from '../../../models/PollSurvey';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Poll/Survey ID is required' 
      });
    }

    const pollSurvey = await PollSurvey.findById(id);
    
    if (!pollSurvey) {
      return res.status(404).json({ 
        success: false, 
        message: 'Poll/Survey not found' 
      });
    }
    
    res.status(200).json({ success: true, data: pollSurvey });
  } catch (error) {
    console.error('Error fetching poll/survey:', error);
    res.status(500).json({ message: 'Failed to fetch poll/survey', error: error.message });
  }
}