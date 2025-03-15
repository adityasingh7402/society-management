// pages/polls-surveys.js
import React, { useState } from 'react';

export default function PollsSurveys() {
  // Sample data for active polls and surveys
  const [polls, setPolls] = useState([
    {
      id: 1,
      title: "Garden Area Renovation",
      description: "Vote on the proposed designs for garden area renovation",
      status: "active",
      endDate: "2025-03-30",
      totalVotes: 42,
      options: [
        { id: 1, text: "Design A - Modern Theme", votes: 18 },
        { id: 2, text: "Design B - Traditional Theme", votes: 14 },
        { id: 3, text: "Design C - Eco-friendly Theme", votes: 10 }
      ],
      userVoted: false
    },
    {
      id: 2,
      title: "Society Event Planning",
      description: "Choose which events to organize in the coming quarter",
      status: "active",
      endDate: "2025-04-05",
      totalVotes: 35,
      options: [
        { id: 1, text: "Cultural Festival", votes: 15 },
        { id: 2, text: "Sports Tournament", votes: 12 },
        { id: 3, text: "Community Service Day", votes: 8 }
      ],
      userVoted: true,
      userVotedOption: 1
    },
    {
      id: 3,
      title: "Swimming Pool Schedule",
      description: "Preferred time slots for swimming pool usage",
      status: "ended",
      endDate: "2025-03-10",
      totalVotes: 68,
      options: [
        { id: 1, text: "Morning (6 AM - 9 AM)", votes: 28 },
        { id: 2, text: "Afternoon (2 PM - 5 PM)", votes: 12 },
        { id: 3, text: "Evening (6 PM - 9 PM)", votes: 28 }
      ],
      userVoted: true,
      userVotedOption: 3
    }
  ]);

  // Sample data for surveys
  const [surveys, setSurveys] = useState([
    {
      id: 1,
      title: "Society Maintenance Satisfaction Survey",
      description: "Please provide your feedback on the building maintenance services",
      status: "active",
      endDate: "2025-04-10",
      responses: 36,
      totalQuestions: 10,
      completed: false
    },
    {
      id: 2,
      title: "Security Services Feedback",
      description: "Share your experience and suggestions for our security personnel",
      status: "active",
      endDate: "2025-03-25",
      responses: 28,
      totalQuestions: 8,
      completed: true
    },
    {
      id: 3,
      title: "Annual Facility Usage Survey",
      description: "Help us understand how residents use our common facilities",
      status: "ended",
      endDate: "2025-03-05",
      responses: 54,
      totalQuestions: 12,
      completed: true
    }
  ]);

  const [activeTab, setActiveTab] = useState('polls');
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [userVote, setUserVote] = useState(null);

  // Function to handle voting
  const handleVote = (pollId, optionId) => {
    setUserVote(optionId);
  };

  // Function to submit vote
  const submitVote = () => {
    if (!userVote || !selectedPoll) return;

    setPolls(polls.map(poll => {
      if (poll.id === selectedPoll.id) {
        // Update the votes for the selected option
        const updatedOptions = poll.options.map(option => {
          if (option.id === userVote) {
            return { ...option, votes: option.votes + 1 };
          }
          return option;
        });

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

    setSelectedPoll(null);
    setUserVote(null);
  };

  // Calculate vote percentages
  const calculatePercentage = (votes, total) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Polls & Surveys</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'polls' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('polls')}
          >
            Polls
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'surveys' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('surveys')}
          >
            Surveys
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('create')}
          >
            Create New
          </button>
        </div>

        {/* Polls Tab */}
        {activeTab === 'polls' && !selectedPoll && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {polls.map((poll) => (
              <div key={poll.id} className="bg-white rounded-lg shadow p-6" style={{ minHeight: '400px' }}>
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
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${poll.userVoted && poll.userVotedOption === option.id ? 'bg-blue-600' : 'bg-gray-500'}`}
                          style={{ width: `${calculatePercentage(option.votes, poll.totalVotes)}%` }}>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                  <span>Total Votes: {poll.totalVotes}</span>
                  <span>Ends: {poll.endDate}</span>
                </div>

                <div className="mt-5 pt-5 border-t border-gray-200">
                  {poll.status === 'active' && !poll.userVoted ? (
                    <button
                      onClick={() => setSelectedPoll(poll)}
                      className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                    >
                      Vote Now
                    </button>
                  ) : poll.status === 'active' && poll.userVoted ? (
                    <div className="text-center text-sm text-green-600 font-medium">You have voted</div>
                  ) : (
                    <div className="text-center text-sm text-gray-500 font-medium">Poll ended</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Individual Poll Voting View */}
        {activeTab === 'polls' && selectedPoll && (
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto" style={{ minHeight: '400px' }}>
            <button
              onClick={() => { setSelectedPoll(null); setUserVote(null); }}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Polls
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedPoll.title}</h2>
              <p className="text-gray-600">{selectedPoll.description}</p>
            </div>

            <div className="space-y-4 mb-8">
              {selectedPoll.options.map((option) => (
                <div key={option.id}
                  className={`p-4 border rounded-lg cursor-pointer 
                    ${userVote === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  onClick={() => handleVote(selectedPoll.id, option.id)}
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
              <span className="text-sm text-gray-500">Poll ends on {selectedPoll.endDate}</span>
              <button
                onClick={submitVote}
                disabled={!userVote}
                className={`px-6 py-2 rounded-md font-medium 
                  ${userVote ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                Submit Vote
              </button>
            </div>
          </div>
        )}

        {/* Surveys Tab */}
        {activeTab === 'surveys' && !selectedSurvey && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <div key={survey.id} className="bg-white rounded-lg shadow p-6" style={{ minHeight: '400px' }}>
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
                      <span>Responses</span>
                      <span className="font-medium">{survey.responses}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Questions</span>
                      <span className="font-medium">{survey.totalQuestions}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Time to complete</span>
                      <span className="font-medium">~{Math.round(survey.totalQuestions * 0.5)} min</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  <span>Ends: {survey.endDate}</span>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-200">
                  {survey.status === 'active' && !survey.completed ? (
                    <button
                      onClick={() => setSelectedSurvey(survey)}
                      className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                    >
                      Take Survey
                    </button>
                  ) : survey.status === 'active' && survey.completed ? (
                    <div className="text-center text-sm text-green-600 font-medium">You've completed this survey</div>
                  ) : (
                    <div className="text-center text-sm text-gray-500 font-medium">Survey ended</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Individual Survey View */}
        {activeTab === 'surveys' && selectedSurvey && (
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
            <button
              onClick={() => setSelectedSurvey(null)}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Surveys
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedSurvey.title}</h2>
              <p className="text-gray-600">{selectedSurvey.description}</p>
            </div>

            <div className="space-y-6 mb-8">
              {/* Example survey questions would go here */}
              <div className="border-b pb-5">
                <h3 className="text-md font-medium mb-3">1. How satisfied are you with the current services?</h3>
                <div className="space-y-2">
                  {['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'].map((option, idx) => (
                    <div key={idx} className="flex items-center">
                      <input type="radio" id={`q1-${idx}`} name="q1" className="h-4 w-4 text-blue-600 mr-2" />
                      <label htmlFor={`q1-${idx}`} className="text-gray-700">{option}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-b pb-5">
                <h3 className="text-md font-medium mb-3">2. How often do you use the community facilities?</h3>
                <div className="space-y-2">
                  {['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'].map((option, idx) => (
                    <div key={idx} className="flex items-center">
                      <input type="radio" id={`q2-${idx}`} name="q2" className="h-4 w-4 text-blue-600 mr-2" />
                      <label htmlFor={`q2-${idx}`} className="text-gray-700">{option}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pb-5">
                <h3 className="text-md font-medium mb-3">3. Do you have any suggestions for improvement?</h3>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  placeholder="Your suggestions..."
                ></textarea>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Survey takes about {Math.round(selectedSurvey.totalQuestions * 0.5)} minutes to complete</span>
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Submit Survey
              </button>
            </div>
          </div>
        )}

        {/* Create New Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New</h2>

            <div className="space-y-5 mb-8">
              <div className="flex space-x-4">
                <button
                  className="flex-1 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  New Poll
                </button>
                <button
                  className="flex-1 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  New Survey
                </button>
              </div>

              <div className="p-5 bg-gray-50 rounded-md">
                <p className="text-gray-600">Creating a poll or survey requires administrator approval. Your submission will be reviewed before being published.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}