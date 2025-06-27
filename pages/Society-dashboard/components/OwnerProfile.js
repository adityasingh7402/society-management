import React, { useEffect, useState } from 'react';
import PreloaderSociety from '../../components/PreloaderSociety';
import { AlertCircle, Check, Eye, Loader, User, X } from 'lucide-react';
import { useRouter } from 'next/router';

export default function OwnerProfile() {
  const [approvedResidents, setApprovedResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResident, setSelectedResident] = useState(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const router = useRouter();

  // Fetch residents from the API
  useEffect(() => {
    const fetchResidents = async () => {
      setLoading(true);
      try {
        // Get society token
        const token = localStorage.getItem('Society');
        if (!token) {
          router.push('/societyLogin');
          return;
        }

        // First get society details to get the societyId
        const societyResponse = await fetch('/api/Society-Api/get-society-details', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!societyResponse.ok) {
          throw new Error('Failed to fetch society details');
        }

        const societyData = await societyResponse.json();
        const societyId = societyData.societyId;

        // Now fetch residents with the societyId
        const response = await fetch(`/api/Resident-Api/getAllResidents?societyId=${societyId}`);
        if (response.ok) {
          const data = await response.json();
          // Filter only approved residents
          const approved = data.filter(resident => resident.societyVerification === 'Approved');
          setApprovedResidents(approved);
        } else {
          throw new Error('Failed to fetch residents');
        }
      } catch (error) {
        console.error('Error fetching residents:', error);
        setNotification({
          show: true,
          message: 'Failed to fetch residents',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, [router]);

  // Handle view resident details
  const handleViewDetails = (resident) => {
    setSelectedResident(resident);
    setImageLoading(true);
    setShowDetailPopup(true);
  };

  // Handle delete profile
  const handleDeleteProfile = async (residentId) => {
    if (!confirm('Are you sure you want to delete this resident? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/Resident-Api/${residentId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setApprovedResidents(prev => prev.filter(resident => resident._id !== residentId));
        setShowDetailPopup(false);
        setNotification({
          show: true,
          message: 'Resident deleted successfully',
          type: 'success'
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete resident');
      }
    } catch (error) {
      console.error('Error deleting resident:', error);
      setNotification({
        show: true,
        message: error.message || 'Failed to delete resident',
        type: 'error'
      });
    }
  };

  const handleUpdateClick = (resident) => {
    setUpdateFormData({
      name: resident.name || '',
      email: resident.email || '',
      phone: resident.phone || '',
    });
    setShowUpdatePopup(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/Resident-Api/${selectedResident._id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateFormData)
      });

      if (response.ok) {
        const updatedResident = await response.json();
        setApprovedResidents(prev => 
          prev.map(resident => 
            resident._id === selectedResident._id ? updatedResident : resident
          )
        );
        setSelectedResident(updatedResident);
        setShowUpdatePopup(false);
        setNotification({
          show: true,
          message: 'Profile updated successfully',
          type: 'success'
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({
        show: true,
        message: error.message || 'Failed to update profile',
        type: 'error'
      });
    }
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setUpdateFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setUpdateFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  if (loading) {
    return <PreloaderSociety />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b-4 border-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <User className="mr-3" size={32} />
              Owner Profile
            </h1>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <p className="flex items-center">
            {notification.type === 'success' ? (
              <Check className="mr-2" size={20} />
            ) : (
              <AlertCircle className="mr-2" size={20} />
            )}
            {notification.message}
          </p>
        </div>
      )}

      {/* Main Content - Table */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {approvedResidents.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {approvedResidents.map((resident) => (
                    <tr key={resident._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={resident.userImage || "/profile.png"}
                              alt={resident.name}
                              onError={(e) => {e.target.src = "/profile.png"}}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{resident.name}</div>
                            <div className="text-sm text-gray-500">{resident.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{resident.flatDetails?.flatNumber || 'Not assigned'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{resident.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleViewDetails(resident)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Approved Residents</h3>
            <p className="text-gray-500">There are no approved residents in the system yet.</p>
          </div>
        )}
      </div>

      {/* Detail Popup */}
      {showDetailPopup && selectedResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Loading State */}
            {imageLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-90 z-10 flex items-center justify-center rounded-xl">
                <div className="text-center">
                  <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
                  <p className="mt-2 text-gray-600">Loading details...</p>
                </div>
              </div>
            )}

            {/* Popup Content */}
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={() => setShowDetailPopup(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 z-20 group"
                title="Close"
              >
                <X size={24} className="text-gray-600 group-hover:text-gray-800" />
              </button>

              {/* Resident Image */}
              <div className="w-full h-48 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-xl relative">
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                  <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white">
                    <img
                      src={selectedResident.userImage || "/profile.png"}
                      alt={selectedResident.name}
                      className="w-full h-full object-cover"
                      onLoad={() => setImageLoading(false)}
                      onError={(e) => {
                        e.target.src = "/profile.png";
                        setImageLoading(false);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Resident Details */}
              <div className="pt-20 px-6 pb-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedResident.name}</h3>
                  <p className="text-gray-500">{selectedResident.email}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Flat Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Flat Details</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Block/Wing:</span> {selectedResident.flatDetails?.blockName}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Floor:</span> {selectedResident.flatDetails?.floorIndex}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Flat Number:</span> {selectedResident.flatDetails?.flatNumber}
                      </p>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Contact Details</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Phone:</span> {selectedResident.phone}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {selectedResident.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Address:</span> {selectedResident.address?.street}, {selectedResident.address?.city}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-4 px-6 pb-6">
                  <button
                    onClick={() => handleUpdateClick(selectedResident)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 flex items-center"
                  >
                    Update Profile
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(selectedResident._id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200 flex items-center"
                  >
                    Delete Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Profile Popup */}
      {showUpdatePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100">
            <div className="relative">
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Update Profile
                  </h2>
                  <button
                    onClick={() => setShowUpdatePopup(false)}
                    className="text-white hover:text-gray-200 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8">
                <form onSubmit={handleUpdateSubmit} className="space-y-6">
                  <div className="space-y-5">
                    {/* Name Input */}
                    <div className="relative group">
                      <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="name"
                          value={updateFormData.name}
                          onChange={handleUpdateInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white text-gray-800"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="relative group">
                      <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={updateFormData.email}
                          onChange={handleUpdateInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white text-gray-800"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Phone Input */}
                    <div className="relative group">
                      <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          name="phone"
                          value={updateFormData.phone}
                          onChange={handleUpdateInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white text-gray-800"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowUpdatePopup(false)}
                      className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                    >
                      Update Profile
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}