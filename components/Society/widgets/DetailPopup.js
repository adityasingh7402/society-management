import React, { useState } from 'react';
import { Tag, AlertTriangle, User, Home, CheckCircle, Phone, Mail, MapPin, Edit3, Trash2, X } from 'lucide-react';

export default function DetailPopup({ resident, onClose, onUpdate, onDelete, onViewTags }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Helper function to format address
  const formatAddress = () => {
    if (!resident.address) return 'N/A';
    if (typeof resident.address === 'object') {
      const parts = [
        resident.address.street,
        resident.address.city,
        resident.address.state,
        resident.address.pinCode
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }
    return resident.address;
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDelete(resident._id);
    setShowDeleteModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Resident Details</h2>
                <p className="text-sm text-gray-500">View and manage resident information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Left Column - Profile Section */}
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                <div className="flex flex-col items-center space-y-4">
                  
                  {/* Profile Image */}
                  <div className="relative">
                    <img
                      src={resident.userImage || "/profile.png"}
                      alt={resident.name || 'Resident'}
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                      onError={(e) => {e.target.src = "/profile.png"}}
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900">{resident.name || 'N/A'}</h3>
                    <p className="text-sm text-gray-600 flex items-center justify-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {resident.email || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center justify-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {resident.phone || 'N/A'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col w-full space-y-2">
                    <button
                      onClick={() => onUpdate(resident)}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Edit3 size={14} />
                      <span>Update Profile</span>
                    </button>
                    
                    <button
                      onClick={() => onViewTags(resident)}
                      className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Tag size={14} />
                      <span>View Tags</span>
                    </button>
                    
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Trash2 size={14} />
                      <span>Delete Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="col-span-12 lg:col-span-8 space-y-5">
              
              {/* Flat Details Card */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center">
                    <Home className="h-4 w-4 text-gray-600 mr-2" />
                    Flat Details
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {resident.flatDetails?.structureType || 'Block/Wing'}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{resident.flatDetails?.blockName || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1">Floor</p>
                      <p className="text-sm font-semibold text-gray-900">{resident.flatDetails?.floorIndex || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1">Flat Number</p>
                      <p className="text-sm font-semibold text-gray-900">{resident.flatDetails?.flatNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approved By Card */}
              {resident.approvedBy && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center">
                      <CheckCircle className="h-4 w-4 text-gray-600 mr-2" />
                      Approved By
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-1">Admin Name</p>
                        <p className="text-sm font-semibold text-gray-900">{resident.approvedBy.adminName || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-1">Approved At</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {resident.approvedBy.approvedAt 
                            ? new Date(resident.approvedBy.approvedAt).toLocaleString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Details Card */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 text-gray-600 mr-2" />
                    Contact Details
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                      <div className="p-1 bg-blue-100 rounded-md">
                        <Phone className="h-3 w-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Phone</p>
                        <p className="text-sm font-semibold text-gray-900">{resident.phone || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                      <div className="p-1 bg-green-100 rounded-md">
                        <Mail className="h-3 w-3 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Email</p>
                        <p className="text-sm font-semibold text-gray-900">{resident.email || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                      <div className="p-1 bg-red-100 rounded-md">
                        <MapPin className="h-3 w-3 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Address</p>
                        <p className="text-sm font-semibold text-gray-900">{formatAddress()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg max-w-md w-full">
            <div className="p-5">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Resident Profile</h3>
                <p className="text-sm text-gray-600 mb-5">
                  Are you sure you want to delete <span className="font-medium text-gray-900">"{resident.name}"</span>'s profile? 
                  This action cannot be undone.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}