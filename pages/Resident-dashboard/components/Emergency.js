import React, { useState } from 'react';
import { FaExclamationTriangle, FaSearch, FaFilter, FaSort, FaBell, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import { ArrowLeft, AlertTriangle, Bell, Calendar, Clock } from "lucide-react";
import { useRouter } from 'next/router';

export default function EmergencyManagement() {
    const [activeTab, setActiveTab] = useState('active');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [emergencyType, setEmergencyType] = useState('all');
    const [sortBy, setSortBy] = useState('time');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const router = useRouter();

    // Form state for creating new emergency
    const [newEmergency, setNewEmergency] = useState({
        title: '',
        description: '',
        location: '',
        type: 'Fire',
        severity: 'High',
        affectedAreas: ''
    });

    // Sample data for active emergencies
    const [activeEmergencies, setActiveEmergencies] = useState([
        {
            id: 1,
            title: "Fire in Server Room",
            description: "Electrical fire detected in the main server room. Fire suppression system activated. All personnel evacuated.",
            location: "Building A, 3rd Floor, Room 304",
            type: "Fire",
            severity: "High",
            createdAt: "2025-03-20T08:45:00",
            updatedAt: "2025-03-20T09:15:00",
            reportedBy: "Amit Kumar",
            department: "IT Infrastructure",
            affectedAreas: "IT Services, Network Connectivity",
            status: "Active"
        },
        {
            id: 2,
            title: "Water Leak in Laboratory",
            description: "Major water leak from ceiling pipes. Equipment potentially damaged. Area cordoned off.",
            location: "Building B, 2nd Floor, Lab 205",
            type: "Infrastructure",
            severity: "Medium",
            createdAt: "2025-03-20T10:30:00",
            updatedAt: "2025-03-20T10:45:00",
            reportedBy: "Priya Sharma",
            department: "Research & Development",
            affectedAreas: "Laboratory Operations, Research Projects",
            status: "Active"
        },
        {
            id: 3,
            title: "Unauthorized Access Alert",
            description: "Security system detected multiple failed login attempts at secure area. Security team dispatched.",
            location: "Building C, Basement, Server Hub",
            type: "Security",
            severity: "High",
            createdAt: "2025-03-20T07:20:00",
            updatedAt: "2025-03-20T07:35:00",
            reportedBy: "Rajiv Singh",
            department: "Security",
            affectedAreas: "Data Center, Network Infrastructure",
            status: "Active"
        }
    ]);

    // Sample data for resolved emergencies
    const [resolvedEmergencies, setResolvedEmergencies] = useState([
        {
            id: 101,
            title: "Power Outage",
            description: "Complete power failure in the east wing. Backup generators activated successfully.",
            location: "Building A, East Wing",
            type: "Power",
            severity: "High",
            createdAt: "2025-03-19T14:15:00",
            updatedAt: "2025-03-19T16:30:00",
            resolvedAt: "2025-03-19T16:30:00",
            reportedBy: "Vikram Malhotra",
            department: "Facilities",
            affectedAreas: "All East Wing Operations",
            status: "Resolved"
        },
        {
            id: 102,
            title: "Chemical Spill",
            description: "Minor chemical spill in the research lab. Contained within the spill tray. No injuries reported.",
            location: "Building B, 1st Floor, Lab 102",
            type: "Hazardous Material",
            severity: "Medium",
            createdAt: "2025-03-18T09:40:00",
            updatedAt: "2025-03-18T10:55:00",
            resolvedAt: "2025-03-18T10:55:00",
            reportedBy: "Meera Patel",
            department: "Chemical Research",
            affectedAreas: "Research Lab Operations",
            status: "Resolved"
        },
        {
            id: 103,
            title: "Network Outage",
            description: "Core network switch failure causing widespread connectivity issues. Backup systems engaged.",
            location: "Main Data Center",
            type: "IT",
            severity: "High",
            createdAt: "2025-03-17T16:10:00",
            updatedAt: "2025-03-17T18:45:00",
            resolvedAt: "2025-03-17T18:45:00",
            reportedBy: "Arjun Mehta",
            department: "Network Operations",
            affectedAreas: "All Internet Services, Internal Applications",
            status: "Resolved"
        }
    ]);

    // Handle resolving an emergency
    const handleResolve = (emergencyId) => {
        // Find the emergency in active list
        const emergency = activeEmergencies.find(e => e.id === emergencyId);
        if (emergency) {
            const now = new Date().toISOString();
            // Add to resolved with resolved status
            setResolvedEmergencies([
                {
                    ...emergency,
                    status: 'Resolved',
                    resolvedAt: now,
                    updatedAt: now
                },
                ...resolvedEmergencies
            ]);
            // Remove from active list
            setActiveEmergencies(activeEmergencies.filter(e => e.id !== emergencyId));
        }
    };

    // Handle creating a new emergency
    const handleCreateEmergency = () => {
        const now = new Date().toISOString();
        const newEmergencyEntry = {
            id: Date.now(),
            ...newEmergency,
            createdAt: now,
            updatedAt: now,
            reportedBy: "Current User", // In a real app, this would be the authenticated user
            department: "Current Department", // In a real app, this would be the user's department
            status: "Active"
        };

        setActiveEmergencies([newEmergencyEntry, ...activeEmergencies]);
        setShowCreateModal(false);

        // Reset form
        setNewEmergency({
            title: '',
            description: '',
            location: '',
            type: 'Fire',
            severity: 'High',
            affectedAreas: ''
        });
    };

    // Filter and sort functions
    const getFilteredEmergencies = (emergencies) => {
        return emergencies
            .filter(emergency => {
                // Search term filter
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch =
                    emergency.title.toLowerCase().includes(searchLower) ||
                    emergency.description.toLowerCase().includes(searchLower) ||
                    emergency.location.toLowerCase().includes(searchLower) ||
                    emergency.reportedBy.toLowerCase().includes(searchLower);

                // Date range filter
                const createdDate = new Date(emergency.createdAt);
                const matchesDateFrom = !dateRange.from || createdDate >= new Date(dateRange.from);
                const matchesDateTo = !dateRange.to || createdDate <= new Date(dateRange.to);

                // Emergency type filter
                const matchesEmergencyType = emergencyType === 'all' || emergency.type === emergencyType;

                return matchesSearch && matchesDateFrom && matchesDateTo && matchesEmergencyType;
            })
            .sort((a, b) => {
                if (sortBy === 'time') {
                    return sortOrder === 'asc'
                        ? new Date(a.createdAt) - new Date(b.createdAt)
                        : new Date(b.createdAt) - new Date(a.createdAt);
                } else if (sortBy === 'title') {
                    return sortOrder === 'asc'
                        ? a.title.localeCompare(b.title)
                        : b.title.localeCompare(a.title);
                } else if (sortBy === 'severity') {
                    const severityOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
                    return sortOrder === 'asc'
                        ? severityOrder[a.severity] - severityOrder[b.severity]
                        : severityOrder[b.severity] - severityOrder[a.severity];
                }
                return 0;
            });
    };

    const filteredActiveEmergencies = getFilteredEmergencies(activeEmergencies);
    const filteredResolvedEmergencies = getFilteredEmergencies(resolvedEmergencies);

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
        setEmergencyType('all');
        setSortBy('time');
        setSortOrder('desc');
        setFilterOpen(false);
    };

    // Get severity color class
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'High':
                return 'bg-red-100 text-red-800';
            case 'Medium':
                return 'bg-orange-100 text-orange-800';
            case 'Low':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Get emergency type icon
    const getEmergencyTypeIcon = (type) => {
        switch (type) {
            case 'Fire':
                return "🔥";
            case 'Security':
                return "🔒";
            case 'Infrastructure':
                return "🏗️";
            case 'Power':
                return "⚡";
            case 'Hazardous Material':
                return "☣️";
            case 'IT':
                return "💻";
            default:
                return "⚠️";
        }
    };

    // Create emergency notification modal
    const renderCreateEmergencyModal = () => {
        if (!showCreateModal) return null;

        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">Create Emergency Warning</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Title*</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Brief title describing the emergency"
                                    value={newEmergency.title}
                                    onChange={(e) => setNewEmergency({ ...newEmergency, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Detailed description of the emergency"
                                    rows={4}
                                    value={newEmergency.description}
                                    onChange={(e) => setNewEmergency({ ...newEmergency, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location*</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Specific location of the emergency"
                                    value={newEmergency.location}
                                    onChange={(e) => setNewEmergency({ ...newEmergency, location: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Type</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={newEmergency.type}
                                        onChange={(e) => setNewEmergency({ ...newEmergency, type: e.target.value })}
                                    >
                                        <option value="Fire">Fire</option>
                                        <option value="Security">Security</option>
                                        <option value="Infrastructure">Infrastructure</option>
                                        <option value="Power">Power</option>
                                        <option value="Hazardous Material">Hazardous Material</option>
                                        <option value="IT">IT</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={newEmergency.severity}
                                        onChange={(e) => setNewEmergency({ ...newEmergency, severity: e.target.value })}
                                    >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Affected Areas/Services</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Areas or services affected by this emergency"
                                    value={newEmergency.affectedAreas}
                                    onChange={(e) => setNewEmergency({ ...newEmergency, affectedAreas: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateEmergency}
                            disabled={!newEmergency.title || !newEmergency.description || !newEmergency.location}
                            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${!newEmergency.title || !newEmergency.description || !newEmergency.location
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            Create Warning
                        </button>
                    </div>
                </div>
            </div>
        );
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
            <h1 className="text-2xl md:text-4xl font-bold text-red-600 mb-4 md:mb-8 text-center">Emergency Management</h1>

            {/* Create Emergency Button */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="mb-6 px-6 py-3 bg-red-600 text-white rounded-md font-medium flex items-center justify-center hover:bg-red-700 transition-colors shadow-md"
                >
                    <FaPlus className="mr-2" />
                    Create Emergency Warning
                </button>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm md:text-base ${activeTab === 'active'
                            ? 'border-red-500 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        onClick={() => setActiveTab('active')}
                    >
                        <FaExclamationTriangle className="inline mr-2" />
                        Active Emergencies ({activeEmergencies.length})
                    </button>
                    <button
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm md:text-base ${activeTab === 'resolved'
                            ? 'border-red-500 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        onClick={() => setActiveTab('resolved')}
                    >
                        <FaCheck className="inline mr-2" />
                        Resolved
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
                                placeholder="Search emergency title, description, location..."
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
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
                                    emergency: emergencyType !== 'all'
                                }).filter(Boolean).length > 0 ? `(${Object.values({
                                    date: dateRange.from || dateRange.to,
                                    emergency: emergencyType !== 'all'
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
                                <option value="title">Sort by Title</option>
                                <option value="severity">Sort by Severity</option>
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
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                                value={dateRange.from}
                                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500">To</label>
                                            <input
                                                type="date"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                                value={dateRange.to}
                                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Type</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                        value={emergencyType}
                                        onChange={(e) => setEmergencyType(e.target.value)}
                                    >
                                        <option value="all">All Emergency Types</option>
                                        <option value="Fire">Fire</option>
                                        <option value="Security">Security</option>
                                        <option value="Infrastructure">Infrastructure</option>
                                        <option value="Power">Power</option>
                                        <option value="Hazardous Material">Hazardous Material</option>
                                        <option value="IT">IT</option>
                                        <option value="Other">Other</option>
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

                {/* Emergency Cards - Active */}
                {activeTab === 'active' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Emergency Situations</h2>

                        {filteredActiveEmergencies.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredActiveEmergencies.map(emergency => (
                                    <div key={emergency.id} className="bg-white rounded-lg shadow overflow-hidden border-l-4 border-red-500">
                                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                            <div className="flex-grow">
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-2">{getEmergencyTypeIcon(emergency.type)}</span>
                                                    <h3 className="text-lg font-medium text-gray-900 truncate">{emergency.title}</h3>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">{emergency.location}</p>
                                            </div>
                                            <span className={`${getSeverityColor(emergency.severity)} text-xs px-2 py-1 rounded-full uppercase font-medium`}>
                                                {emergency.severity}
                                            </span>
                                        </div>

                                        <div className="p-4">
                                            <div className="mb-3">
                                                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                                                <p className="text-sm text-gray-900">{emergency.description}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Reported By</h4>
                                                    <p className="text-sm text-gray-900">{emergency.reportedBy}</p>
                                                    <p className="text-xs text-gray-500">{emergency.department}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Time Reported</h4>
                                                    <p className="text-sm text-gray-900">{formatDateTime(emergency.createdAt)}</p>
                                                </div>
                                            </div>

                                            {emergency.affectedAreas && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Affected Areas/Services</h4>
                                                    <p className="text-sm text-gray-900">{emergency.affectedAreas}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Clock size={14} className="mr-1" />
                                                Last updated: {formatDateTime(emergency.updatedAt)}
                                            </div>
                                            {/* <button
                                                onClick={() => handleResolve(emergency.id)}
                                                className="flex items-center px-3 py-1 border border-green-600 rounded text-sm font-medium text-green-700 bg-white hover:bg-green-50"
                                            >
                                                <FaCheck className="mr-1" />
                                                Mark as Resolved
                                            </button> */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500 mb-4">No active emergencies match your filters.</p>
                                {(searchTerm || dateRange.from || dateRange.to || emergencyType !== 'all') && (
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

                {/* Emergency History */}
                {activeTab === 'resolved' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Resolved Emergencies History</h2>

                        {filteredResolvedEmergencies.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredResolvedEmergencies.map(emergency => (
                                    <div key={emergency.id} className="bg-white rounded-lg shadow overflow-hidden border-l-4 border-green-500">
                                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                            <div className="flex-grow">
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-2">{getEmergencyTypeIcon(emergency.type)}</span>
                                                    <h3 className="text-lg font-medium text-gray-900 truncate">{emergency.title}</h3>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">{emergency.location}</p>
                                            </div>
                                            <span className={`${getSeverityColor(emergency.severity)} text-xs px-2 py-1 rounded-full uppercase font-medium`}>
                                                {emergency.severity}
                                            </span>
                                        </div>

                                        <div className="p-4">
                                            <div className="mb-3">
                                                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                                                <p className="text-sm text-gray-900">{emergency.description}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Reported By</h4>
                                                    <p className="text-sm text-gray-900">{emergency.reportedBy}</p>
                                                    <p className="text-xs text-gray-500">{emergency.department}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Time Reported</h4>
                                                    <p className="text-sm text-gray-900">{formatDateTime(emergency.createdAt)}</p>
                                                </div>
                                            </div>

                                            {emergency.affectedAreas && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Affected Areas/Services</h4>
                                                    <p className="text-sm text-gray-900">{emergency.affectedAreas}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Clock size={14} className="mr-1" />
                                                Resolved at: {formatDateTime(emergency.resolvedAt)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500 mb-4">No resolved emergencies match your filters.</p>
                                {(searchTerm || dateRange.from || dateRange.to || emergencyType !== 'all') && (
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

            {/* Render Create Emergency Modal */}
            {renderCreateEmergencyModal()}
        </div>
    );
}