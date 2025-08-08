import PollSurvey from '../../../models/PollSurvey';
import connectDB from '../../../lib/mongodb';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let pollSurveyData = {};
  let hasAuthToken = false;
  let pollSurveyId = '';

  try {
    await connectDB();
    
    const authHeader = req.headers.authorization;
    hasAuthToken = !!authHeader;
    
    pollSurveyId = req.query.id;

    if (!pollSurveyId) {
      await logFailure('DELETE_POLL_SURVEY', req, 'Poll/Survey ID is required', {
        hasAuthToken,
        errorType: 'MISSING_POLL_SURVEY_ID'
      });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Poll/Survey ID is required' 
      });
    }

    // First find the poll/survey to get its details for logging
    const existingPollSurvey = await PollSurvey.findById(pollSurveyId);
    
    if (!existingPollSurvey) {
      await logFailure('DELETE_POLL_SURVEY', req, 'Poll/Survey not found', {
        pollSurveyId,
        hasAuthToken,
        errorType: 'POLL_SURVEY_NOT_FOUND'
      });
      
      return res.status(404).json({ 
        success: false, 
        message: 'Poll/Survey not found' 
      });
    }

    // Prepare poll/survey data for logging
    pollSurveyData = {
      pollSurveyId: existingPollSurvey._id.toString(),
      title: existingPollSurvey.title || '',
      type: existingPollSurvey.type || '',
      societyId: existingPollSurvey.societyId || '',
      optionCount: existingPollSurvey.options?.length || 0,
      questionCount: existingPollSurvey.questions?.length || 0,
      voteCount: existingPollSurvey.votes?.length || 0,
      responseCount: existingPollSurvey.responses?.length || 0,
      endDate: existingPollSurvey.endDate,
      createdAt: existingPollSurvey.createdAt,
      hasAuthToken
    };

    // Delete the poll/survey
    await PollSurvey.findByIdAndDelete(pollSurveyId);

    // Log successful deletion
    await logSuccess('DELETE_POLL_SURVEY', req, {
      ...pollSurveyData,
      deletedAt: new Date()
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Poll/Survey deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting poll/survey:', error);
    
    // Log failure with context
    await logFailure('DELETE_POLL_SURVEY', req, 'Failed to delete poll/survey', {
      ...pollSurveyData,
      pollSurveyId: pollSurveyId || 'unknown',
      errorMessage: error.message,
      errorType: error.name || 'UNKNOWN_ERROR',
      hasAuthToken
    });
    
    res.status(500).json({ message: 'Failed to delete poll/survey', error: error.message });
  }
}
