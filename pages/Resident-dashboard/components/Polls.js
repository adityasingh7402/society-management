import React, { useState } from 'react';
import { ArrowLeft } from "lucide-react";
import { useRouter } from 'next/router';
import { Search, Filter, BarChart2, ChevronRight, ChevronDown, Clock, Check, PieChart } from 'lucide-react';

export default function Polls() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [expandedPollId, setExpandedPollId] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [userVotes, setUserVotes] = useState({});
    const [selectedOptions, setSelectedOptions] = useState({});

    // Sample polls data
    const [polls, setPolls] = useState([
        {
            id: "POLL-2023",
            title: "Community Garden Location",
            category: "Amenities",
            description: "Help us decide where to locate the new community garden.",
            startDate: "2025-03-01",
            endDate: "2025-03-25",
            status: "Active",
            options: [
                { id: 1, text: "Between Block A and B", votes: 45 },
                { id: 2, text: "Near the playground", votes: 32 },
                { id: 3, text: "Rooftop of Block C", votes: 28 },
                { id: 4, text: "Adjacent to the community hall", votes: 19 }
            ],
            totalVotes: 124
        },
        {
            id: "POLL-2022",
            title: "Swimming Pool Operating Hours",
            category: "Facilities",
            description: "We're considering adjusting the swimming pool hours. Please select your preferred timing.",
            startDate: "2025-03-10",
            endDate: "2025-03-30",
            status: "Active",
            options: [
                { id: 1, text: "6:00 AM - 10:00 PM (current hours)", votes: 78 },
                { id: 2, text: "5:00 AM - 11:00 PM (extended hours)", votes: 103 },
                { id: 3, text: "7:00 AM - 9:00 PM (reduced hours)", votes: 15 }
            ],
            totalVotes: 196
        },
        {
            id: "POLL-2021",
            title: "Weekend Cultural Event Selection",
            category: "Events",
            description: "Vote for the cultural event you'd like to see organized for the upcoming community weekend.",
            startDate: "2025-02-20",
            endDate: "2025-03-05",
            status: "Closed",
            options: [
                { id: 1, text: "Music concert", votes: 89 },
                { id: 2, text: "Dance performance", votes: 63 },
                { id: 3, text: "Food festival", votes: 112 },
                { id: 4, text: "Art exhibition", votes: 47 }
            ],
            totalVotes: 311,
            result: {
                winningOption: "Food festival",
                percentage: "36%",
                note: "The food festival will be organized on April 15, 2025. More details will be shared soon."
            }
        },
        {
            id: "POLL-2020",
            title: "Security System Upgrade",
            category: "Security",
            description: "We're planning to upgrade the security system. Please vote for your preferred option.",
            startDate: "2025-02-15",
            endDate: "2025-02-28",
            status: "Closed",
            options: [
                { id: 1, text: "Enhanced CCTV coverage", votes: 156 },
                { id: 2, text: "Biometric access control", votes: 187 },
                { id: 3, text: "24/7 security personnel", votes: 92 },
                { id: 4, text: "Smart locks for all units", votes: 78 }
            ],
            totalVotes: 513,
            result: {
                winningOption: "Biometric access control",
                percentage: "36.5%",
                note: "Implementation will begin in April 2025. All residents will need to register their biometrics."
            }
        },
        {
            id: "POLL-2019",
            title: "Community Gym Equipment",
            category: "Amenities",
            description: "Help us decide which new equipment to add to our community gym.",
            startDate: "2025-02-01",
            endDate: "2025-02-15",
            status: "Closed",
            options: [
                { id: 1, text: "Rowing machines", votes: 45 },
                { id: 2, text: "Climbing wall", votes: 28 },
                { id: 3, text: "Additional free weights", votes: 67 },
                { id: 4, text: "Functional training area", votes: 72 }
            ],
            totalVotes: 212,
            result: {
                winningOption: "Functional training area",
                percentage: "34%",
                note: "We will be installing a new functional training area by the end of March 2025."
            }
        },
        {
            id: "POLL-2018",
            title: "Children's Play Area Upgrade",
            category: "Children",
            description: "We're upgrading the children's play area. What would you like to see added?",
            startDate: "2025-01-15",
            endDate: "2025-01-31",
            status: "Closed",
            options: [
                { id: 1, text: "Climbing frames", votes: 84 },
                { id: 2, text: "Water play section", votes: 112 },
                { id: 3, text: "Swing sets", votes: 67 },
                { id: 4, text: "Sand pit", votes: 43 }
            ],
            totalVotes: 306,
            result: {
                winningOption: "Water play section",
                percentage: "36.6%",
                note: "Water play section will be installed before summer. Safety features will include non-slip surfaces and shallow water depth."
            }
        },
        {
            id: "POLL-2024",
            title: "EV Charging Stations",
            category: "Facilities",
            description: "Would you support adding electric vehicle charging stations in our parking area?",
            startDate: "2025-03-18",
            endDate: "2025-04-02",
            status: "Upcoming",
            options: [
                { id: 1, text: "Yes, with reserved spots", votes: 0 },
                { id: 2, text: "Yes, but with shared spots only", votes: 0 },
                { id: 3, text: "No, not needed at this time", votes: 0 }
            ],
            totalVotes: 0
        }
    ]);

    // Status badge component
    const StatusBadge = ({ status }) => {
        let bgColor, textColor, icon;
        
        switch(status) {
            case 'Active':
                bgColor = 'bg-green-100';
                textColor = 'text-green-800';
                icon = <Clock size={14} className="mr-1" />;
                break;
            case 'Closed':
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-800';
                icon = <Check size={14} className="mr-1" />;
                break;
            case 'Upcoming':
                bgColor = 'bg-blue-100';
                textColor = 'text-blue-800';
                icon = <Clock size={14} className="mr-1" />;
                break;
            default:
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-800';
                icon = <Clock size={14} className="mr-1" />;
        }
        
        return (
            <span className={`flex items-center ${bgColor} ${textColor} text-xs px-2 py-1 rounded-full`}>
                {icon}
                {status}
            </span>
        );
    };

    // Format date function
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Calculate percentage for a poll option
    const calculatePercentage = (votes, totalVotes) => {
        if (totalVotes === 0) return '0%';
        return `${Math.round((votes / totalVotes) * 100)}%`;
    };

    // Handle vote submission
    const handleVote = (pollId, optionId) => {
        // Check if user already voted on this poll
        if (userVotes[pollId]) {
            alert("You have already voted on this poll!");
            return;
        }

        // Update poll data
        const updatedPolls = polls.map(poll => {
            if (poll.id === pollId) {
                const updatedOptions = poll.options.map(option => {
                    if (option.id === optionId) {
                        return { ...option, votes: option.votes + 1 };
                    }
                    return option;
                });
                return { 
                    ...poll, 
                    options: updatedOptions, 
                    totalVotes: poll.totalVotes + 1 
                };
            }
            return poll;
        });

        // Track user vote
        setUserVotes({
            ...userVotes,
            [pollId]: optionId
        });

        // Update polls state
        setPolls(updatedPolls);
    };

    // Handle option selection (before submitting)
    const handleOptionSelect = (pollId, optionId) => {
        setSelectedOptions({
            ...selectedOptions,
            [pollId]: optionId
        });
    };

    // Filter polls based on search and filters
    const filteredPolls = polls
        .filter(poll => {
            // Apply search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    poll.id.toLowerCase().includes(query) ||
                    poll.title.toLowerCase().includes(query) ||
                    poll.description.toLowerCase().includes(query)
                );
            }
            return true;
        })
        .filter(poll => {
            // Apply status filter
            if (filterStatus !== 'All') {
                return poll.status === filterStatus;
            }
            return true;
        })
        .filter(poll => {
            // Apply category filter
            if (filterCategory !== 'All') {
                return poll.category === filterCategory;
            }
            return true;
        })
        // Sort by date with active polls first, then upcoming, then closed
        .sort((a, b) => {
            const statusOrder = { 'Active': 0, 'Upcoming': 1, 'Closed': 2 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            return new Date(b.startDate) - new Date(a.startDate);
        });

    // Get unique poll categories for filter dropdown
    const pollCategories = ['All', ...new Set(polls.map(poll => poll.category))];
    
    // Handle clicking on a poll
    const togglePollDetails = (pollId) => {
        if (expandedPollId === pollId) {
            setExpandedPollId(null);
        } else {
            setExpandedPollId(pollId);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div>
                <button onClick={() => router.back()} className="flex items-center p-4 md:p-6 space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors">
                    <ArrowLeft size={18} />
                    <span className="text-base">Back</span>
                </button>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4 md:mb-8 text-center">Community Polls</h1>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mb-8">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Search and Filter Bar */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search polls..."
                                    className="pl-10 p-2 w-full border border-gray-300 rounded-md"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button
                                className="md:hidden flex items-center justify-center p-2 border border-gray-300 rounded-md text-gray-700"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter size={18} className="mr-2" />
                                <span>Filters</span>
                            </button>
                            <div className={`flex flex-col md:flex-row gap-2 ${showFilters ? 'block' : 'hidden md:flex'}`}>
                                <select
                                    className="p-2 border border-gray-300 rounded-md text-gray-700"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Upcoming">Upcoming</option>
                                    <option value="Closed">Closed</option>
                                </select>
                                <select
                                    className="p-2 border border-gray-300 rounded-md text-gray-700"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    {pollCategories.map(category => (
                                        <option key={category} value={category}>{category === 'All' ? 'All Categories' : category}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Polls List */}
                    {filteredPolls.length > 0 ? (
                        <div>
                            {filteredPolls.map(poll => (
                                <div key={poll.id} className="border-b border-gray-200 last:border-b-0">
                                    {/* Poll Summary Row */}
                                    <div 
                                        className="p-4 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => togglePollDetails(poll.id)}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <div className="flex flex-col">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-gray-900">{poll.title}</span>
                                                    <span className="text-sm text-gray-500">{poll.id}</span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                                                    <span>{poll.category}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(poll.startDate)} - {formatDate(poll.endDate)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <StatusBadge status={poll.status} />
                                                {expandedPollId === poll.id ? 
                                                    <ChevronDown size={20} className="text-gray-400" /> :
                                                    <ChevronRight size={20} className="text-gray-400" />
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Poll Details */}
                                    {expandedPollId === poll.id && (
                                        <div className="px-4 pb-6 bg-gray-50 border-t border-gray-200">
                                            <div className="py-4">
                                                <div className="flex items-center mb-3 space-x-2">
                                                    <BarChart2 size={16} className="text-blue-600" />
                                                    <h3 className="font-medium text-lg text-gray-900">{poll.title}</h3>
                                                </div>
                                                
                                                <p className="text-gray-700 mb-4">{poll.description}</p>
                                                
                                                <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <span className="font-medium">Status:</span>
                                                        <StatusBadge status={poll.status} />
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Period:</span>
                                                        <span className="ml-1">{formatDate(poll.startDate)} - {formatDate(poll.endDate)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Total Votes:</span>
                                                        <span className="ml-1">{poll.totalVotes}</span>
                                                    </div>
                                                </div>

                                                {/* Poll Options */}
                                                <div className="space-y-3 mb-4">
                                                    {poll.options.map(option => {
                                                        const percentage = calculatePercentage(option.votes, poll.totalVotes);
                                                        const isVoted = userVotes[poll.id] === option.id;
                                                        const isSelected = selectedOptions[poll.id] === option.id;
                                                        
                                                        return (
                                                            <div key={option.id} className="bg-white rounded-md border border-gray-200">
                                                                <div className="flex items-start p-3">
                                                                    {/* Option selection for active polls */}
                                                                    {poll.status === 'Active' && !userVotes[poll.id] && (
                                                                        <div className="mr-3 mt-0.5">
                                                                            <input
                                                                                type="radio"
                                                                                name={`poll-${poll.id}`}
                                                                                id={`option-${poll.id}-${option.id}`}
                                                                                checked={isSelected}
                                                                                onChange={() => handleOptionSelect(poll.id, option.id)}
                                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    
                                                                    <div className="flex-grow">
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <label 
                                                                                htmlFor={`option-${poll.id}-${option.id}`}
                                                                                className={`font-medium ${isVoted ? 'text-blue-700' : 'text-gray-900'}`}
                                                                            >
                                                                                {option.text}
                                                                                {isVoted && (
                                                                                    <span className="ml-2 text-sm text-blue-600">(Your vote)</span>
                                                                                )}
                                                                            </label>
                                                                            <span className="text-gray-700">{percentage}</span>
                                                                        </div>
                                                                        
                                                                        {/* Progress bar */}
                                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                                            <div 
                                                                                className={`h-2.5 rounded-full ${isVoted ? 'bg-blue-600' : 'bg-blue-400'}`}
                                                                                style={{ width: percentage }}
                                                                            ></div>
                                                                        </div>
                                                                        
                                                                        {/* Vote count */}
                                                                        <div className="mt-1 text-xs text-gray-500">
                                                                            {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Vote button for active polls */}
                                                {poll.status === 'Active' && (
                                                    <div className="mt-4">
                                                        {userVotes[poll.id] ? (
                                                            <div className="text-sm text-green-600 font-medium">
                                                                Thank you for voting!
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    if (selectedOptions[poll.id]) {
                                                                        handleVote(poll.id, selectedOptions[poll.id]);
                                                                    } else {
                                                                        alert("Please select an option to vote!");
                                                                    }
                                                                }}
                                                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                                disabled={!selectedOptions[poll.id]}
                                                            >
                                                                Submit Vote
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Results section for closed polls */}
                                                {poll.status === 'Closed' && poll.result && (
                                                    <div className="mt-4 bg-blue-50 p-4 rounded-md">
                                                        <div className="flex items-center mb-2">
                                                            <PieChart size={16} className="text-blue-600 mr-2" />
                                                            <h4 className="font-medium text-blue-800">Poll Results</h4>
                                                        </div>
                                                        <p className="text-gray-700">
                                                            <span className="font-medium">Winning option:</span> {poll.result.winningOption} ({poll.result.percentage})
                                                        </p>
                                                        {poll.result.note && (
                                                            <p className="text-gray-700 mt-2">{poll.result.note}</p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Message for upcoming polls */}
                                                {poll.status === 'Upcoming' && (
                                                    <div className="mt-4 bg-blue-50 p-4 rounded-md">
                                                        <p className="text-gray-700">
                                                            This poll is not yet active. Voting will begin on {formatDate(poll.startDate)}.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <BarChart2 size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No polls found</h3>
                            <p className="text-gray-500">
                                {searchQuery || filterStatus !== 'All' || filterCategory !== 'All' ? 
                                    'Try adjusting your search or filters' : 
                                    'There are no polls available at this time'}
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}