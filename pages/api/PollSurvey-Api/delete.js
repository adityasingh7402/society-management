import PollSurvey from '../../../models/PollSurvey';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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

    const deletedPollSurvey = await PollSurvey.findByIdAndDelete(id);
    
    if (!deletedPollSurvey) {
      return res.status(404).json({ 
        success: false, 
        message: 'Poll/Survey not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Poll/Survey deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting poll/survey:', error);
    res.status(500).json({ message: 'Failed to delete poll/survey', error: error.message });
  }
}