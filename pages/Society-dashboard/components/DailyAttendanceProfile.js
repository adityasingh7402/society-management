import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';
import { usePermissions } from "../../../components/PermissionsContext";
import AccessDenied from "../widget/societyComponents/accessRestricted";

import {
    Users,
    Clock,
    LogOut,
    Search,
    Filter,
    Calendar,
    AlertCircle,
    CheckCircle2,
    XCircle,
    User,
    Phone,
    Home,
    Building2,
    Timer,
    AlertTriangle
} from 'lucide-react';

export default function DailyAttendanceProfile() {
    const permissions = usePermissions();
        console.log(permissions)
    if (!permissions.includes("manage_security") && !permissions.includes("full_access")) {
        return <AccessDenied />;
    }

    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState({
        totalVisitors: 0,
        currentVisitors: 0,
        totalExited: 0,
        overstayedVisitors: 0
    });

    // Filter states
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [visitorTypeFilter, setVisitorTypeFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const router = useRouter();

    // Fetch attendance records
    useEffect(() => {
        const fetchAttendanceRecords = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('Society');
                if (!token) {
                    router.push('/societyLogin');
                    return;
                }

                const societyResponse = await fetch('/api/Society-Api/get-society-details', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!societyResponse.ok) {
                    throw new Error('Failed to fetch society details');
                }

                const societyData = await societyResponse.json();
                const societyId = societyData._id;

                // Build query parameters
                const queryParams = new URLSearchParams({
                    societyId,
                    date: selectedDate,
                    page: currentPage,
                    limit: 10
                });

                if (statusFilter !== 'all') queryParams.append('status', statusFilter);
                if (visitorTypeFilter !== 'all') queryParams.append('visitorType', visitorTypeFilter);
                if (searchTerm) queryParams.append('searchTerm', searchTerm);

                const response = await fetch(`/api/DailyAttendance-Api/get-attendance?${queryParams}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch attendance records');
                }

                const data = await response.json();
                setAttendanceRecords(data.records);
                setSummary(data.summary.dailySummary);
                setTotalPages(data.summary.totalPages);
                setError('');
            } catch (error) {
                console.error('Error fetching attendance records:', error);
                setError('An error occurred while fetching attendance records');
                setAttendanceRecords([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendanceRecords();
    }, [selectedDate, statusFilter, visitorTypeFilter, searchTerm, currentPage]);

    // Handle visitor exit
    const handleVisitorExit = async (visitorId) => {
        try {
            const token = localStorage.getItem('Society');
            if (!token) {
                router.push('/societyLogin');
                return;
            }

            const societyResponse = await fetch('/api/Society-Api/get-society-details', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!societyResponse.ok) {
                throw new Error('Failed to fetch society details');
            }

            const societyData = await societyResponse.json();
            const societyId = societyData._id;

            const response = await fetch('/api/DailyAttendance-Api/update-exit', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    societyId,
                    visitorId,
                    actualExitTime: new Date()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update visitor exit');
            }

            // Refresh the records
            setCurrentPage(1);
            setError('');
        } catch (error) {
            console.error('Error updating visitor exit:', error);
            setError('Failed to update visitor exit');
        }
    };

    // Format time function
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Inside': return 'bg-green-100 text-green-800';
            case 'Left': return 'bg-gray-100 text-gray-800';
            case 'Overstayed': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        loading ? <PreloaderSociety /> : (
            <div className="min-h-screen bg-gray-100">
                <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                                <Users className="mr-3" size={32} />
                                Daily Attendance
                            </h1>
                        </div>
                    </div>
                </header>

                <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 p-4 md:p-8">
                    <div className="container mx-auto">
                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <XCircle className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                                <div className="flex items-center">
                                    <Users className="h-8 w-8 text-blue-500" />
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Total Visitors</p>
                                        <p className="text-2xl font-bold text-gray-800">{summary.totalVisitors}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                                <div className="flex items-center">
                                    <User className="h-8 w-8 text-green-500" />
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Current Visitors</p>
                                        <p className="text-2xl font-bold text-gray-800">{summary.currentVisitors}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-500">
                                <div className="flex items-center">
                                    <LogOut className="h-8 w-8 text-gray-500" />
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Total Exited</p>
                                        <p className="text-2xl font-bold text-gray-800">{summary.totalExited}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
                                <div className="flex items-center">
                                    <AlertTriangle className="h-8 w-8 text-red-500" />
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600">Overstayed</p>
                                        <p className="text-2xl font-bold text-gray-800">{summary.overstayedVisitors}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white shadow-md rounded-lg p-5 mb-6 border border-blue-100">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Date Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                        <Calendar className="mr-2 text-blue-500" size={18} />
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                        <Filter className="mr-2 text-blue-500" size={18} />
                                        Status
                                    </label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="Inside">Inside</option>
                                        <option value="Left">Left</option>
                                        <option value="Overstayed">Overstayed</option>
                                    </select>
                                </div>

                                {/* Visitor Type Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                        <Users className="mr-2 text-blue-500" size={18} />
                                        Visitor Type
                                    </label>
                                    <select
                                        value={visitorTypeFilter}
                                        onChange={(e) => setVisitorTypeFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="GateVisitor">Gate Visitor</option>
                                        <option value="VehicleTag">Vehicle Tag</option>
                                        <option value="AnimalTag">Animal Tag</option>
                                        <option value="GatePass">Gate Pass</option>
                                        <option value="ServicePersonnel">Service Personnel</option>
                                    </select>
                                </div>

                                {/* Search */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                        <Search className="mr-2 text-blue-500" size={18} />
                                        Search
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Search by name, phone, or flat"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Attendance Records Table */}
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-blue-100">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-blue-600 text-white">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                                <User className="inline mr-2" size={16} /> Visitor
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                                <Home className="inline mr-2" size={16} /> Resident Details
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                                <Clock className="inline mr-2" size={16} /> Timings
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                                <AlertCircle className="inline mr-2" size={16} /> Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {attendanceRecords.map((record) => (
                                            record.visitors.map((visitor) => (
                                                <tr key={visitor._id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {visitor.visitorName}
                                                                </div>
                                                                <div className="text-sm text-gray-500 flex items-center">
                                                                    <Phone className="mr-1" size={14} />
                                                                    {visitor.visitorPhone}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {visitor.purpose}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm text-gray-900">
                                                            {visitor.residentDetails.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Block {visitor.residentDetails.blockNumber},
                                                            Floor {visitor.residentDetails.floorNumber},
                                                            Flat {visitor.residentDetails.flatNumber}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm text-gray-900">
                                                            <div className="flex items-center text-green-600">
                                                                <Clock className="mr-1" size={14} />
                                                                Entry: {formatTime(visitor.entryTime)}
                                                            </div>
                                                            {visitor.actualExitTime && (
                                                                <div className="flex items-center text-red-600 mt-1">
                                                                    <LogOut className="mr-1" size={14} />
                                                                    Exit: {formatTime(visitor.actualExitTime)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(visitor.status)}`}>
                                                            {visitor.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm">
                                                        {visitor.status === 'Inside' && (
                                                            <button
                                                                onClick={() => handleVisitorExit(visitor._id)}
                                                                className="text-blue-600 hover:text-blue-900 flex items-center"
                                                            >
                                                                <LogOut className="mr-1" size={14} />
                                                                Mark Exit
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                            <span className="font-medium">{totalPages}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    );
}