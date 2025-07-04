import React, { useState } from 'react';
import { Tag, AlertTriangle } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl transform transition-all duration-300 ease-in-out scale-100">
        <div className="relative">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Resident Details
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-12 gap-8">
              {/* Left Column - Profile Image and Basic Info */}
              <div className="col-span-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <img
                      src={resident.userImage || "/profile.png"}
                      alt={resident.name || 'Resident'}
                      className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {e.target.src = "/profile.png"}}
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-800">{resident.name || 'N/A'}</h3>
                    <p className="text-gray-600">{resident.email || 'N/A'}</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col w-full space-y-3 mt-4">
                    <button
                      onClick={() => onUpdate(resident)}
                      className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                    >
                      Update Profile
                    </button>
                    <button
                      onClick={() => onViewTags(resident)}
                      className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                    >
                      <Tag size={18} className="mr-2" />
                      View Tags
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
                    >
                      Delete Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="col-span-8 space-y-6">
                {/* Flat Details */}
                <div className="bg-gray-50 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Flat Details
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm capitalize text-gray-500">{resident.flatDetails?.structureType || 'Block/Wing'}</p>
                      <p className="font-medium text-lg">{resident.flatDetails?.blockName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Floor</p>
                      <p className="font-medium text-lg">{resident.flatDetails?.floorIndex || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Flat Number</p>
                      <p className="font-medium text-lg">{resident.flatDetails?.flatNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="bg-gray-50 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Details
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-lg">{resident.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-lg">{resident.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-lg">{formatAddress()}</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6 transform transition-all animate-fade-in-up"
          >
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Resident Profile</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <span className="font-medium">"{resident.name}"</span>'s profile? 
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-center space-x-4 mt-5">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 