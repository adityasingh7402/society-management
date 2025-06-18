import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const QRCode = dynamic(() => import('qrcode.react'), { ssr: false });

import {
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Phone,
    MapPin,
    Edit,
    Save,
    ArrowLeft,
    Search,
    Filter,
    Plus,
    Trash2,
    Building2,
    Shield,
    QrCode as QrCodeIcon,
    UserPlus,
    Download
} from 'lucide-react';

export default function SecurityProfile() {
    const [securityGuards, setSecurityGuards] = useState([]);
    const [selectedGuard, setSelectedGuard] = useState(null);
    const [editingGuard, setEditingGuard] = useState(null);
    const [verificationFilter, setVerificationFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [error, setError] = useState('');
    const [qrLoading, setQrLoading] = useState(false);
    const router = useRouter();

    // Form data structure for editing
    const [formData, setFormData] = useState({
        guardName: "",
        guardPhone: "+91",
        additionalNumbers: [],
        securityId: "",
        societyId: "",
        societyName: "",
        shiftTimings: {
            start: "",
            end: "",
        },
        address: {
            societyName: "",
            street: "",
            city: "",
            state: "",
            pinCode: ""
        }
    });

    // Fetch security guards on component mount
    useEffect(() => {
        setLoading(true);
        const fetchSecurityGuards = async () => {
            try {
                const token = localStorage.getItem('Society');
                if (!token) {
                    router.push('/societyLogin');
                    return;
                }

                const securityResponse = await fetch('/api/Society-Api/get-society-details', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!securityResponse.ok) {
                    throw new Error('Failed to fetch profile');
                }

                const data = await securityResponse.json();
                const societyId = data._id;
                const response = await fetch(`/api/Society-Api/get-all-security?societyId=${societyId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    console.log("No security guards found for this society");
                    setSecurityGuards([]);
                    return;
                }

                const securityData = await response.json();
                setSecurityGuards(securityData.securityGuards || []);
                setError('');
            } catch (error) {
                console.error('Error fetching security guards:', error);
                setError('An error occurred while fetching security guards. Please try again later.');
                setSecurityGuards([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSecurityGuards();
    }, []);

    // Initialize form data when editing a guard
    const handleEditGuard = (guard) => {
        setSelectedGuard(guard);
        setEditingGuard(true);
        setFormData({
            guardName: guard.guardName || "",
            guardPhone: guard.guardPhone || "+91",
            additionalNumbers: guard.additionalNumbers || [],
            securityId: guard.securityId || "",
            societyId: guard.societyId || "",
            societyName: guard.societyName || "",
            societyVerification: guard.societyVerification || "",
            shiftTimings: guard.shiftTimings || { start: "", end: "" },
            address: guard.address || {
                societyName: guard.societyName || "",
                street: "",
                city: "",
                state: "",
                pinCode: ""
            }
        });
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "start" || name === "end") {
            setFormData(prev => ({
                ...prev,
                shiftTimings: { ...prev.shiftTimings, [name]: value },
            }));
        } else if (name.startsWith("address.")) {
            const field = name.split(".")[1];
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Handle additional phone numbers
    const handleAddNumber = () => {
        if (formData.additionalNumbers.length < 3) {
            setFormData(prev => ({
                ...prev,
                additionalNumbers: [...prev.additionalNumbers, "+91"]
            }));
        } else {
            alert("You can add a maximum of 3 additional phone numbers.");
        }
    };

    const handleAdditionalNumberChange = (index, value) => {
        const updatedNumbers = [...formData.additionalNumbers];
        updatedNumbers[index] = value;
        setFormData(prev => ({ ...prev, additionalNumbers: updatedNumbers }));
    };

    const handleRemoveNumber = (index) => {
        const updatedNumbers = formData.additionalNumbers.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, additionalNumbers: updatedNumbers }));
    };

    // Filter security guards
    const filteredGuards = securityGuards.filter(guard =>
        (verificationFilter === 'all' || guard.societyVerification === verificationFilter) &&
        (searchTerm === '' ||
            guard.guardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            guard.guardPhone.includes(searchTerm))
    );

    // Handle society verification update
    const handleVerificationUpdate = async (guardId, status) => {
        try {
            const response = await axios.put(
                `/api/Society-Api/update-security-verify?securityId=${guardId}&status=${status}`,
                {},
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSecurityGuards(prevGuards =>
                prevGuards.map(guard =>
                    guard._id === guardId
                        ? { ...guard, societyVerification: status }
                        : guard
                )
            );
        } catch (error) {
            console.error('Full error details:', error.response?.data || error.message);
        }
    };

    // Handle guard information update
    const handleGuardUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(
                `/api/Society-Api/update-security-profile`,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Update local state with the updated guard information
            setSecurityGuards(prevGuards =>
                prevGuards.map(guard =>
                    guard.securityId === formData.securityId
                        ? { ...guard, ...formData }
                        : guard
                )
            );

            // Reset editing state
            setEditingGuard(false);
            setSelectedGuard(null);
        } catch (error) {
            console.error('Error updating guard:', error.response?.data || error.message);
        }
    };

    // Verification status color mapping
    const getVerificationStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Reject': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    // Function to handle direct enrollment
    const handleDirectEnrollment = () => {
        router.push('/Enroll-Security');
        setShowAddModal(false);
    };

    // Function to generate QR code URL
    const generateQRCode = async () => {
        setQrLoading(true);
        const enrollmentUrl = `${window.location.origin}/Enroll-Security`;
        try {
            const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(enrollmentUrl)}`);
            if (response.ok) {
                setQrCodeUrl(response.url);
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
            setError('Failed to generate QR code');
        } finally {
            setQrLoading(false);
        }
    };

    // Call generateQRCode when QR modal is opened
    useEffect(() => {
        if (showQRModal) {
            generateQRCode();
        }
    }, [showQRModal]);

    // Function to download QR code
    const downloadQRCode = () => {
        if (qrCodeUrl) {
            const link = document.createElement('a');
            link.href = qrCodeUrl;
            link.download = 'security-enrollment-qr.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        loading ? <PreloaderSociety /> : (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                            <Shield className="mr-3" size={32} />
                            Security Profile
                        </h1>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        >
                            <UserPlus className="mr-2" size={20} />
                            Add Security Guard
                        </button>
                    </div>
                </div>
            </header>

            {/* Add Security Guard Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Security Guard</h2>
                        <div className="space-y-4">
                            <button
                                onClick={handleDirectEnrollment}
                                className="w-full p-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
                            >
                                <UserPlus className="mr-2" size={24} />
                                Create Security Profile Here
                            </button>
                            <button
                                onClick={() => {
                                    setShowQRModal(true);
                                    setShowAddModal(false);
                                }}
                                className="w-full p-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center"
                            >
                                <QrCodeIcon className="mr-2" size={24} />
                                Generate QR Code
                            </button>
                        </div>
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="mt-6 w-full p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Scan QR Code</h2>
                        <div className="flex justify-center mb-6 min-h-[200px] items-center">
                            {qrLoading ? (
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
                                    <p className="text-gray-600">Generating QR Code...</p>
                                </div>
                            ) : qrCodeUrl ? (
                                <div className="relative">
                                    <img 
                                        src={qrCodeUrl} 
                                        alt="QR Code"
                                        className="rounded-lg shadow-md"
                                        width={200}
                                        height={200}
                                    />
                                </div>
                            ) : (
                                <div className="text-center text-red-600">
                                    <XCircle className="h-12 w-12 mx-auto mb-2" />
                                    <p>Failed to generate QR code</p>
                                </div>
                            )}
                        </div>
                        <p className="text-center text-gray-600 mb-6">
                            {qrCodeUrl ? 'Scan this QR code to open the security guard enrollment form' : 'Please wait while we generate the QR code'}
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setShowQRModal(false);
                                    setQrCodeUrl('');
                                }}
                                className="w-full p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 p-4 md:p-8">
                <div className="container mx-auto max-w-7xl">
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

                    {/* Filters and Search */}
                    <div className="bg-white shadow-md rounded-lg p-5 mb-6 border border-blue-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Verification Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <Filter className="mr-2 text-blue-500" size={18} />
                                    Verification Status
                                </label>
                                <select
                                    value={verificationFilter}
                                    onChange={(e) => setVerificationFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                >
                                    <option value="all">All Guards</option>
                                    <option value="Pending">Pending Verification</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Reject">Rejected</option>
                                </select>
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <Search className="mr-2 text-blue-500" size={18} />
                                    Search Guards
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search by name or phone"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security Guards Table */}
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-blue-100">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-600 text-white">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            <User className="inline mr-2" size={16} /> Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            <Phone className="inline mr-2" size={16} /> Phone
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            <Clock className="inline mr-2" size={16} /> Shift Timings
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            <CheckCircle2 className="inline mr-2" size={16} /> Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredGuards.map((guard) => (
                                        <tr key={guard._id} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {guard.guardName}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {guard.guardPhone}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {guard.shiftTimings?.start} - {guard.shiftTimings?.end}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getVerificationStatusColor(guard.societyVerification)}`}
                                                >
                                                    {guard.societyVerification}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => setSelectedGuard(guard)}
                                                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center"
                                                    >
                                                        <Eye className="mr-1" size={16} /> Details
                                                    </button>
                                                    {guard.societyVerification === 'Pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleVerificationUpdate(guard._id, 'Approved')}
                                                                className="px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center"
                                                            >
                                                                <CheckCircle2 className="mr-1" size={16} /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleVerificationUpdate(guard._id, 'Reject')}
                                                                className="px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center"
                                                            >
                                                                <XCircle className="mr-1" size={16} /> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {guard.societyVerification === 'Approved' && (
                                                        <button
                                                            onClick={() => handleEditGuard(guard)}
                                                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center"
                                                        >
                                                            <Edit className="mr-1" size={16} /> Edit
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredGuards.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                No security guards found matching your criteria
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Guard Details Modal */}
                    {selectedGuard && !editingGuard && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative animate-fadeIn">
                                <button
                                    onClick={() => setSelectedGuard(null)}
                                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
                                >
                                    <XCircle size={24} />
                                </button>

                                <h2 className="text-2xl font-bold mb-4 flex items-center text-blue-700 border-b pb-3">
                                    <User className="mr-3 text-blue-600" size={28} />
                                    Guard Details
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-center p-2 rounded-md hover:bg-blue-50 transition-colors">
                                        <User className="mr-3 text-blue-500" size={20} />
                                        <p><strong>Name:</strong> {selectedGuard.guardName}</p>
                                    </div>
                                    <div className="flex items-center p-2 rounded-md hover:bg-blue-50 transition-colors">
                                        <Phone className="mr-3 text-blue-500" size={20} />
                                        <p><strong>Phone:</strong> {selectedGuard.guardPhone}</p>
                                    </div>
                                    {selectedGuard.additionalNumbers && selectedGuard.additionalNumbers.length > 0 && (
                                        <div className="flex items-start p-2 rounded-md hover:bg-blue-50 transition-colors">
                                            <Phone className="mr-3 text-blue-500 mt-1" size={20} />
                                            <div>
                                                <strong>Additional Numbers:</strong>
                                                <ul className="list-disc pl-5 mt-1">
                                                    {selectedGuard.additionalNumbers.map((num, idx) => (
                                                        <li key={idx}>{num}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center p-2 rounded-md hover:bg-blue-50 transition-colors">
                                        <Clock className="mr-3 text-blue-500" size={20} />
                                        <p><strong>Shift Timings:</strong> {selectedGuard.shiftTimings?.start} - {selectedGuard.shiftTimings?.end}</p>
                                    </div>
                                    <div className="flex items-start p-2 rounded-md hover:bg-blue-50 transition-colors">
                                        <MapPin className="mr-3 text-blue-500 mt-1" size={20} />
                                        <div>
                                            <strong>Address:</strong>
                                            <p className="mt-1">{selectedGuard.address?.societyName}</p>
                                            <p>{selectedGuard.address?.street}, {selectedGuard.address?.city}</p>
                                            <p>{selectedGuard.address?.state} - {selectedGuard.address?.pinCode}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center p-2 rounded-md hover:bg-blue-50 transition-colors">
                                        <CheckCircle2 className="mr-3 text-blue-500" size={20} />
                                        <p>
                                            <strong>Verification Status:</strong>
                                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getVerificationStatusColor(selectedGuard.societyVerification)}`}>
                                                {selectedGuard.societyVerification}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Guard Modal */}
                    {editingGuard && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
                            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 relative my-8 animate-fadeIn">
                                <button
                                    onClick={() => {
                                        setEditingGuard(false);
                                        setSelectedGuard(null);
                                    }}
                                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
                                >
                                    <XCircle size={24} />
                                </button>

                                <h2 className="text-2xl font-bold mb-4 flex items-center text-blue-700 border-b pb-3">
                                    <Edit className="mr-3 text-blue-600" size={28} />
                                    Edit Guard Details
                                </h2>

                                <form onSubmit={handleGuardUpdate} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Basic Information */}
                                        <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                                            <h3 className="font-medium text-blue-700">Personal Information</h3>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    name="guardName"
                                                    value={formData.guardName}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
                                                <input
                                                    type="tel"
                                                    name="guardPhone"
                                                    value={formData.guardPhone}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Phone Numbers</label>
                                                <div className="space-y-2">
                                                    {formData.additionalNumbers.map((number, index) => (
                                                        <div key={index} className="flex items-center space-x-2">
                                                            <input
                                                                type="tel"
                                                                value={number}
                                                                onChange={(e) => handleAdditionalNumberChange(index, e.target.value)}
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveNumber(index)}
                                                                className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {formData.additionalNumbers.length < 3 && (
                                                        <button
                                                            type="button"
                                                            onClick={handleAddNumber}
                                                            className="flex items-center text-blue-600 hover:text-blue-800 text-sm mt-2 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                                                        >
                                                            <Plus size={16} className="mr-1" /> Add Another Number
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Shift Timings */}
                                        <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                                            <h3 className="font-medium text-blue-700">Shift Information</h3>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Start Time</label>
                                                <input
                                                    type="time"
                                                    name="start"
                                                    value={formData.shiftTimings.start}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift End Time</label>
                                                <input
                                                    type="time"
                                                    name="end"
                                                    value={formData.shiftTimings.end}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Section */}
                                    <div className="bg-blue-50 p-4 rounded-lg mt-4">
                                        <h3 className="text-lg font-medium text-blue-700 mb-3 flex items-center">
                                            <MapPin className="mr-2 text-blue-500" size={20} />
                                            Address Information
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Society Name</label>
                                                <input
                                                    type="text"
                                                    name="address.societyName"
                                                    value={formData.address.societyName}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                                                <input
                                                    type="text"
                                                    name="address.street"
                                                    value={formData.address.street}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                                <input
                                                    type="text"
                                                    name="address.city"
                                                    value={formData.address.city}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                                <input
                                                    type="text"
                                                    name="address.state"
                                                    value={formData.address.state}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                                                <input
                                                    type="text"
                                                    name="address.pinCode"
                                                    value={formData.address.pinCode}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditingGuard(false)}
                                            className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                                        >
                                            <ArrowLeft className="mr-2" size={16} /> Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md"
                                        >
                                            <Save className="mr-2" size={16} /> Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Empty state if no guards */}
                    {securityGuards.length === 0 && (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                                <User className="text-blue-300 mb-4" size={64} />
                                <h3 className="text-xl font-medium text-gray-700 mb-2">No Security Guards Found</h3>
                                <p className="text-gray-500 mb-4">There are no security guards registered with this society yet.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        )
    );
}