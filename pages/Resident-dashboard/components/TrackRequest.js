import React, { useState } from 'react';
import { ArrowLeft } from "lucide-react";
import { useRouter } from 'next/router';
import { Clock, CheckCircle, AlertTriangle, Wrench, Calendar, Phone, Mail, FileText, Filter, Search, ChevronRight, ChevronDown } from 'lucide-react';

export default function TrackRequest() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [expandedRequestId, setExpandedRequestId] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Sample maintenance request data
    const [maintenanceRequests, setMaintenanceRequests] = useState([
        {
            id: "MNT-2584",
            title: "Bathroom Sink Leakage",
            type: "Plumbing",
            priority: "High",
            description: "The sink in the main bathroom has been leaking for two days. Water is collecting underneath the cabinet.",
            preferredDate: "2025-03-25",
            preferredTime: "Morning (9AM-12PM)",
            contactPhone: "+91 98765 43210",
            contactEmail: "user@example.com",
            images: ["/api/placeholder/400/300"],
            dateSubmitted: "2025-03-18",
            status: "In Progress",
            updates: [
                { date: "2025-03-18", note: "Request received", status: "Pending" },
                { date: "2025-03-19", note: "Assigned to plumber Rahul Singh", status: "In Progress" }
            ],
            scheduledDate: "2025-03-25",
            scheduledTime: "10:00 AM",
            assignedTo: "Rahul Singh"
        },
        {
            id: "MNT-2571",
            title: "Living Room Wall Painting",
            type: "Painting",
            priority: "Medium",
            description: "Need to repaint the living room walls. Current paint is peeling in several places.",
            preferredDate: "2025-04-02",
            preferredTime: "Afternoon (12PM-3PM)",
            contactPhone: "+91 98765 43210",
            contactEmail: "user@example.com",
            images: ["/api/placeholder/400/300", "/api/placeholder/400/300"],
            dateSubmitted: "2025-03-15",
            status: "Scheduled",
            updates: [
                { date: "2025-03-15", note: "Request received", status: "Pending" },
                { date: "2025-03-16", note: "Request under review", status: "Pending" },
                { date: "2025-03-17", note: "Scheduled for April 2nd", status: "Scheduled" }
            ],
            scheduledDate: "2025-04-02",
            scheduledTime: "1:00 PM",
            assignedTo: "Painting Team A"
        },
        {
            id: "MNT-2532",
            title: "Kitchen Light Fixture Replacement",
            type: "Electrical",
            priority: "Medium",
            description: "The main light fixture in the kitchen has stopped working completely. Need replacement.",
            preferredDate: "2025-03-20",
            preferredTime: "Evening (3PM-6PM)",
            contactPhone: "+91 98765 43210",
            contactEmail: "user@example.com",
            images: ["/api/placeholder/400/300"],
            dateSubmitted: "2025-03-12",
            status: "Completed",
            updates: [
                { date: "2025-03-12", note: "Request received", status: "Pending" },
                { date: "2025-03-13", note: "Assigned to electrician Amit Kumar", status: "In Progress" },
                { date: "2025-03-14", note: "Parts ordered", status: "In Progress" },
                { date: "2025-03-19", note: "Repair completed and tested", status: "Completed" }
            ],
            scheduledDate: "2025-03-19",
            scheduledTime: "4:00 PM",
            assignedTo: "Amit Kumar",
            completionDate: "2025-03-19",
            completionNote: "Replaced the light fixture and tested. Working properly now."
        },
        {
            id: "MNT-2510",
            title: "Balcony Floor Tile Repair",
            type: "Flooring",
            priority: "Low",
            description: "Several tiles on the balcony floor are cracked and need replacement.",
            preferredDate: "2025-03-30",
            preferredTime: "Morning (9AM-12PM)",
            contactPhone: "+91 98765 43210",
            contactEmail: "user@example.com",
            images: ["/api/placeholder/400/300"],
            dateSubmitted: "2025-03-10",
            status: "Rejected",
            updates: [
                { date: "2025-03-10", note: "Request received", status: "Pending" },
                { date: "2025-03-11", note: "Inspected by maintenance staff", status: "Pending" },
                { date: "2025-03-12", note: "Request rejected - not covered under current maintenance contract", status: "Rejected" }
            ],
            rejectionReason: "The damage appears to be caused by tenant misuse which is not covered under the standard maintenance contract."
        },
        {
            id: "MNT-2499",
            title: "AC Unit Service",
            type: "Appliance",
            priority: "Medium",
            description: "The AC unit in the master bedroom needs servicing. It's making unusual noises and not cooling properly.",
            preferredDate: "2025-03-22",
            preferredTime: "Afternoon (12PM-3PM)",
            contactPhone: "+91 98765 43210",
            contactEmail: "user@example.com",
            images: ["/api/placeholder/400/300"],
            dateSubmitted: "2025-03-08",
            status: "Pending",
            updates: [
                { date: "2025-03-08", note: "Request received", status: "Pending" }
            ]
        }
    ]);

    // Status badge component
    const StatusBadge = ({ status }) => {
        let bgColor, textColor, iconComponent;

        switch (status) {
            case 'Pending':
                bgColor = 'bg-yellow-100';
                textColor = 'text-yellow-800';
                iconComponent = Clock ? <Clock size={14} className="mr-1" /> : null;
                break;
            case 'In Progress':
                bgColor = 'bg-blue-100';
                textColor = 'text-blue-800';
                iconComponent = Wrench ? <Wrench size={14} className="mr-1" /> : null;
                break;
            case 'Scheduled':
                bgColor = 'bg-purple-100';
                textColor = 'text-purple-800';
                iconComponent = Calendar ? <Calendar size={14} className="mr-1" /> : null;
                break;
            case 'Completed':
                bgColor = 'bg-green-100';
                textColor = 'text-green-800';
                iconComponent = CheckCircle ? <CheckCircle size={14} className="mr-1" /> : null;
                break;
            case 'Rejected':
                bgColor = 'bg-red-100';
                textColor = 'text-red-800';
                iconComponent = AlertTriangle ? <AlertTriangle size={14} className="mr-1" /> : null;
                break;
            default:
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-800';
                iconComponent = Clock ? <Clock size={14} className="mr-1" /> : null;
        }

        return (
            <span className={`flex items-center ${bgColor} ${textColor} text-xs px-2 py-1 rounded-full`}>
                {iconComponent}
                {status}
            </span>
        );
    };

    // Filter requests based on search and filters
    const filteredRequests = maintenanceRequests
        .filter(request => {
            // Apply search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    request.id.toLowerCase().includes(query) ||
                    request.title.toLowerCase().includes(query) ||
                    request.description.toLowerCase().includes(query)
                );
            }
            return true;
        })
        .filter(request => {
            // Apply status filter
            if (filterStatus !== 'All') {
                return request.status === filterStatus;
            }
            return true;
        })
        .filter(request => {
            // Apply type filter
            if (filterType !== 'All') {
                return request.type === filterType;
            }
            return true;
        });

    // Get unique request types for filter dropdown
    const requestTypes = ['All', ...new Set(maintenanceRequests.map(req => req.type))];

    // Handle clicking on a request
    const toggleRequestDetails = (requestId) => {
        if (expandedRequestId === requestId) {
            setExpandedRequestId(null);
        } else {
            setExpandedRequestId(requestId);
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
            <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4 md:mb-8 text-center">Track Maintenance Requests</h1>

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
                                    placeholder="Search by ticket number or title..."
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
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                                <select
                                    className="p-2 border border-gray-300 rounded-md text-gray-700"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    {requestTypes.map(type => (
                                        <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Requests List */}
                    {filteredRequests.length > 0 ? (
                        <div>
                            {filteredRequests.map(request => (
                                <div key={request.id} className="border-b border-gray-200 last:border-b-0">
                                    {/* Request Summary Row */}
                                    <div
                                        className="p-4 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => toggleRequestDetails(request.id)}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <div className="flex flex-col">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-gray-900">{request.title}</span>
                                                    <span className="text-sm text-gray-500">{request.id}</span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                                                    <span>{request.type}</span>
                                                    <span>•</span>
                                                    <span>Submitted: {request.dateSubmitted}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <StatusBadge status={request.status} />
                                                {expandedRequestId === request.id ?
                                                    <ChevronDown size={20} className="text-gray-400" /> :
                                                    <ChevronRight size={20} className="text-gray-400" />
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Request Details */}
                                    {expandedRequestId === request.id && (
                                        <div className="px-4 pb-6 bg-gray-50 border-t border-gray-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                                {/* Request Details */}
                                                <div>
                                                    <h3 className="font-medium text-lg text-gray-900 mb-3">Request Details</h3>
                                                    <div className="space-y-2">
                                                        <p className="text-sm"><span className="font-medium">Type:</span> {request.type}</p>
                                                        <p className="text-sm"><span className="font-medium">Priority:</span> {request.priority}</p>
                                                        <p className="text-sm"><span className="font-medium">Description:</span> {request.description}</p>
                                                        <div className="pt-2">
                                                            <p className="text-sm font-medium mb-1">Contact Information:</p>
                                                            <div className="flex items-center text-sm text-gray-600">
                                                                <Phone size={14} className="mr-1" />
                                                                <span>{request.contactPhone}</span>
                                                            </div>
                                                            <div className="flex items-center text-sm text-gray-600">
                                                                <Mail size={14} className="mr-1" />
                                                                <span>{request.contactEmail}</span>
                                                            </div>
                                                        </div>
                                                        <div className="pt-2">
                                                            <p className="text-sm font-medium mb-1">Preferred Schedule:</p>
                                                            <p className="text-sm">{request.preferredDate} - {request.preferredTime}</p>
                                                        </div>
                                                    </div>

                                                    {/* Images */}
                                                    {request.images && request.images.length > 0 && (
                                                        <div className="mt-4">
                                                            <p className="text-sm font-medium mb-2">Uploaded Images:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {request.images.map((img, index) => (
                                                                    <img
                                                                        key={index}
                                                                        src={img}
                                                                        alt={`Request ${request.id} - Image ${index + 1}`}
                                                                        className="h-24 w-24 object-cover rounded-md border border-gray-200"
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Status Updates */}
                                                <div>
                                                    <h3 className="font-medium text-lg text-gray-900 mb-3">Status Updates</h3>

                                                    {/* Current Status */}
                                                    <div className="mb-4">
                                                        <div className="flex items-center space-x-2">
                                                            <StatusBadge status={request.status} />
                                                            <span className="text-sm font-medium text-gray-700">Current Status</span>
                                                        </div>

                                                        {request.status === 'Scheduled' && (
                                                            <div className="mt-2 bg-purple-50 p-3 rounded-md">
                                                                <p className="text-sm font-medium text-purple-800">Scheduled for service</p>
                                                                <p className="text-sm text-gray-700">
                                                                    Date: {request.scheduledDate} at {request.scheduledTime}
                                                                </p>
                                                                {request.assignedTo && (
                                                                    <p className="text-sm text-gray-700">
                                                                        Assigned to: {request.assignedTo}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {request.status === 'In Progress' && (
                                                            <div className="mt-2 bg-blue-50 p-3 rounded-md">
                                                                <p className="text-sm font-medium text-blue-800">Work in progress</p>
                                                                {request.assignedTo && (
                                                                    <p className="text-sm text-gray-700">
                                                                        Assigned to: {request.assignedTo}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {request.status === 'Completed' && (
                                                            <div className="mt-2 bg-green-50 p-3 rounded-md">
                                                                <p className="text-sm font-medium text-green-800">Work completed</p>
                                                                <p className="text-sm text-gray-700">
                                                                    Completed on: {request.completionDate}
                                                                </p>
                                                                {request.completionNote && (
                                                                    <p className="text-sm text-gray-700 mt-1">
                                                                        Note: {request.completionNote}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {request.status === 'Rejected' && (
                                                            <div className="mt-2 bg-red-50 p-3 rounded-md">
                                                                <p className="text-sm font-medium text-red-800">Request rejected</p>
                                                                {request.rejectionReason && (
                                                                    <p className="text-sm text-gray-700 mt-1">
                                                                        Reason: {request.rejectionReason}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Timeline */}
                                                    <div className="relative pl-6 space-y-6 before:absolute before:left-0 before:ml-2.5 before:h-full before:w-0.5 before:bg-gray-200">
                                                        {request.updates && request.updates.map((update, index) => (
                                                            <div key={index} className="relative -ml-6 pl-6 pb-1">
                                                                <div className="absolute left-0 mt-1.5 h-5 w-5 rounded-full border-2 border-white bg-gray-300"></div>
                                                                <div className="flex flex-col space-y-1">
                                                                    <p className="text-sm font-medium text-gray-900">{update.date}</p>
                                                                    <p className="text-sm text-gray-600">{update.note}</p>
                                                                    {update.status && (
                                                                        <div className="mt-1">
                                                                            <StatusBadge status={update.status} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
                            <p className="text-gray-500">
                                {searchQuery || filterStatus !== 'All' || filterType !== 'All' ?
                                    'Try adjusting your search or filters' :
                                    'You have not submitted any maintenance requests yet'}
                            </p>
                            <button
                                onClick={() => router.push('/maintenance-request')}
                                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                Submit New Request
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}