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
    FileText,
    Vote,
    CheckSquare,
    HelpCircle,
    Loader2,
    X
} from 'lucide-react';
import { FaArrowLeft, FaHistory, FaVoteYea, FaClipboardList } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function ResidentPollsSurveys() {
    const router = useRouter();

    // State variables
    const [polls, setPolls] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [activeTab, setActiveTab] = useState('polls');
    const [selectedPoll, setSelectedPoll] = useState(null);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [userVote, setUserVote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [surveyResponses, setSurveyResponses] = useState({});
    const [userId, setUserId] = useState(null);
    const [societyId, setSocietyId] = useState(null);

    useEffect(() => {
        fetchPollsAndSurveys();
    }, []);

    const fetchPollsAndSurveys = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('Resident');
            if (!token) {
                router.push('/Login');
                return;
            }

            // Get resident details
            const residentResponse = await fetch('/api/Resident-Api/get-resident-details', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!residentResponse.ok) {
                throw new Error('Failed to fetch resident details');
            }

            const residentData = await residentResponse.json();
            setUserId(residentData._id);
            const societyIdFromData = residentData.societyCode;
            setSocietyId(societyIdFromData);

            // Fetch polls
            const pollsResponse = await fetch(`/api/PollSurvey-Api/get-all?type=poll&societyId=${societyIdFromData}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!pollsResponse.ok) {
                throw new Error('Failed to fetch polls');
            }
            const pollsData = await pollsResponse.json();

            // Fetch surveys
            const surveysResponse = await fetch(`/api/PollSurvey-Api/get-all?type=survey&societyId=${societyIdFromData}`, {
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
                const userParticipant = poll.participants?.find(p => p.userId === residentData._id);
                return {
                    ...poll,
                    totalVotes: poll.participants?.length || 0,
                    userVoted: Boolean(userParticipant),
                    userVotedOption: userParticipant?.votedOption || null
                };
            }) || [];

            // Process surveys data
            const processedSurveys = surveysData.data?.map(survey => {
                const userParticipant = survey.participants?.find(p => p.userId === residentData._id);
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
                router.push('/Login');
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
            const token = localStorage.getItem('Resident');
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
                    societyId
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
            const token = localStorage.getItem('Resident');
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
                    societyId
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

    // Calculate vote percentages
    const calculatePercentage = (votes, total) => {
        return total > 0 ? Math.round((votes / total) * 100) : 0;
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    const getPollStats = () => {
        return {
            total: polls.length,
            active: polls.filter(p => p.status === 'active').length,
            ended: polls.filter(p => p.status !== 'active').length,
            taken: polls.filter(p => p.userVoted).length,
            untaken: polls.filter(p => !p.userVoted && p.status === 'active').length
        };
    };

    const getSurveyStats = () => {
        return {
            total: surveys.length,
            active: surveys.filter(s => s.status === 'active').length,
            ended: surveys.filter(s => s.status !== 'active').length,
            completed: surveys.filter(s => s.completed).length,
            pending: surveys.filter(s => !s.completed && s.status === 'active').length
        };
    };
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header with Back Button */}
            <div className="p-4 md:p-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors"
                >
                    <FaArrowLeft size={18} />
                    <span className="text-base">Back</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <h1 className="text-2xl md:text-3xl text-center font-bold text-blue-600 mb-6">Polls & Surveys</h1>

                {/* Toggle Between Polls and Surveys */}
                <div className="flex justify-center mb-6">
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${activeTab === 'polls' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => setActiveTab('polls')}
                        >
                            <FaVoteYea className="inline mr-2" />
                            Polls
                        </button>
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${activeTab === 'surveys' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => setActiveTab('surveys')}
                        >
                            <FaClipboardList className="inline mr-2" />
                            Surveys
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        <span className="ml-2 text-gray-600">Loading...</span>
                    </div>
                )}

                {/* Polls Tab */}
                {!isLoading && activeTab === 'polls' && (
                    <div className="mb-8">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {Object.entries(getPollStats()).map(([key, value]) => (
                                <div key={key} className="bg-white rounded-lg shadow-md p-4 transform hover:scale-105 transition-transform duration-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {key === 'total' && <BarChart className="h-5 w-5 text-blue-500" />}
                                            {key === 'active' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                            {key === 'ended' && <AlertCircle className="h-5 w-5 text-red-500" />}
                                            {key === 'taken' && <CheckSquare className="h-5 w-5 text-purple-500" />}
                                            {key === 'untaken' && <HelpCircle className="h-5 w-5 text-orange-500" />}
                                        </div>
                                        <span className="text-2xl font-bold text-gray-700">{value}</span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600 capitalize">
                                        {key === 'untaken' ? 'Pending' : key} Polls
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {!isLoading && activeTab === 'polls' && !selectedPoll && (
                    <>
                        {polls.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <Vote className="h-16 w-16 text-blue-200 mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-gray-900 mb-2">No Polls Available</h3>
                                <p className="text-gray-600 mb-6">There are no polls available at the moment.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {polls.map((poll) => (
                                    <div key={poll._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300">
                                        <div className="flex justify-between items-start mb-3">
                                            <h2 className="text-lg font-semibold text-gray-900">{poll.title}</h2>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full 
                        ${poll.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {poll.status === 'active' ? 'Active' : 'Ended'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-6">{poll.description}</p>

                                        {poll.userVoted && (
                                            <div className="mb-6">
                                                <h3 className="text-sm font-medium text-gray-700 mb-2">Results:</h3>
                                                <div className="space-y-3">
                                                    {poll.options.map((option) => (
                                                        <div key={option.id} className="relative">
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span>{option.text}</span>
                                                                <span>{calculatePercentage(option.votes, poll.totalVotes)}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                                <div
                                                                    className={`h-2.5 rounded-full ${option.id === poll.userVotedOption ? 'bg-blue-600' : 'bg-gray-400'}`}
                                                                    style={{ width: `${calculatePercentage(option.votes, poll.totalVotes)}%` }}
                                                                ></div>
                                                            </div>
                                                            {option.id === poll.userVotedOption && (
                                                                <div className="absolute right-0 -top-4 text-xs text-blue-600 font-medium">
                                                                    Your vote
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-3 text-xs text-gray-500 text-center">
                                                    Total votes: {poll.totalVotes}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 text-sm text-gray-500 flex items-center">
                                            <Calendar className="mr-1" size={14} />
                                            <span>Ends: {formatDate(poll.endDate)}</span>
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

                {/* Individual Poll View */}
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
                {!isLoading && activeTab === 'surveys' && (
                    <div className="mb-8">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {Object.entries(getSurveyStats()).map(([key, value]) => (
                                <div key={key} className="bg-white rounded-lg shadow-md p-4 transform hover:scale-105 transition-transform duration-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {key === 'total' && <BarChart className="h-5 w-5 text-blue-500" />}
                                            {key === 'active' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                            {key === 'ended' && <AlertCircle className="h-5 w-5 text-red-500" />}
                                            {key === 'completed' && <CheckSquare className="h-5 w-5 text-purple-500" />}
                                            {key === 'pending' && <HelpCircle className="h-5 w-5 text-orange-500" />}
                                        </div>
                                        <span className="text-2xl font-bold text-gray-700">{value}</span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600 capitalize">
                                        {key} Surveys
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {!isLoading && activeTab === 'surveys' && !selectedSurvey && (
                    <>
                        {surveys.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <FileText className="h-16 w-16 text-blue-200 mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-gray-900 mb-2">No Surveys Available</h3>
                                <p className="text-gray-600 mb-6">There are no surveys available at the moment.</p>
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
            </div>
        </div>
    );
}
