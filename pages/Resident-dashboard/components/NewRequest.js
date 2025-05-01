import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
    Wrench,
    Plus,
    ChevronDown,
    ChevronUp,
    Clock,
    CheckCircle,
    AlertCircle,
    X,
    Upload,
    Trash2,
    MessageSquare,
    Send,
    Loader2,
    FileText,
    Home,
    AlertTriangle,
    Calendar,
    User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaTools, FaWrench, FaPlug, FaThermometerHalf, FaBug, FaQuestion } from 'react-icons/fa';

export default function NewRequest() {
    const router = useRouter();
    const fileInputRef = useRef(null);

    // State variables
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [residentDetails, setResidentDetails] = useState(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [previewImages, setPreviewImages] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Filter state
    const [statusFilter, setStatusFilter] = useState('All');
    const [expandedTickets, setExpandedTickets] = useState({});

    // Remove fetchTickets from initial useEffect
    useEffect(() => {
        fetchResidentDetails();
    }, []);

    // Add new useEffect to fetch tickets when residentDetails is available
    useEffect(() => {
        if (residentDetails && residentDetails._id) {
            fetchTickets();
        }
    }, [residentDetails]);

    const fetchResidentDetails = async () => {
        try {
            const token = localStorage.getItem('Resident');
            if (!token) {
                router.push('/Login');
                return;
            }

            const response = await fetch('/api/Resident-Api/get-resident-details', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch resident details');
            }

            const data = await response.json();
            setResidentDetails(data);
        } catch (error) {
            console.error('Error fetching resident details:', error);
            toast.error('Failed to load resident details');
        }
    };

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('Resident');
            if (!token) {
                router.push('/Login');
                return;
            }

            const response = await fetch(`/api/Maintenance-Api/get-resident-tickets?residentId=${residentDetails._id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tickets');
            }

            const data = await response.json();
            setTickets(data.data);
            console.log('Fetched tickets:', data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Failed to load tickets');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();

        if (!title || !description || !category) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('Resident');
            let imageUrls = [];

            // Upload images first if there are any
            if (selectedFiles.length > 0) {
                const formData = new FormData();
                selectedFiles.forEach(file => {
                    formData.append('image', file);
                });

                const uploadResponse = await fetch('/api/Announcement-Api/upload-images', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload images');
                }

                const uploadData = await uploadResponse.json();
                imageUrls = uploadData.imageUrls;
            }

            const ticketData = {
                title,
                description,
                category,
                priority,
                images: imageUrls, // Use the newly uploaded images
                flatNumber: residentDetails.flatDetails.flatNumber,
                societyId: residentDetails.societyCode,
                residentId: residentDetails._id
            };

            const response = await fetch('/api/Maintenance-Api/create-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(ticketData),
            });

            if (!response.ok) {
                throw new Error('Failed to create ticket');
            }

            const data = await response.json();

            // Add the new ticket to the state
            setTickets([data.data, ...tickets]);

            // Reset form
            resetForm();
            setShowCreateForm(false);

            toast.success('Maintenance ticket created successfully');
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error(error.message || 'Failed to create ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTicket = async (ticketId) => {
        if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('Resident');

            const response = await fetch(`/api/Maintenance-Api/delete-ticket?id=${ticketId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete ticket');
            }

            // Remove the deleted ticket from state
            setTickets(tickets.filter(ticket => ticket._id !== ticketId));

            toast.success('Ticket deleted successfully');
        } catch (error) {
            console.error('Error deleting ticket:', error);
            toast.error(error.message || 'Failed to delete ticket');
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedTicket) {
            return;
        }

        try {
            const token = localStorage.getItem('Resident');

            const response = await fetch(`/api/Maintenance-Api/update-ticket?id=${selectedTicket._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    comment: newComment
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add comment');
            }

            const data = await response.json();

            // Update the selected ticket with the new data
            setSelectedTicket(data.data);

            // Update the ticket in the tickets list
            setTickets(tickets.map(ticket =>
                ticket._id === selectedTicket._id ? data.data : ticket
            ));

            // Clear the comment input
            setNewComment('');

            toast.success('Comment added successfully');
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error(error.message || 'Failed to add comment');
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Preview images
        const newPreviewImages = files.map(file => URL.createObjectURL(file));
        setPreviewImages([...previewImages, ...newPreviewImages]);
        setSelectedFiles([...selectedFiles, ...files]);
    };

    const handleUploadImages = async () => {
        if (selectedFiles.length === 0) return;

        setUploadingImages(true);
        try {
            const token = localStorage.getItem('Resident');

            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('image', file);
            });

            const response = await fetch('/api/Announcement-Api/upload-images', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload images');
            }

            const data = await response.json();

            // Add the uploaded image URLs to the state
            setUploadedImages([...uploadedImages, ...data.imageUrls]);

            // Clear the selected files and previews
            setSelectedFiles([]);
            setPreviewImages([]);

            toast.success('Images uploaded successfully');
        } catch (error) {
            console.error('Error uploading images:', error);
            toast.error(error.message || 'Failed to upload images');
        } finally {
            setUploadingImages(false);
        }
    };

    const removeImage = (index) => {
        const newPreviewImages = [...previewImages];
        const newSelectedFiles = [...selectedFiles];

        newPreviewImages.splice(index, 1);
        newSelectedFiles.splice(index, 1);

        setPreviewImages(newPreviewImages);
        setSelectedFiles(newSelectedFiles);
    };

    const removeUploadedImage = (index) => {
        const newUploadedImages = [...uploadedImages];
        newUploadedImages.splice(index, 1);
        setUploadedImages(newUploadedImages);
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setCategory('');
        setPriority('Medium');
        setUploadedImages([]);
        setPreviewImages([]);
        setSelectedFiles([]);
    };

    const toggleTicketExpand = (ticketId) => {
        setExpandedTickets({
            ...expandedTickets,
            [ticketId]: !expandedTickets[ticketId]
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Approved':
                return 'bg-blue-100 text-blue-800';
            case 'Assigned':
                return 'bg-purple-100 text-purple-800';
            case 'In Progress':
                return 'bg-indigo-100 text-indigo-800';
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'Rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Low':
                return 'bg-green-100 text-green-800';
            case 'Medium':
                return 'bg-blue-100 text-blue-800';
            case 'High':
                return 'bg-orange-100 text-orange-800';
            case 'Emergency':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Plumbing':
                return <FaWrench className="text-blue-500" />;
            case 'Electrical':
                return <FaPlug className="text-yellow-500" />;
            case 'Structural':
                return <FaTools className="text-gray-500" />;
            case 'Appliance':
                return <Home className="text-green-500" />;
            case 'Heating/Cooling':
                return <FaThermometerHalf className="text-red-500" />;
            case 'Pest Control':
                return <FaBug className="text-purple-500" />;
            case 'Other':
                return <FaQuestion className="text-gray-500" />;
            default:
                return <Wrench className="text-gray-500" />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredTickets = statusFilter === 'All'
        ? tickets
        : tickets.filter(ticket => ticket.status === statusFilter);

    return (
        <div className="min-h-screen bg-gray-50">
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center mb-4 md:mb-0">
                        <Wrench className="mr-3 text-blue-600" size={32} />
                        Maintenance Requests
                    </h1>

                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        {showCreateForm ? (
                            <>
                                <X size={18} className="mr-2" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <Plus size={18} className="mr-2" />
                                New Request
                            </>
                        )}
                    </button>
                </div>

                {/* Create Ticket Form */}
                {showCreateForm && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Maintenance Request</h2>

                        <form onSubmit={handleCreateTicket}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., Leaking Bathroom Faucet"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Structural">Structural</option>
                                        <option value="Appliance">Appliance</option>
                                        <option value="Heating/Cooling">Heating/Cooling</option>
                                        <option value="Pest Control">Pest Control</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                                        Priority
                                    </label>
                                    <select
                                        id="priority"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Emergency">Emergency</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Images
                                    </label>
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current.click()}
                                            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                        >
                                            <Upload size={18} className="mr-2" />
                                            Upload Images
                                        </button>
                                        {uploadingImages && (
                                            <Loader2 className="ml-3 h-5 w-5 animate-spin text-blue-500" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Please describe the issue in detail..."
                                    required
                                />
                            </div>

                            {/* Image Previews */}
                            {(previewImages.length > 0 || uploadedImages.length > 0) && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Images</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {previewImages.map((preview, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-md"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {uploadedImages.map((url, index) => (
                                            <div key={`uploaded-${index}`} className="relative">
                                                <img
                                                    src={url}
                                                    alt={`Uploaded ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-md"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeUploadedImage(index)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Reset
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2" size={18} />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={18} className="mr-2" />
                                            Create Request
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Status Filter */}
                <div className="mb-6">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="All">All Requests</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>

                {/* Tickets List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-12">
                        <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No maintenance requests</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {statusFilter === 'All'
                                ? "You haven't created any maintenance requests yet."
                                : `No requests with status "${statusFilter}".`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTickets.map((ticket) => (
                            <div
                                key={ticket._id}
                                className="bg-white rounded-lg shadow-md overflow-hidden"
                            >
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            {getCategoryIcon(ticket.category)}
                                            <h3 className="text-lg font-medium text-gray-900">{ticket.title}</h3>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-600 mb-4">{ticket.description}</div>

                                    {/* Display ticket images */}
                                    {ticket.images && ticket.images.length > 0 && (
                                        <div className="mb-4">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {ticket.images.map((url, index) => (
                                                    <div key={index} className="relative group">
                                                        <img
                                                            src={url}
                                                            alt={`Ticket image ${index + 1}`}
                                                            className="w-full h-32 object-cover rounded-md cursor-pointer transition-transform hover:scale-105"
                                                            onClick={() => window.open(url, '_blank')}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-4">
                                        <button
                                            onClick={() => toggleTicketExpand(ticket._id)}
                                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                                        >
                                            {expandedTickets[ticket._id] ? (
                                                <>Hide Details <ChevronUp className="h-4 w-4 ml-1" /></>
                                            ) : (
                                                <>Show Details <ChevronDown className="h-4 w-4 ml-1" /></>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Expandable section for additional details and comments */}
                                {expandedTickets[ticket._id] && (
                                    <div className="px-4 pb-4">
                                        <div className="mt-2 text-sm text-gray-600">{ticket.description}</div>

                                        {/* Display ticket images */}
                                        {ticket.images && ticket.images.length > 0 && (
                                            <div className="mb-4">
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                    {ticket.images.map((url, index) => (
                                                        <img
                                                            key={index}
                                                            src={url}
                                                            alt={`Ticket image ${index + 1}`}
                                                            className="w-full h-32 object-cover rounded-md"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                Created: {formatDate(ticket.createdAt)}
                                            </div>
                                            <div className="flex items-center">
                                                <AlertTriangle className="h-4 w-4 mr-1" />
                                                Priority: <span className={`ml-1 px-2 py-0.5 rounded-full ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </div>
                                            {ticket.assignedTo && (
                                                <div className="flex items-center">
                                                    <User className="h-4 w-4 mr-1" />
                                                    Assigned to: {ticket.assignedTo}
                                                </div>
                                            )}
                                        </div>

                                        {ticket.comments?.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Comments</h4>
                                                <div className="space-y-3">
                                                    {ticket.comments.map((comment, index) => (
                                                        <div key={index} className="flex space-x-3">
                                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${comment.isAdmin ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                                <User className={`h-4 w-4 ${comment.isAdmin ? 'text-blue-600' : 'text-gray-600'}`} />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm">
                                                                    <span className={`font-medium ${comment.isAdmin ? 'text-blue-600' : 'text-gray-900'}`}>
                                                                        {comment.isAdmin ? 'Admin' : 'You'}
                                                                    </span>
                                                                    <span className="text-gray-500 ml-2">
                                                                        {formatDate(comment.createdAt)}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-1 text-sm text-gray-600">
                                                                    {comment.text}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 flex items-center space-x-4">
                                            {ticket.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleDeleteTicket(ticket._id)}
                                                    className="flex items-center text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete Request
                                                </button>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="text"
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        placeholder="Add a comment..."
                                                        className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                    <button
                                                        onClick={handleAddComment}
                                                        disabled={!newComment.trim()}
                                                        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}