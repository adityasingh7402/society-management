// pages/Society-dashboard/components/PollsSurveys.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  BarChart,
  PieChart,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  Users,
  ChevronLeft,
  Plus,
  Trash2,
  Edit,
  Loader2,
  FileText,
  Vote,
  CheckSquare,
  HelpCircle,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PollsSurveys() {
  const router = useRouter();

  // State variables
  const [societyId, setSocietyId] = useState('');
  const [polls, setPolls] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [activeTab, setActiveTab] = useState('polls');
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyResponses, setSurveyResponses] = useState({});
  const [userId, setUserId] = useState("user123"); // Replace with actual user ID from auth

  // Create poll/survey state
  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [surveyQuestions, setSurveyQuestions] = useState([
    { questionText: '', questionType: 'multiple-choice', options: ['', ''], required: true }
  ]);

  useEffect(() => {
    fetchPollsAndSurveys();
  }, []);

  const fetchPollsAndSurveys = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // Get society details
      const securityResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!securityResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const data = await securityResponse.json();
      setUserId(data._id)
      const societyIdFromData = data.societyId;
      setSocietyId(societyIdFromData);

      // Fetch polls
      const pollsResponse = await fetch(`/api/PollSurvey-Api/get-all?type=poll&societyId=${societyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!pollsResponse.ok) {
        throw new Error('Failed to fetch polls');
      }
      const pollsData = await pollsResponse.json();

      // Fetch surveys
      const surveysResponse = await fetch(`/api/PollSurvey-Api/get-all?type=survey&societyId=${societyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!surveysResponse.ok) {
        throw new Error('Failed to fetch surveys');
      }
      const surveysData = await surveysResponse.json();

      // Process polls data
      const processedPolls = pollsData.data?.map(poll => {
        const userParticipant = poll.participants?.find(p => p.userId === data._id);
        return {
          ...poll,
          totalVotes: poll.participants?.length || 0,
          userVoted: Boolean(userParticipant),
          userVotedOption: userParticipant?.votedOption || null
        };
      }) || [];

      // Process surveys data
      const processedSurveys = surveysData.data?.map(survey => {
        const userParticipant = survey.participants?.find(p => p.userId === data._id);
        return {
          ...survey,
          responses: survey.participants?.length || 0,
          completed: Boolean(userParticipant)
        };
      }) || [];

      setPolls(processedPolls);
      setSurveys(processedSurveys);
    } catch (error) {
      console.error('Error fetching polls and surveys:', error);
      toast.error(error.message || 'Failed to load data');
      if (error.status === 401) {
        router.push('/societyLogin');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle voting
  const handleVote = (pollId, optionId) => {
    setUserVote(optionId);
  };

  // Function to submit vote
  const submitVote = async () => {
    if (!userVote || !selectedPoll) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('Society');
      const response = await fetch('/api/PollSurvey-Api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pollId: selectedPoll._id,
          optionId: userVote,
          userId,
          societyId // Include societyId in the request
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      // Update local state
      setPolls(polls.map(poll => {
        if (poll._id === selectedPoll._id) {
          const updatedOptions = poll.options.map(option => ({
            ...option,
            votes: option.id === userVote ? (option.votes + 1) : option.votes
          }));

          return {
            ...poll,
            userVoted: true,
            userVotedOption: userVote,
            totalVotes: poll.totalVotes + 1,
            options: updatedOptions
          };
        }
        return poll;
      }));

      toast.success('Vote submitted successfully!');
      setSelectedPoll(null);
      setUserVote(null);
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error(error.message || 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle survey response
  const handleSurveyResponse = (questionId, answer) => {
    setSurveyResponses({
      ...surveyResponses,
      [questionId]: answer
    });
  };

  // Function to submit survey
  const submitSurvey = async () => {
    if (!selectedSurvey) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('Society');
      const response = await fetch('/api/PollSurvey-Api/submit-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          surveyId: selectedSurvey._id,
          answers: Object.keys(surveyResponses).map(questionId => ({
            questionId: parseInt(questionId),
            answer: surveyResponses[questionId]
          })),
          userId,
          societyId // Include societyId in the request
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      // Update local state
      setSurveys(surveys.map(survey =>
        survey._id === selectedSurvey._id
          ? { ...survey, completed: true, responses: survey.responses + 1 }
          : survey
      ));

      toast.success('Survey submitted successfully!');
      setSelectedSurvey(null);
      setSurveyResponses({});
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error(error.message || 'Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to create new poll/survey
  const handleCreateNew = async () => {
    if (!newTitle || !newDescription || !newEndDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (createType === 'poll' && pollOptions.some(opt => !opt.trim())) {
      toast.error('Please provide all poll options');
      return;
    }

    if (createType === 'survey' &&
      (surveyQuestions.some(q => !q.questionText.trim()) ||
        surveyQuestions.some(q => q.questionType !== 'text' && q.options.some(opt => !opt.trim())))) {
      toast.error('Please fill in all question fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('Society');
      const payload = {
        title: newTitle,
        description: newDescription,
        type: createType,
        societyId, // Use the global societyId
        endDate: newEndDate
      };

      if (createType === 'poll') {
        payload.options = pollOptions.filter(opt => opt.trim());
      } else {
        payload.questions = surveyQuestions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.questionType !== 'text' ? q.options.filter(opt => opt.trim()) : [],
          required: q.required
        }));
      }

      const response = await fetch('/api/PollSurvey-Api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create ${createType}`);
      }

      const responseData = await response.json();

      // Update local state
      if (createType === 'poll') {
        setPolls([responseData.data, ...polls]);
      } else {
        setSurveys([responseData.data, ...surveys]);
      }

      toast.success(`${createType === 'poll' ? 'Poll' : 'Survey'} created successfully!`);
      resetCreateForm();
    } catch (error) {
      console.error('Error creating poll/survey:', error);
      toast.error(error.message || `Failed to create ${createType}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset create form
  const resetCreateForm = () => {
    setIsCreating(false);
    setCreateType('');
    setNewTitle('');
    setNewDescription('');
    setNewEndDate('');
    setPollOptions(['', '']);
    setSurveyQuestions([
      { questionText: '', questionType: 'multiple-choice', options: ['', ''], required: true }
    ]);
  };

  // Add poll option
  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  // Remove poll option
  const removePollOption = (index) => {
    if (pollOptions.length <= 2) {
      toast.error('Polls require at least 2 options');
      return;
    }
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  // Add survey question
  const addSurveyQuestion = () => {
    setSurveyQuestions([
      ...surveyQuestions,
      { questionText: '', questionType: 'multiple-choice', options: ['', ''], required: true }
    ]);
  };

  // Remove survey question
  const removeSurveyQuestion = (index) => {
    if (surveyQuestions.length <= 1) {
      toast.error('Surveys require at least 1 question');
      return;
    }
    setSurveyQuestions(surveyQuestions.filter((_, i) => i !== index));
  };

  // Add question option
  const addQuestionOption = (questionIndex) => {
    const updatedQuestions = [...surveyQuestions];
    updatedQuestions[questionIndex].options.push('');
    setSurveyQuestions(updatedQuestions);
  };

  // Remove question option
  const removeQuestionOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...surveyQuestions];
    if (updatedQuestions[questionIndex].options.length <= 2) {
      toast.error('Multiple choice questions require at least 2 options');
      return;
    }
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setSurveyQuestions(updatedQuestions);
  };

  // Calculate vote percentages
  const calculatePercentage = (votes, total) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (<div className="min-h-screen bg-gray-50">
    {/* Header */}
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
          <Vote className="mr-3 text-blue-600" size={32} />
          Polls & Surveys
        </h1>
      </div>
    </header>

    {/* Main Content */}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'polls' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('polls')}
        >
          <div className="flex items-center">
            <BarChart className="mr-2" size={16} />
            Polls
          </div>
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'surveys' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('surveys')}
        >
          <div className="flex items-center">
            <FileText className="mr-2" size={16} />
            Surveys
          </div>
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('create')}
        >
          <div className="flex items-center">
            <Plus className="mr-2" size={16} />
            Create New
          </div>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading polls and surveys...</p>
        </div>
      )}

      {/* Polls Tab */}
      {!isLoading && activeTab === 'polls' && !selectedPoll && (
        <>
          {polls.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Vote className="h-16 w-16 text-blue-200 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Polls Available</h3>
              <p className="text-gray-600 mb-6">There are no polls available at the moment.</p>
              <button
                onClick={() => {
                  setActiveTab('create');
                  setCreateType('poll');
                  setIsCreating(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Your First Poll
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {polls.map((poll) => (
                <div key={poll._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300" style={{ minHeight: '400px' }}>
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">{poll.title}</h2>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full 
                      ${poll.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {poll.status === 'active' ? 'Active' : 'Ended'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{poll.description}</p>

                  <div className="space-y-3 mb-4">
                    {poll.options.map((option) => (
                      <div key={option.id} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span>{option.text}</span>
                          <span className="font-medium">{calculatePercentage(option.votes, poll.totalVotes)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full ${poll.userVoted && poll.userVotedOption === option.id ? 'bg-blue-600' : 'bg-gray-500'}`}
                            style={{ width: `${calculatePercentage(option.votes, poll.totalVotes)}%` }}>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center">
                      <Users className="mr-1" size={14} />
                      {poll.totalVotes} votes
                    </span>
                    <span className="flex items-center">
                      <Calendar className="mr-1" size={14} />
                      {formatDate(poll.endDate)}
                    </span>
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-200">
                    {poll.status === 'active' && !poll.userVoted ? (
                      <button
                        onClick={() => setSelectedPoll(poll)}
                        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                      >
                        Vote Now
                      </button>
                    ) : poll.status === 'active' && poll.userVoted ? (
                      <div className="text-center text-sm text-green-600 font-medium flex items-center justify-center">
                        <CheckCircle className="mr-1" size={16} />
                        You have voted
                      </div>
                    ) : (
                      <div className="text-center text-sm text-gray-500 font-medium">Poll ended</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Individual Poll Voting View */}
      {!isLoading && activeTab === 'polls' && selectedPoll && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <button
            onClick={() => { setSelectedPoll(null); setUserVote(null); }}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ChevronLeft className="mr-1" size={20} />
            Back to Polls
          </button>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedPoll.title}</h2>
            <p className="text-gray-600">{selectedPoll.description}</p>
          </div>

          <div className="space-y-4 mb-8">
            {selectedPoll.options.map((option) => (
              <div key={option.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200
                  ${userVote === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                onClick={() => handleVote(selectedPoll._id, option.id)}
              >
                <div className="flex items-center">
                  <div className={`h-5 w-5 rounded-full border mr-3 flex items-center justify-center
                    ${userVote === option.id ? 'border-blue-500' : 'border-gray-300'}`}
                  >
                    {userVote === option.id && (
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                  <span className="text-gray-900">{option.text}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 flex items-center">
              <Calendar className="mr-1" size={14} />
              Poll ends on {formatDate(selectedPoll.endDate)}
            </span>
            <button
              onClick={submitVote}
              disabled={!userVote || isSubmitting}
              className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center
                ${!userVote || isSubmitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Submitting...
                </>
              ) : (
                'Submit Vote'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Surveys Tab */}
      {!isLoading && activeTab === 'surveys' && !selectedSurvey && (
        <>
          {surveys.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FileText className="h-16 w-16 text-blue-200 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Surveys Available</h3>
              <p className="text-gray-600 mb-6">There are no surveys available at the moment.</p>
              <button
                onClick={() => {
                  setActiveTab('create');
                  setCreateType('survey');
                  setIsCreating(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Your First Survey
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {surveys.map((survey) => (
                <div key={survey._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300" style={{ minHeight: '400px' }}>
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">{survey.title}</h2>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full 
                      ${survey.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {survey.status === 'active' ? 'Active' : 'Ended'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">{survey.description}</p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center">
                          <Users className="mr-1" size={14} />
                          Responses
                        </span>
                        <span className="font-medium">{survey.responses}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center">
                          <FileText className="mr-1" size={14} />
                          Questions
                        </span>
                        <span className="font-medium">{survey.questions?.length || 0}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center">
                          <Clock className="mr-1" size={14} />
                          Time to complete
                        </span>
                        <span className="font-medium">~{Math.round((survey.questions?.length || 0) * 0.5)} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-500 flex items-center">
                    <Calendar className="mr-1" size={14} />
                    <span>Ends: {formatDate(survey.endDate)}</span>
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-200">
                    {survey.status === 'active' && !survey.completed ? (
                      <button
                        onClick={() => setSelectedSurvey(survey)}
                        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                      >
                        Take Survey
                      </button>
                    ) : survey.status === 'active' && survey.completed ? (
                      <div className="text-center text-sm text-green-600 font-medium flex items-center justify-center">
                        <CheckCircle className="mr-1" size={16} />
                        You've completed this survey
                      </div>
                    ) : (
                      <div className="text-center text-sm text-gray-500 font-medium">Survey ended</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Individual Survey View */}
      {!isLoading && activeTab === 'surveys' && selectedSurvey && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <button
            onClick={() => { setSelectedSurvey(null); setSurveyResponses({}); }}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ChevronLeft className="mr-1" size={20} />
            Back to Surveys
          </button>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedSurvey.title}</h2>
            <p className="text-gray-600">{selectedSurvey.description}</p>
          </div>

          <div className="space-y-6 mb-8">
            {selectedSurvey.questions?.map((question, qIndex) => (
              <div key={question.id} className="border-b pb-5">
                <h3 className="text-md font-medium mb-3">
                  {qIndex + 1}. {question.questionText}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </h3>

                {question.questionType === 'multiple-choice' && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div key={option.id} className="flex items-center">
                        <input
                          type="radio"
                          id={`q${question.id}-${option.id}`}
                          name={`q${question.id}`}
                          className="h-4 w-4 text-blue-600 mr-2"
                          onChange={() => handleSurveyResponse(question.id, option.id)}
                          checked={surveyResponses[question.id] === option.id}
                        />
                        <label htmlFor={`q${question.id}-${option.id}`} className="text-gray-700">{option.text}</label>
                      </div>
                    ))}
                  </div>
                )}

                {question.questionType === 'checkbox' && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div key={option.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`q${question.id}-${option.id}`}
                          className="h-4 w-4 text-blue-600 mr-2"
                          onChange={(e) => {
                            const currentSelections = surveyResponses[question.id] || [];
                            if (e.target.checked) {
                              handleSurveyResponse(question.id, [...currentSelections, option.id]);
                            } else {
                              handleSurveyResponse(
                                question.id, currentSelections.filter(id => id !== option.id)
                              );
                            }
                          }}
                          checked={(surveyResponses[question.id] || []).includes(option.id)}
                        />
                        <label htmlFor={`q${question.id}-${option.id}`} className="text-gray-700">{option.text}</label>
                      </div>
                    ))}
                  </div>
                )}

                {question.questionType === 'text' && (
                  <textarea
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Your answer..."
                    value={surveyResponses[question.id] || ''}
                    onChange={(e) => handleSurveyResponse(question.id, e.target.value)}
                  ></textarea>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 flex items-center">
              <Clock className="mr-1" size={14} />
              Takes about {Math.round((selectedSurvey.questions?.length || 0) * 0.5)} minutes
            </span>
            <button
              onClick={submitSurvey}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center
                ${isSubmitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Submitting...
                </>
              ) : (
                'Submit Survey'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Create New Tab */}
      {!isLoading && activeTab === 'create' && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Poll or Survey</h2>

          {!isCreating ? (
            <div className="space-y-5 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setCreateType('poll');
                    setIsCreating(true);
                  }}
                  className="p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center"
                >
                  <BarChart className="h-12 w-12 text-blue-500 mb-3" />
                  <span className="text-lg font-medium text-gray-900">New Poll</span>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Create a poll to gather opinions on a specific topic
                  </p>
                </button>

                <button
                  onClick={() => {
                    setCreateType('survey');
                    setIsCreating(true);
                  }}
                  className="p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center"
                >
                  <FileText className="h-12 w-12 text-blue-500 mb-3" />
                  <span className="text-lg font-medium text-gray-900">New Survey</span>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Create a detailed survey with multiple question types
                  </p>
                </button>
              </div>

              <div className="p-5 bg-blue-50 rounded-md border border-blue-100 mt-6">
                <div className="flex items-start">
                  <HelpCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    Polls and surveys are a great way to gather feedback from residents. Polls are simple single-question votes, while surveys can include multiple questions of different types.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {createType === 'poll' ? 'Create New Poll' : 'Create New Survey'}
                </h3>
                <button
                  onClick={resetCreateForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter a title"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Enter a description"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {createType === 'poll' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Poll Options <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={addPollOption}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Option
                      </button>
                    </div>

                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...pollOptions];
                            newOptions[index] = e.target.value;
                            setPollOptions(newOptions);
                          }}
                          className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Option ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removePollOption(index)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {createType === 'survey' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Survey Questions <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={addSurveyQuestion}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Question
                      </button>
                    </div>

                    {surveyQuestions.map((question, qIndex) => (
                      <div key={qIndex} className="border border-gray-200 rounded-md p-4 mb-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Question {qIndex + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeSurveyQuestion(qIndex)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Question Text <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={question.questionText}
                              onChange={(e) => {
                                const newQuestions = [...surveyQuestions];
                                newQuestions[qIndex].questionText = e.target.value;
                                setSurveyQuestions(newQuestions);
                              }}
                              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter your question"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Question Type
                            </label>
                            <select
                              value={question.questionType}
                              onChange={(e) => {
                                const newQuestions = [...surveyQuestions];
                                newQuestions[qIndex].questionType = e.target.value;
                                setSurveyQuestions(newQuestions);
                              }}
                              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="multiple-choice">Multiple Choice (Single Answer)</option>
                              <option value="checkbox">Checkbox (Multiple Answers)</option>
                              <option value="text">Text Answer</option>
                            </select>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`required-${qIndex}`}
                              checked={question.required}
                              onChange={(e) => {
                                const newQuestions = [...surveyQuestions];
                                newQuestions[qIndex].required = e.target.checked;
                                setSurveyQuestions(newQuestions);
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`required-${qIndex}`} className="ml-2 block text-xs text-gray-700">
                              Required question
                            </label>
                          </div>

                          {(question.questionType === 'multiple-choice' || question.questionType === 'checkbox') && (
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-medium text-gray-700">
                                  Options <span className="text-red-500">*</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => addQuestionOption(qIndex)}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  <Plus size={14} className="mr-1" />
                                  Add Option
                                </button>
                              </div>

                              <div className="space-y-2">
                                {question.options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex items-center">
                                    <input
                                      type="text"
                                      value={option}
                                      onChange={(e) => {
                                        const newQuestions = [...surveyQuestions];
                                        newQuestions[qIndex].options[optIndex] = e.target.value;
                                        setSurveyQuestions(newQuestions);
                                      }}
                                      className="flex-1 border border-gray-300 rounded-md p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                                      placeholder={`Option ${optIndex + 1}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeQuestionOption(qIndex, optIndex)}
                                      className="ml-2 text-gray-500 hover:text-red-500"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetCreateForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-3 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    disabled={isSubmitting}
                    className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center
                      ${isSubmitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={16} />
                        Creating...
                      </>
                    ) : (
                      'Create'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  </div>
  );
}
