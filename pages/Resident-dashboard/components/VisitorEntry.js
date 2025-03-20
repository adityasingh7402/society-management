import React, { useState } from 'react';
import { FaUserCheck, FaUserTimes, FaHistory, FaSearch, FaFilter, FaSort } from 'react-icons/fa';
import { ArrowLeft } from "lucide-react";
import { useRouter } from 'next/router';

export default function VisitorEntry() {
    const [activeTab, setActiveTab] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [visitorType, setVisitorType] = useState('all');
    const [sortBy, setSortBy] = useState('time');
    const [sortOrder, setSortOrder] = useState('desc');
    const router = useRouter();

    // Sample data for pending visitors
    const [pendingVisitors, setPendingVisitors] = useState([
        {
            id: 1,
            name: "Rajesh Kumar",
            phone: "+91 98765 43210",
            email: "rajesh.k@example.com",
            purpose: "Meeting with HR Manager",
            company: "Tech Solutions Ltd.",
            visitType: "Business",
            visitTime: "2025-03-20T10:30:00",
            hostName: "Priya Sharma",
            hostDepartment: "Human Resources",
            image: "https://img.freepik.com/free-photo/smiling-businessman-face-portrait-wearing-suit_53876-148138.jpg"
        },
        {
            id: 2,
            name: "Ananya Singh",
            phone: "+91 87654 32109",
            email: "ananya.s@example.com",
            purpose: "Job Interview",
            company: "Freelancer",
            visitType: "Interview",
            visitTime: "2025-03-20T11:15:00",
            hostName: "Vikram Malhotra",
            hostDepartment: "Engineering",
            image: "https://www.india.com/wp-content/uploads/2014/12/krishna-murthy.jpg"
        },
        {
            id: 3,
            name: "Mohammed Farhan",
            phone: "+91 76543 21098",
            email: "m.farhan@example.com",
            purpose: "Equipment Delivery",
            company: "QuickShip Logistics",
            visitType: "Delivery",
            visitTime: "2025-03-20T09:45:00",
            hostName: "Amit Patel",
            hostDepartment: "Facilities",
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSh7mfz0ZWyJ1mc5_ObMbLHliYBsUDmEYRmXA&s"
        }
    ]);

    // Sample data for visitor history
    const [visitorHistory, setVisitorHistory] = useState([
        {
            id: 101,
            name: "Neha Gupta",
            phone: "+91 65432 10987",
            email: "neha.g@example.com",
            purpose: "Client Meeting",
            company: "Global Finance Inc.",
            visitType: "Business",
            visitTime: "2025-03-19T14:30:00",
            exitTime: "2025-03-19T16:45:00",
            hostName: "Aditya Kapoor",
            hostDepartment: "Sales",
            status: "Approved",
            image: "https://media.gettyimages.com/id/1987655119/photo/smiling-young-businesswoman-standing-in-the-corridor-of-an-office.jpg?s=612x612&w=gi&k=20&c=jyEtRXr75_9MGh9BvKh1wmTulOnFyWqTtcV8Gin9LEg="
        },
        {
            id: 102,
            name: "Karan Mehra",
            phone: "+91 54321 09876",
            email: "karan.m@example.com",
            purpose: "Site Inspection",
            company: "Safety First Consultants",
            visitType: "Inspection",
            visitTime: "2025-03-19T10:00:00",
            exitTime: "2025-03-19T12:30:00",
            hostName: "Sunita Reddy",
            hostDepartment: "Operations",
            status: "Approved",
            image: "https://media.gettyimages.com/id/1987655119/photo/smiling-young-businesswoman-standing-in-the-corridor-of-an-office.jpg?s=612x612&w=gi&k=20&c=jyEtRXr75_9MGh9BvKh1wmTulOnFyWqTtcV8Gin9LEg="
        },
        {
            id: 103,
            name: "Deepika Verma",
            phone: "+91 43210 98765",
            email: "deepika.v@example.com",
            purpose: "Document Submission",
            company: "Individual",
            visitType: "Personal",
            visitTime: "2025-03-18T15:20:00",
            exitTime: null,
            hostName: "Rahul Sharma",
            hostDepartment: "Administration",
            status: "Rejected",
            image: "https://media.gettyimages.com/id/1987655119/photo/smiling-young-businesswoman-standing-in-the-corridor-of-an-office.jpg?s=612x612&w=gi&k=20&c=jyEtRXr75_9MGh9BvKh1wmTulOnFyWqTtcV8Gin9LEg="
        }
    ]);

    // Handle approval action
    const handleApprove = (visitorId) => {
        // Find the visitor in pending list
        const visitor = pendingVisitors.find(v => v.id === visitorId);
        if (visitor) {
            // Add to history with approved status
            setVisitorHistory([
                {
                    ...visitor,
                    id: Date.now(), // Generate a new ID
                    status: 'Approved',
                    exitTime: null
                },
                ...visitorHistory
            ]);
            // Remove from pending list
            setPendingVisitors(pendingVisitors.filter(v => v.id !== visitorId));
        }
    };

    // Handle rejection action
    const handleReject = (visitorId) => {
        // Find the visitor in pending list
        const visitor = pendingVisitors.find(v => v.id === visitorId);
        if (visitor) {
            // Add to history with rejected status
            setVisitorHistory([
                {
                    ...visitor,
                    id: Date.now(), // Generate a new ID
                    status: 'Rejected',
                    exitTime: null
                },
                ...visitorHistory
            ]);
            // Remove from pending list
            setPendingVisitors(pendingVisitors.filter(v => v.id !== visitorId));
        }
    };

    // Filter and sort functions
    const getFilteredVisitors = (visitors) => {
        return visitors
            .filter(visitor => {
                // Search term filter
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch =
                    visitor.name.toLowerCase().includes(searchLower) ||
                    visitor.purpose.toLowerCase().includes(searchLower) ||
                    visitor.company.toLowerCase().includes(searchLower) ||
                    visitor.hostName.toLowerCase().includes(searchLower);

                // Date range filter
                const visitDate = new Date(visitor.visitTime);
                const matchesDateFrom = !dateRange.from || visitDate >= new Date(dateRange.from);
                const matchesDateTo = !dateRange.to || visitDate <= new Date(dateRange.to);

                // Visitor type filter
                const matchesVisitorType = visitorType === 'all' || visitor.visitType === visitorType;

                return matchesSearch && matchesDateFrom && matchesDateTo && matchesVisitorType;
            })
            .sort((a, b) => {
                if (sortBy === 'time') {
                    return sortOrder === 'asc'
                        ? new Date(a.visitTime) - new Date(b.visitTime)
                        : new Date(b.visitTime) - new Date(a.visitTime);
                } else if (sortBy === 'name') {
                    return sortOrder === 'asc'
                        ? a.name.localeCompare(b.name)
                        : b.name.localeCompare(a.name);
                } else if (sortBy === 'purpose') {
                    return sortOrder === 'asc'
                        ? a.purpose.localeCompare(b.purpose)
                        : b.purpose.localeCompare(a.purpose);
                }
                return 0;
            });
    };

    const filteredPendingVisitors = getFilteredVisitors(pendingVisitors);
    const filteredVisitorHistory = getFilteredVisitors(visitorHistory);

    // Format date-time
    const formatDateTime = (dateTimeStr) => {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateTimeStr).toLocaleString('en-IN', options);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setDateRange({ from: '', to: '' });
        setVisitorType('all');
        setSortBy('time');
        setSortOrder('desc');
        setFilterOpen(false);
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
            <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4 md:mb-8 text-center">Visitor Entry</h1>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm md:text-base ${activeTab === 'pending'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending Approval ({pendingVisitors.length})
                    </button>
                    <button
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm md:text-base ${activeTab === 'history'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        onClick={() => setActiveTab('history')}
                    >
                        <FaHistory className="inline mr-2" />
                        Visitor History
                    </button>
                </div>

                {/* Search and Filter Controls */}
                <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
                    <div className="flex flex-col gap-4 mb-4">
                        {/* Search */}
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search visitors, purpose, host..."
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter and Sort Controls */}
                        <div className="flex flex-wrap gap-2">
                            {/* Filter Toggle Button */}
                            <button
                                onClick={() => setFilterOpen(!filterOpen)}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <FaFilter className="mr-2" />
                                Filters {Object.values({
                                    date: dateRange.from || dateRange.to,
                                    visitor: visitorType !== 'all'
                                }).filter(Boolean).length > 0 ? `(${Object.values({
                                    date: dateRange.from || dateRange.to,
                                    visitor: visitorType !== 'all'
                                }).filter(Boolean).length})` : ''}
                            </button>

                            {/* Sort Direction Button */}
                            <button
                                onClick={() => {
                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                }}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <FaSort className="mr-2" />
                                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                            </button>

                            {/* Sort By Dropdown */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <option value="time">Sort by Time</option>
                                <option value="name">Sort by Name</option>
                                <option value="purpose">Sort by Purpose</option>
                            </select>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {filterOpen && (
                        <div className="bg-gray-50 p-4 rounded-lg mt-2 border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Date Range */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                                    <div className="flex space-x-2">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500">From</label>
                                            <input
                                                type="date"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={dateRange.from}
                                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500">To</label>
                                            <input
                                                type="date"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={dateRange.to}
                                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Visitor Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Type</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={visitorType}
                                        onChange={(e) => setVisitorType(e.target.value)}
                                    >
                                        <option value="all">All Visitor Types</option>
                                        <option value="Business">Business</option>
                                        <option value="Interview">Interview</option>
                                        <option value="Delivery">Delivery</option>
                                        <option value="Personal">Personal</option>
                                        <option value="Inspection">Inspection</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Visitor Cards */}
                {activeTab === 'pending' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Visitors Waiting for Approval</h2>

                        {filteredPendingVisitors.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPendingVisitors.map(visitor => (
                                    <div key={visitor.id} className="bg-white rounded-lg shadow overflow-hidden">
                                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                                    <span className="font-semibold text-lg">{visitor.name.charAt(0)}</span>
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-lg font-medium text-gray-900">{visitor.name}</h3>
                                                    <p className="text-sm text-gray-500">{visitor.company}</p>
                                                </div>
                                            </div>
                                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full uppercase font-medium">
                                                {visitor.visitType}
                                            </span>
                                        </div>

                                        <div className="p-4 flex">
                                            <div className="flex-shrink-0 mr-4">
                                                <img
                                                    src={visitor.image}
                                                    alt={visitor.name}
                                                    className="h-32 w-32 object-cover rounded-lg"
                                                />
                                            </div>
                                            <div className="flex-grow">
                                                <div className="mb-2">
                                                    <h4 className="text-sm font-medium text-gray-500">Purpose of Visit</h4>
                                                    <p className="text-sm text-gray-900">{visitor.purpose}</p>
                                                </div>
                                                <div className="mb-2">
                                                    <h4 className="text-sm font-medium text-gray-500">Visit Time</h4>
                                                    <p className="text-sm text-gray-900">{formatDateTime(visitor.visitTime)}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Meeting With</h4>
                                                    <p className="text-sm text-gray-900">{visitor.hostName}</p>
                                                    <p className="text-xs text-gray-500">{visitor.hostDepartment}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500">{visitor.phone}</p>
                                                <p className="text-xs text-gray-500">{visitor.email}</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleReject(visitor.id)}
                                                    className="px-3 py-1 border border-red-300 rounded text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                                                >
                                                    <FaUserTimes className="inline mr-1" />
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(visitor.id)}
                                                    className="px-3 py-1 border border-transparent rounded text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                                                >
                                                    <FaUserCheck className="inline mr-1" />
                                                    Approve
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <p className="text-gray-500 mb-4">No pending visitors match your filters.</p>
                                {(searchTerm || dateRange.from || dateRange.to || visitorType !== 'all') && (
                                    <button
                                        onClick={resetFilters}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Reset Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Visitor History */}
                {activeTab === 'history' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Visitor History</h2>

                        {filteredVisitorHistory.length > 0 ? (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Visitor
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Purpose
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Visit Time
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Host
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredVisitorHistory.map((visitor) => (
                                                <tr key={visitor.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <img
                                                                    className="h-10 w-10 rounded-full object-cover"
                                                                    src={visitor.image}
                                                                    alt={visitor.name}
                                                                />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{visitor.name}</div>
                                                                <div className="text-sm text-gray-500">{visitor.company}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">{visitor.purpose}</div>
                                                        <div className="text-sm text-gray-500">{visitor.visitType}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">{formatDateTime(visitor.visitTime)}</div>
                                                        {visitor.exitTime && (
                                                            <div className="text-sm text-gray-500">
                                                                Exit: {formatDateTime(visitor.exitTime)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">{visitor.hostName}</div>
                                                        <div className="text-sm text-gray-500">{visitor.hostDepartment}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${visitor.status === 'Approved'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {visitor.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <p className="text-gray-500 mb-4">No visitor history matches your filters.</p>
                                {(searchTerm || dateRange.from || dateRange.to || visitorType !== 'all') && (
                                    <button
                                        onClick={resetFilters}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Reset Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}