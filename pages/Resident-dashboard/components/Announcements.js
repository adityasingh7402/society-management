import React, { useState, useEffect } from 'react';
import { ArrowLeft } from "lucide-react";
import { useRouter } from 'next/router';
import { Calendar, Clock, Search, Filter, Bell, ChevronRight, ChevronDown } from 'lucide-react';

export default function Announcements() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [expandedAnnouncementId, setExpandedAnnouncementId] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [isClient, setIsClient] = useState(false);

    // Use useEffect to mark when component is client-side
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Sample announcements data
    const [announcements, setAnnouncements] = useState([
        {
            id: "ANN-2023",
            title: "Annual Building Maintenance Schedule",
            category: "Maintenance",
            date: "2025-03-15",
            summary: "Schedule for upcoming annual maintenance work throughout the building.",
            content: "Dear Residents,\n\nWe are pleased to share the annual building maintenance schedule for 2025. The maintenance team will be conducting essential repairs and routine checks in all apartment blocks as follows:\n\n- Block A: April 5-10, 2025\n- Block B: April 12-17, 2025\n- Block C: April 19-24, 2025\n\nDuring this period, you may experience brief interruptions to water and electricity supply. We will notify you 24 hours before any such interruption.\n\nThank you for your cooperation.\n\nBest regards,\nThe Management Team",
            importance: "High"
        },
        {
            id: "ANN-2022",
            title: "Community Diwali Celebration",
            category: "Event",
            date: "2025-03-12",
            summary: "Join us for the community Diwali celebration in the central courtyard.",
            content: "Dear Residents,\n\nWe cordially invite you to join our community Diwali celebration!\n\nDate: November 10, 2025\nTime: 6:00 PM - 10:00 PM\nVenue: Central Courtyard\n\nActivities include:\n- Lamp lighting ceremony\n- Cultural performances\n- Communal dinner\n- Fireworks display (8:30 PM)\n\nPlease RSVP by November 5 through the resident portal or at the management office.\n\nWe look forward to celebrating with you!\n\nWarm regards,\nThe Event Committee",
            importance: "Medium"
        },
        {
            id: "ANN-2021",
            title: "Water Supply Interruption Notice",
            category: "Utility",
            date: "2025-03-10",
            summary: "Scheduled water supply interruption for maintenance work.",
            content: "Dear Residents,\n\nThis is to inform you that there will be a scheduled interruption to the water supply due to essential maintenance work on the main water lines.\n\nDate: March 25, 2025\nTime: 10:00 AM - 2:00 PM\nAffected Areas: All apartment blocks\n\nWe recommend storing sufficient water for your needs during this period. The maintenance team will work to restore the supply as quickly as possible.\n\nWe apologize for any inconvenience caused.\n\nRegards,\nBuilding Management",
            importance: "High"
        },
        {
            id: "ANN-2020",
            title: "New Security Measures Implementation",
            category: "Security",
            date: "2025-03-08",
            summary: "Information about new security protocols and entry procedures.",
            content: "Dear Residents,\n\nWe are enhancing our building security measures to ensure the safety of all residents. The following changes will be implemented from April 1, 2025:\n\n1. New access cards will be issued to all residents\n2. Biometric verification at main entrance\n3. 24/7 security personnel at all entry/exit points\n4. Enhanced CCTV coverage in common areas\n\nPlease visit the management office between March 20-30 to update your details and collect your new access cards.\n\nYour safety is our priority.\n\nSincerely,\nThe Security Team",
            importance: "High"
        },
        {
            id: "ANN-2019",
            title: "Gym Equipment Upgrade",
            category: "Amenities",
            date: "2025-03-05",
            summary: "Information about upcoming gym renovations and new equipment.",
            content: "Dear Residents,\n\nWe're excited to announce that our community gym will be receiving a complete upgrade!\n\nThe gym will be closed from March 15-30, 2025 for the following improvements:\n\n- Installation of new cardio machines\n- Upgraded weight training equipment\n- New flooring and mirrors\n- Improved ventilation system\n- Addition of a dedicated stretching area\n\nWe apologize for the temporary inconvenience and look forward to providing you with enhanced fitness facilities.\n\nBest regards,\nAmenities Management",
            importance: "Medium"
        },
        {
            id: "ANN-2018",
            title: "Quarterly Maintenance Fee Update",
            category: "Financial",
            date: "2025-03-01",
            summary: "Information regarding the revised maintenance fees for the upcoming quarter.",
            content: "Dear Residents,\n\nThis is to inform you that the quarterly maintenance fees will be revised effective April 1, 2025. After careful consideration of operating costs and planned improvements, the committee has approved a 5% adjustment to the current rates.\n\nUpdated fee structure:\n- 1 BHK apartments: ₹5,250 per quarter\n- 2 BHK apartments: ₹7,350 per quarter\n- 3 BHK apartments: ₹9,450 per quarter\n\nThe fee adjustment will help fund improvements to common areas and enhanced security measures.\n\nPayment can be made through the resident portal or at the accounts office.\n\nThank you for your understanding.\n\nRegards,\nFinance Department",
            importance: "High"
        }
    ]);

    // Importance badge component
    const ImportanceBadge = ({ importance }) => {
        let bgColor, textColor, icon;
        
        switch(importance) {
            case 'High':
                bgColor = 'bg-red-100';
                textColor = 'text-red-800';
                break;
            case 'Medium':
                bgColor = 'bg-yellow-100';
                textColor = 'text-yellow-800';
                break;
            case 'Low':
                bgColor = 'bg-green-100';
                textColor = 'text-green-800';
                break;
            default:
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-800';
        }
        
        return (
            <span className={`flex items-center ${bgColor} ${textColor} text-xs px-2 py-1 rounded-full`}>
                {importance}
            </span>
        );
    };

    // Format date function - Fixed to be consistent between server and client
    const formatDate = (dateString) => {
        // Only format dates on the client side
        if (!isClient) {
            return dateString; // Return raw date on server side
        }
        
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Filter announcements based on search and filters
    const filteredAnnouncements = announcements
        .filter(announcement => {
            // Apply search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    announcement.id.toLowerCase().includes(query) ||
                    announcement.title.toLowerCase().includes(query) ||
                    announcement.summary.toLowerCase().includes(query) ||
                    announcement.content.toLowerCase().includes(query)
                );
            }
            return true;
        })
        .filter(announcement => {
            // Apply category filter
            if (filterCategory !== 'All') {
                return announcement.category === filterCategory;
            }
            return true;
        })
        // Sort by date, newest first
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get unique announcement categories for filter dropdown
    const announcementCategories = ['All', ...new Set(announcements.map(ann => ann.category))];
    
    // Handle clicking on an announcement
    const toggleAnnouncementDetails = (announcementId) => {
        if (expandedAnnouncementId === announcementId) {
            setExpandedAnnouncementId(null);
        } else {
            setExpandedAnnouncementId(announcementId);
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
            <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4 md:mb-8 text-center">Announcements</h1>

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
                                    placeholder="Search announcements..."
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
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    {announcementCategories.map(category => (
                                        <option key={category} value={category}>{category === 'All' ? 'All Categories' : category}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Announcements List */}
                    {filteredAnnouncements.length > 0 ? (
                        <div>
                            {filteredAnnouncements.map(announcement => (
                                <div key={announcement.id} className="border-b border-gray-200 last:border-b-0">
                                    {/* Announcement Summary Row */}
                                    <div 
                                        className="p-4 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => toggleAnnouncementDetails(announcement.id)}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <div className="flex flex-col">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-gray-900">{announcement.title}</span>
                                                    <span className="text-sm text-gray-500">{announcement.id}</span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                                                    <span>{announcement.category}</span>
                                                    <span>•</span>
                                                    <div className="flex items-center">
                                                        <Calendar size={14} className="mr-1" />
                                                        <span>{formatDate(announcement.date)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <ImportanceBadge importance={announcement.importance} />
                                                {expandedAnnouncementId === announcement.id ? 
                                                    <ChevronDown size={20} className="text-gray-400" /> :
                                                    <ChevronRight size={20} className="text-gray-400" />
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Announcement Details */}
                                    {expandedAnnouncementId === announcement.id && (
                                        <div className="px-4 pb-6 bg-gray-50 border-t border-gray-200">
                                            <div className="py-4">
                                                <div className="flex items-center mb-4 space-x-2">
                                                    <Bell size={16} className="text-blue-600" />
                                                    <h3 className="font-medium text-lg text-gray-900">{announcement.title}</h3>
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <Calendar size={14} className="mr-1" />
                                                        <span>{formatDate(announcement.date)}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium">Category:</span>
                                                        <span className="ml-1">{announcement.category}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium">Importance:</span>
                                                        <span className="ml-1">{announcement.importance}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-white p-4 rounded-md border border-gray-200">
                                                    {announcement.content.split('\n\n').map((paragraph, idx) => (
                                                        <p key={idx} className="text-gray-700 mb-4 last:mb-0">
                                                            {paragraph.includes('\n') ? (
                                                                paragraph.split('\n').map((line, lineIdx, array) => (
                                                                    <React.Fragment key={lineIdx}>
                                                                        {line}
                                                                        {lineIdx < array.length - 1 && <br />}
                                                                    </React.Fragment>
                                                                ))
                                                            ) : (
                                                                paragraph
                                                            )}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No announcements found</h3>
                            <p className="text-gray-500">
                                {searchQuery || filterCategory !== 'All' ? 
                                    'Try adjusting your search or filters' : 
                                    'There are no announcements at this time'}
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}