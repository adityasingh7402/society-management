import PollSurvey from '../../../models/PollSurvey';
import connectDB from '../../../lib/mongodb';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let pollSurveyData = {};
  let hasAuthToken = false;

  try {
    await connectDB();
    
    const authHeader = req.headers.authorization;
    hasAuthToken = !!authHeader;
    
    const { 
      title, 
      description, 
      type, 
      societyId, 
      endDate, 
      options, 
      questions 
    } = req.body;

    pollSurveyData = {
      title: title || '',
      type: type || '',
      societyId: societyId || '',
      endDate: endDate || '',
      optionCount: options?.length || 0,
      questionCount: questions?.length || 0,
      hasAuthToken
    };

    // Validate required fields
    if (!title || !description || !type || !societyId || !endDate) {
      const missingFields = [];
      if (!title) missingFields.push('title');
      if (!description) missingFields.push('description');
      if (!type) missingFields.push('type');
      if (!societyId) missingFields.push('societyId');
      if (!endDate) missingFields.push('endDate');

      await logFailure('CREATE_POLL_SURVEY', req, 'Validation failed - missing required fields', {
        ...pollSurveyData,
        missingFields,
        errorType: 'VALIDATION_ERROR'
      });

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
        await logFailure('CREATE_POLL_SURVEY', req, 'Polls require at least 2 options', {
          ...pollSurveyData,
          providedOptionCount: options?.length || 0,
          errorType: 'INSUFFICIENT_OPTIONS'
        });
        
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
        await logFailure('CREATE_POLL_SURVEY', req, 'Surveys require at least 1 question', {
          ...pollSurveyData,
          providedQuestionCount: questions?.length || 0,
          errorType: 'INSUFFICIENT_QUESTIONS'
        });
        
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
    
    // Log successful creation
    await logSuccess('CREATE_POLL_SURVEY', req, {
      message: 'Poll/Survey created successfully',
      pollSurveyId: pollSurvey._id.toString(),
      title: pollSurvey.title,
      type: pollSurvey.type,
      societyId: pollSurvey.societyId,
      endDate: pollSurvey.endDate,
      optionCount: pollSurvey.options?.length || 0,
      questionCount: pollSurvey.questions?.length || 0,
      hasOptions: !!(pollSurvey.options && pollSurvey.options.length > 0),
      hasQuestions: !!(pollSurvey.questions && pollSurvey.questions.length > 0),
      hasAuthToken
    }, pollSurvey._id.toString(), 'poll_survey');
    
    res.status(201).json({ success: true, data: pollSurvey });
  } catch (error) {
    console.error('Error creating poll/survey:', error);
    
    // Log failure with context
    await logFailure('CREATE_POLL_SURVEY', req, 'Failed to create poll/survey', {
      ...pollSurveyData,
      errorMessage: error.message,
      errorType: error.name || 'UNKNOWN_ERROR'
    });
    
    res.status(500).json({ message: 'Failed to create poll/survey', error: error.message });
  }
}
