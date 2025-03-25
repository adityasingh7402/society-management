import PollSurvey from '../../../models/PollSurvey';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { surveyId, answers, userId } = req.body;

    if (!surveyId || !answers || !Array.isArray(answers) || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Survey ID, answers, and user ID are required' 
      });
    }

    // Find the survey
    const survey = await PollSurvey.findOne({ 
      _id: surveyId, 
      type: 'survey', 
      status: 'active' 
    });
    
    if (!survey) {
      return res.status(404).json({ 
        success: false, 
        message: 'Survey not found or not active' 
      });
    }

    // Check if user already submitted
    const alreadySubmitted = survey.participants.some(p => 
      p.userId.toString() === userId.toString()
    );
    
    if (alreadySubmitted) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already submitted this survey' 
      });
    }

    // Update the survey with the responses
    const updatedSurvey = await PollSurvey.findByIdAndUpdate(
      surveyId,
      {
        $push: { 
          participants: { 
            userId, 
            answers: answers.map(answer => ({
              questionId: answer.questionId,
              answer: answer.answer
            }))
          } 
        }
      },
      { new: true }
    );

    res.status(200).json({ success: true, data: updatedSurvey });
  } catch (error) {
    console.error('Error submitting survey:', error);
    res.status(500).json({ message: 'Failed to submit survey', error: error.message });
  }
}