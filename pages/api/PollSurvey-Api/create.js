import PollSurvey from '../../../models/PollSurvey';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { 
      title, 
      description, 
      type, 
      societyId, 
      endDate, 
      options, 
      questions 
    } = req.body;

    // Validate required fields
    console.log('Received data:', req.body);
    if (!title || !description || !type || !societyId || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    let newPollSurvey = {
      title,
      description,
      type,
      societyId,
      endDate
    };

    // Handle poll-specific data
    if (type === 'poll') {
      if (!options || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Polls require at least 2 options'
        });
      }

      // Format options with IDs
      newPollSurvey.options = options.map((option, index) => ({
        id: index + 1,
        text: option,
        votes: 0
      }));
    }

    // Handle survey-specific data
    if (type === 'survey') {
      if (!questions || questions.length < 1) {
        return res.status(400).json({
          success: false,
          message: 'Surveys require at least 1 question'
        });
      }

      // Format questions with IDs
      newPollSurvey.questions = questions.map((question, index) => ({
        id: index + 1,
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options ? question.options.map((opt, i) => ({
          id: i + 1,
          text: opt
        })) : [],
        required: question.required !== undefined ? question.required : true
      }));
    }

    const pollSurvey = new PollSurvey(newPollSurvey);
    await pollSurvey.save();
    
    res.status(201).json({ success: true, data: pollSurvey });
  } catch (error) {
    console.error('Error creating poll/survey:', error);
    res.status(500).json({ message: 'Failed to create poll/survey', error: error.message });
  }
}