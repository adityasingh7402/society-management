import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    User, Clock, Calendar, MessageSquare, Shield, Check, X,
    Search, Filter, ChevronDown, ChevronUp, Eye, Phone,
    ArrowLeft, Loader, Home, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';

const VisitorEntry = () => {
    const router = useRouter();
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [residentDetails, setResidentDetails] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupType, setPopupType] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [expandedVisitor, setExpandedVisitor] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch resident details on component mount
    useEffect(() => {
        const fetchResidentProfile = async () => {
            try {
                const token = localStorage.getItem("Resident");
                if (!token) {
                    router.push("/Login");
                    return;
                }

                const response = await fetch("/api/Resident-Api/get-resident-details", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch resident profile");
                }

                const data = await response.json();
                setResidentDetails(data);

                // After getting resident details, fetch visitors
                fetchVisitors(data);
            } catch (error) {
                console.error("Error fetching resident profile:", error);
                setError("Failed to load your profile. Please login again.");
                router.push("/Login");
            }
        };

        fetchResidentProfile();
    }, [router]);

    // Fetch visitors based on resident flat details
    const fetchVisitors = async (resident) => {
        if (!resident || !resident.flatDetails) return;

        setLoading(true);
        try {
            // Extract flat details
            const { societyId } = resident;
            const { blockName, flatNumber } = resident.flatDetails;
            const floorNumber = resident.flatDetails.floorIndex + 1; // Adjust floor index as needed

            // Fetch visitors for this resident's flat
            const response = await fetch(`/api/VisitorApi/Get-All-Visitors?societyId=${societyId}&blockName=${blockName}&floorNumber=${floorNumber}&flatNumber=${flatNumber}`);

            if (!response.ok) {
                throw new Error('Failed to fetch visitors');
            }

            const data = await response.json();
            setVisitors(data.data || []);
        } catch (error) {
            console.error('Error fetching visitors:', error);
            setError('Failed to load visitor data');
            showNotification('Error loading visitor data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle visitor approval/rejection
    const handleVisitorAction = async (visitorId, action) => {
        setProcessingId(visitorId);
        try {
            const response = await fetch('/api/VisitorApi/update-visitor-status', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    visitorId,
                    status: action,
                    updatedBy: residentDetails._id
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update visitor status');
            }

            // Update local state with the new status
            setVisitors(prev =>
                prev.map(visitor =>
                    visitor._id === visitorId
                        ? { ...visitor, status: action, statusUpdatedAt: new Date().toISOString() }
                        : visitor
                )
            );

            showNotification(`Visitor ${action === 'approve' ? 'approve' : 'reject'} successfully`, 'success');
        } catch (error) {
            console.error('Error updating visitor status:', error);
            showNotification(error.message, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    // Show notification popup
    const showNotification = (message, type) => {
        setPopupMessage(message);
        setPopupType(type);
        setShowPopup(true);

        // Auto hide after 3 seconds
        setTimeout(() => {
            setShowPopup(false);
        }, 3000);
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter visitors based on status and search query
    const filteredVisitors = visitors.filter(visitor => {
        // Filter by status
        if (filterStatus !== 'all' && visitor.status !== filterStatus) return false;

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                visitor.visitorName?.toLowerCase().includes(query) ||
                visitor.visitorReason?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    // Toggle visitor details expansion (mobile view only)
    const toggleExpand = (id) => {
        setExpandedVisitor(expandedVisitor === id ? null : id);
    };

    // Helper function to get status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case 'approve':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approved
                </span>;
            case 'reject':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Rejected
                </span>;
            case 'pending':
            default:
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                </span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Header */}
            <div className="mb-6">
                <button onClick={() => router.back()} className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
                    <ArrowLeft size={18} className="mr-1" />
                    <span>Back</span>
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Visitor Approval</h1>
                <p className="text-gray-600 mt-1">Manage visitor requests for your apartment</p>
            </div>

            {/* Notification Popup */}
            {showPopup && (
                <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-xs animate-pulse ${popupType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    <div className="flex items-center">
                        <span className="mr-2 flex-shrink-0">
                            {popupType === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                        </span>
                        <p className="text-sm">{popupMessage}</p>
                        <button
                            onClick={() => setShowPopup(false)}
                            className="ml-auto text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 flex-shrink-0"
                            aria-label="Close notification"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Resident Info Card */}
            {residentDetails && residentDetails.flatDetails && (
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border-l-4 border-blue-500">
                    <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Home size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-medium text-lg">{residentDetails.name}</h2>
                            <p className="text-gray-600 text-sm capitalize">
                                {residentDetails.flatDetails.structureType} {residentDetails.flatDetails.blockName},
                                Floor {residentDetails.flatDetails.floorIndex},
                                Flat {residentDetails.flatDetails.flatNumber}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filter Controls */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search visitors..."
                            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center mr-2">
                            <Filter size={16} className="text-gray-500 mr-1" />
                            <span className="text-gray-700 text-sm font-medium">Status:</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFilterStatus('all')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${filterStatus === 'all'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilterStatus('pending')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${filterStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setFilterStatus('approve')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${filterStatus === 'approve'
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Approved
                            </button>
                            <button
                                onClick={() => setFilterStatus('reject')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${filterStatus === 'reject'
                                    ? 'bg-red-100 text-red-800 border border-red-300'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Rejected
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Visitor Cards (Mobile View) & Table (Desktop View) */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 flex flex-col items-center justify-center">
                        <Loader className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-600">Loading visitor data...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 flex flex-col items-center justify-center text-red-500">
                        <AlertCircle className="w-10 h-10 mb-4" />
                        <p>{error}</p>
                    </div>
                ) : filteredVisitors.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <User size={32} className="text-gray-400" />
                        </div>
                        <p className="text-lg mb-1">No visitors found</p>
                        <p className="text-sm text-gray-500">
                            {filterStatus === 'all' && !searchQuery
                                ? "You don't have any visitor records yet"
                                : `No visitors match your current filters`}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile View - Card Layout with Expand/Collapse */}
                        <div className="md:hidden">
                            <div className="p-4 space-y-4">
                                {filteredVisitors.map((visitor) => (
                                    <div key={visitor._id} className="border rounded-lg overflow-hidden bg-white">
                                        <div className="p-4 border-b">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                        {visitor.visitorImage ? (
                                                            <img
                                                                src={visitor.visitorImage}
                                                                alt={visitor.visitorName}
                                                                className="h-10 w-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="h-5 w-5 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {visitor.visitorName}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{formatDate(visitor.entryTime)}</div>
                                                    </div>
                                                </div>
                                                <div>{getStatusBadge(visitor.status)}</div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="text-sm font-medium text-gray-700">Purpose:</div>
                                                <div className="text-sm text-gray-900">{visitor.visitorReason || 'Not specified'}</div>
                                            </div>

                                            {/* Mobile-only expand button */}
                                            <button
                                                onClick={() => toggleExpand(visitor._id)}
                                                className="w-full mt-2 flex items-center justify-center p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                            >
                                                {expandedVisitor === visitor._id ? (
                                                    <>
                                                        <ChevronUp size={16} className="mr-1" />
                                                        Hide details
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown size={16} className="mr-1" />
                                                        Show details
                                                    </>
                                                )}
                                            </button>

                                            {expandedVisitor === visitor._id && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                                                <Calendar size={14} className="mr-1 text-gray-500" />
                                                                Visit Details
                                                            </h4>
                                                            <ul className="space-y-2 text-sm">
                                                                <li className="flex justify-between">
                                                                    <span className="text-gray-600">Entry Time:</span>
                                                                    <span>{formatDate(visitor.entryTime)}</span>
                                                                </li>
                                                                {visitor.exitTime && (
                                                                    <li className="flex justify-between">
                                                                        <span className="text-gray-600">Exit Time:</span>
                                                                        <span>{formatDate(visitor.exitTime)}</span>
                                                                    </li>
                                                                )}
                                                                <li className="flex justify-between">
                                                                    <span className="text-gray-600">Created By:</span>
                                                                    <span>{visitor.securityName || 'Security Staff'}</span>
                                                                </li>
                                                                {visitor.status !== 'pending' && (
                                                                    <li className="flex justify-between">
                                                                        <span className="text-gray-600">Status Updated:</span>
                                                                        <span>{formatDate(visitor.updatedAt)}</span>
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        </div>

                                                        {/* Added Guard Information */}
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                                                <Shield size={14} className="mr-1 text-gray-500" />
                                                                Guard Information
                                                            </h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                                                                        {visitor.guardImage ? (
                                                                            <img
                                                                                src={visitor.guardImage}
                                                                                alt={visitor.guardName}
                                                                                className="h-8 w-8 rounded-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <Shield size={14} className="text-gray-500" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium">{visitor.guardName || 'Not assigned'}</div>
                                                                        {visitor.guardPhone && (
                                                                            <div className="text-xs text-gray-500 flex items-center">
                                                                                <Phone size={12} className="mr-1" />
                                                                                {visitor.guardPhone}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {visitor.status === 'pending' && (
                                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <button
                                                                        onClick={() => handleVisitorAction(visitor._id, 'approve')}
                                                                        disabled={processingId === visitor._id}
                                                                        className={`py-2 rounded-md text-sm font-medium text-white ${processingId === visitor._id ?
                                                                            'bg-gray-400' :
                                                                            'bg-green-600 hover:bg-green-700'
                                                                            }`}
                                                                    >
                                                                        {processingId === visitor._id ?
                                                                            <span className="flex items-center justify-center">
                                                                                <Loader size={16} className="animate-spin mr-1" />
                                                                                Processing
                                                                            </span> :
                                                                            <span className="flex items-center justify-center">
                                                                                <Check size={16} className="mr-1" />
                                                                                Approve
                                                                            </span>
                                                                        }
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleVisitorAction(visitor._id, 'reject')}
                                                                        disabled={processingId === visitor._id}
                                                                        className={`py-2 rounded-md text-sm font-medium text-white ${processingId === visitor._id ?
                                                                            'bg-gray-400' :
                                                                            'bg-red-600 hover:bg-red-700'
                                                                            }`}
                                                                    >
                                                                        <span className="flex items-center justify-center">
                                                                            <X size={16} className="mr-1" />
                                                                            Reject
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Desktop View - Table Layout with Always-Visible Details */}
                        <div className="hidden md:block overflow-x-auto">
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
                                            Time
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Guard
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredVisitors.map((visitor) => (
                                        <React.Fragment key={visitor._id}>
                                            <tr className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                            {visitor.visitorImage ? (
                                                                <img
                                                                    src={visitor.visitorImage}
                                                                    alt={visitor.visitorName}
                                                                    className="h-10 w-10 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <User className="h-5 w-5 text-gray-500" />
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {visitor.visitorName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{visitor.visitorReason || 'Not specified'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{formatDate(visitor.entryTime)}</div>
                                                </td>
                                                {/* Added Guard column */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                            {visitor.guardImage ? (
                                                                <img
                                                                    src={visitor.guardImage}
                                                                    alt={visitor.guardName}
                                                                    className="h-8 w-8 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <Shield size={14} className="text-gray-500" />
                                                            )}
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {visitor.guardName || 'Not assigned'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(visitor.status)}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <div className="flex space-x-3">
                                                        {/* Desktop view - only action buttons, no expand/collapse */}
                                                        {visitor.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleVisitorAction(visitor._id, 'approve')}
                                                                    disabled={processingId === visitor._id}
                                                                    className="flex items-center text-green-600 hover:text-green-900 disabled:opacity-50 transition-colors"
                                                                >
                                                                    {processingId === visitor._id ?
                                                                        <Loader size={16} className="animate-spin" /> :
                                                                        <>
                                                                            <Check size={16} className="mr-1" />
                                                                            <span>Approve</span>
                                                                        </>
                                                                    }
                                                                </button>
                                                                <button
                                                                    onClick={() => handleVisitorAction(visitor._id, 'reject')}
                                                                    disabled={processingId === visitor._id}
                                                                    className="flex items-center text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"
                                                                >
                                                                    <X size={16} className="mr-1" />
                                                                    <span>Reject</span>
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* View button with Eye icon */}
                                                        <button
                                                            onClick={() => toggleExpand(visitor._id)}
                                                            className="flex items-center text-blue-600 hover:text-blue-900 transition-colors"
                                                        >
                                                            <Eye size={16} className="mr-1" />
                                                            <span>Details</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Always display additional details row when clicked in desktop */}
                                            {expandedVisitor === visitor._id && (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-4 bg-gray-50">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div>
                                                                <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                                                    <Calendar size={16} className="mr-1 text-gray-500" />
                                                                    Visit Details
                                                                </h4>
                                                                <ul className="space-y-2 text-sm">
                                                                    <li className="flex items-start">
                                                                        <span className="font-medium w-24 text-gray-600">Entry Time:</span>
                                                                        <span>{formatDate(visitor.entryTime)}</span>
                                                                    </li>
                                                                    {visitor.exitTime && (
                                                                        <li className="flex items-start">
                                                                            <span className="font-medium w-24 text-gray-600">Exit Time:</span>
                                                                            <span>{formatDate(visitor.exitTime)}</span>
                                                                        </li>
                                                                    )}
                                                                    <li className="flex items-start">
                                                                        <span className="font-medium w-24 text-gray-600">Created By:</span>
                                                                        <span>{visitor.securityName || 'Security Staff'}</span>
                                                                    </li>
                                                                    {visitor.status !== 'pending' && (
                                                                        <li className="flex items-start">
                                                                            <span className="font-medium w-24 text-gray-600">Status Updated:</span>
                                                                            <span>{formatDate(visitor.statusUpdatedAt)}</span>
                                                                        </li>
                                                                    )}
                                                                </ul>
                                                            </div>

                                                            {/* Added Guard Information Section */}
                                                            <div>
                                                                <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                                                    <Shield size={16} className="mr-1 text-gray-500" />
                                                                    Guard Information
                                                                </h4>
                                                                <ul className="space-y-2 text-sm">
                                                                    <li className="flex items-start">
                                                                        <span className="font-medium w-24 text-gray-600">Name:</span>
                                                                        <span>{visitor.guardName || 'Not assigned'}</span>
                                                                    </li>
                                                                    <li className="flex items-start">
                                                                        <span className="font-medium w-24 text-gray-600">Phone:</span>
                                                                        <span>
                                                                            {visitor.guardPhone ? (
                                                                                <a href={`tel:${visitor.guardPhone}`} className="text-blue-600 hover:text-blue-800">
                                                                                    {visitor.guardPhone}
                                                                                </a>
                                                                            ) : (
                                                                                'Not available'
                                                                            )}
                                                                        </span>
                                                                    </li>
                                                                </ul>
                                                            </div>

                                                            <div>
                                                                {visitor.status === 'pending' && (
                                                                    <div className="mt-4">
                                                                        <h5 className="text-sm font-medium text-gray-700 mb-2">Actions:</h5>
                                                                        <div className="flex space-x-2">
                                                                            <button
                                                                                onClick={() => handleVisitorAction(visitor._id, 'approve')}
                                                                                disabled={processingId === visitor._id}
                                                                                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${processingId === visitor._id ?
                                                                                    'bg-gray-400' :
                                                                                    'bg-green-600 hover:bg-green-700'
                                                                                    } transition-colors`}
                                                                            >
                                                                                {processingId === visitor._id ?
                                                                                    <span className="flex items-center">
                                                                                        <Loader size={16} className="animate-spin mr-2" />
                                                                                        Processing...
                                                                                    </span> :
                                                                                    <span className="flex items-center">
                                                                                        <Check size={16} className="mr-1" />
                                                                                        Approve
                                                                                    </span>
                                                                                }
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleVisitorAction(visitor._id, 'reject')}
                                                                                disabled={processingId === visitor._id}
                                                                                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${processingId === visitor._id ?
                                                                                    'bg-gray-400' :
                                                                                    'bg-red-600 hover:bg-red-700'
                                                                                    } transition-colors`}
                                                                            >
                                                                                <span className="flex items-center">
                                                                                    <X size={16} className="mr-1" />
                                                                                    Reject
                                                                                </span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VisitorEntry;