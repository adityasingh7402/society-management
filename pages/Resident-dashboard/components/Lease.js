import React, { useState } from 'react';
import { FaFile, FaUpload, FaDownload, FaTrash, FaCalendarAlt, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { useRouter } from 'next/router';

export default function Lease() {
    const router = useRouter();
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    // Sample data for lease documents
    const [leaseDocuments, setLeaseDocuments] = useState([
        {
            id: 1,
            name: "Lease Agreement - Priya Singh",
            type: "PDF",
            uploadDate: "2023-09-15",
            expiryDate: "2024-09-14",
            status: "Active",
            size: "2.4 MB"
        },
        {
            id: 2,
            name: "Lease Renewal - Priya Singh",
            type: "PDF",
            uploadDate: "2024-03-01",
            expiryDate: "2025-09-14",
            status: "Pending",
            size: "1.8 MB"
        },
        {
            id: 3,
            name: "Lease Agreement - Rahul Sharma",
            type: "PDF",
            uploadDate: "2023-01-10",
            expiryDate: "2023-09-30",
            status: "Expired",
            size: "2.1 MB"
        },
        {
            id: 4,
            name: "Inventory List - Priya Singh",
            type: "DOCX",
            uploadDate: "2023-09-15",
            expiryDate: null,
            status: "Active",
            size: "0.9 MB"
        },
        {
            id: 5,
            name: "Lease Agreement - Anil Kumar",
            type: "PDF",
            uploadDate: "2022-05-25",
            expiryDate: "2022-12-31",
            status: "Expired",
            size: "2.3 MB"
        }
    ]);

    // Filter documents based on search term
    const filteredDocuments = leaseDocuments.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group documents by status
    const activeDocuments = filteredDocuments.filter(doc => doc.status === "Active");
    const pendingDocuments = filteredDocuments.filter(doc => doc.status === "Pending");
    const expiredDocuments = filteredDocuments.filter(doc => doc.status === "Expired");

    // Calculate statistics
    const documentStats = {
        total: leaseDocuments.length,
        active: activeDocuments.length,
        pending: pendingDocuments.length,
        expired: expiredDocuments.length
    };

    // Handle file selection
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    // Handle document upload
    const handleUpload = (e) => {
        e.preventDefault();
        
        if (selectedFile) {
            const newDocument = {
                id: leaseDocuments.length + 1,
                name: e.target.documentName.value,
                type: selectedFile.name.split('.').pop().toUpperCase(),
                uploadDate: new Date().toISOString().split('T')[0],
                expiryDate: e.target.expiryDate.value || null,
                status: "Active",
                size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
            };
            
            setLeaseDocuments([...leaseDocuments, newDocument]);
            setUploadModalOpen(false);
            setSelectedFile(null);
        }
    };

    // Handle document deletion
    const handleDelete = (id) => {
        setLeaseDocuments(leaseDocuments.filter(doc => doc.id !== id));
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
                <h1 className="text-2xl md:text-3xl text-center font-bold text-blue-600 mb-6">Lease Documents</h1>

                {/* Stats Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Overview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Total Documents</p>
                            <p className="text-2xl font-bold text-blue-600">{documentStats.total}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Active</p>
                            <p className="text-2xl font-bold text-green-600">{documentStats.active}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{documentStats.pending}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Expired</p>
                            <p className="text-2xl font-bold text-red-600">{documentStats.expired}</p>
                        </div>
                    </div>
                </div>

                {/* Search and Upload Section */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-grow relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Search documents by name or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="flex-shrink-0 flex items-center justify-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <FaUpload />
                        <span>Upload Document</span>
                    </button>
                </div>

                {/* Documents List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <FaFile className="mr-2 text-blue-600" />
                            Lease Documents
                        </h2>
                        
                        {filteredDocuments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredDocuments.map((doc) => (
                                            <tr key={doc.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-md">
                                                            <span className="text-sm font-medium text-blue-800">{doc.type}</span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                                                            <div className="text-sm text-gray-500">{doc.type} Document</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.uploadDate}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.expiryDate || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        doc.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                        doc.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {doc.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.size}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button className="text-blue-600 hover:text-blue-800">
                                                            <FaDownload />
                                                        </button>
                                                        <button 
                                                            className="text-red-600 hover:text-red-800"
                                                            onClick={() => handleDelete(doc.id)}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No documents found matching your search.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {uploadModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Document</h2>
                        <form onSubmit={handleUpload}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Document Name</label>
                                <input
                                    type="text"
                                    name="documentName"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Document File</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                                <span>Upload a file</span>
                                                <input 
                                                    type="file" 
                                                    className="sr-only" 
                                                    onChange={handleFileChange}
                                                    required
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                                    </div>
                                </div>
                                {selectedFile && (
                                    <p className="mt-2 text-sm text-gray-500">
                                        Selected: {selectedFile.name}
                                    </p>
                                )}
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Expiry Date (optional)</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaCalendarAlt className="text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        name="expiryDate"
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setUploadModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Upload
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}