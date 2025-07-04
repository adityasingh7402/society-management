import React, { useEffect, useState } from 'react';
import PreloaderSociety from '../../components/PreloaderSociety';
import { User, Check, X, Home, AlertCircle, Eye, Loader, Building, Layers, Grid, Clock } from 'lucide-react';
import { useRouter } from 'next/router';

export default function PendingResidents() {
  const [pendingResidents, setPendingResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [selectedResident, setSelectedResident] = useState(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const router = useRouter();

  // Fetch pending residents
  useEffect(() => {
    const fetchPendingResidents = async () => {
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
        const societyId = societyData.societyId;

        const response = await fetch(`/api/Resident-Api/getAllResidents?societyId=${societyId}`);
        if (response.ok) {
          const data = await response.json();
          const pending = data.filter(resident => resident.societyVerification === 'Pending');
          setPendingResidents(pending);
        } else {
          throw new Error('Failed to fetch residents');
        }
      } catch (error) {
        console.error('Error fetching residents:', error);
        setNotification({
          show: true,
          message: 'Failed to fetch pending residents',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPendingResidents();
  }, [router]);

  // Handle approval or rejection
  const handleAction = async (residentId, action) => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // Get society admin details
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();

      const response = await fetch(`/api/Resident-Api/${residentId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          flatDetails: selectedResident.flatDetails,
          adminDetails: {
            adminId: societyData._id,
            adminName: societyData.managerName || societyData.name,
            approvedAt: new Date()
          }
        })
      });

      if (response.ok) {
        setPendingResidents(prev => prev.filter(resident => resident._id !== residentId));
        setShowDetailPopup(false);
        
        setNotification({
          show: true,
          message: `Resident ${action.toLowerCase()} successfully`,
          type: 'success'
        });
      } else {
        throw new Error('Failed to update resident status');
      }
    } catch (error) {
      console.error('Error updating resident status:', error);
      setNotification({
        show: true,
        message: 'Failed to update resident status',
        type: 'error'
      });
    }
  };

  // Handle view resident details
  const handleViewDetails = (resident) => {
    setSelectedResident(resident);
    setImageLoading(true);
    setShowDetailPopup(true);
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
      <header className="bg-gray-800 shadow-lg border-b-4 border-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <User className="mr-3" size={32} />
              Pending Residents
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
        {pendingResidents.length > 0 ? (
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
                  {pendingResidents.map((resident) => (
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
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
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
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Pending Residents</h3>
            <p className="text-gray-500">There are no residents waiting for verification.</p>
          </div>
        )}
      </div>

      {/* Detail Popup */}
      {showDetailPopup && selectedResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Home className="mr-2" size={20} />
                      Flat Details
                    </h4>
                    <div className="space-y-3">
                      {/* Structure Type
                      <div className="flex items-center text-gray-600">
                        <Building className="w-5 h-5 mr-2 text-blue-600" />
                        <div>
                          <span className="font-medium">Structure Type: </span>
                          <span className="capitalize">{selectedResident.flatDetails?.structureType || 'Block'}</span>
                        </div>
                      </div> */}

                      {/* Block/Wing/Tower */}
                      <div className="flex items-center text-gray-600">
                        <Layers className="w-5 h-5 mr-2 text-blue-600" />
                        <div>
                          <span className="font-medium">
                            {selectedResident.flatDetails?.structureType === 'wing' ? 'Wing' :
                             selectedResident.flatDetails?.structureType === 'tower' ? 'Tower' : 'Block'}: 
                          </span>
                          <span className="ml-1">{selectedResident.flatDetails?.blockName || 'Not assigned'}</span>
                        </div>
                      </div>

                      {/* Floor */}
                      <div className="flex items-center text-gray-600">
                        <Grid className="w-5 h-5 mr-2 text-blue-600" />
                        <div>
                          <span className="font-medium">Floor: </span>
                          <span>{selectedResident.flatDetails?.floorIndex || 'Not assigned'}</span>
                        </div>
                      </div>

                      {/* Flat Number */}
                      <div className="flex items-center text-gray-600">
                        <Home className="w-5 h-5 mr-2 text-blue-600" />
                        <div>
                          <span className="font-medium">Flat Number: </span>
                          <span>{selectedResident.flatDetails?.flatNumber || 'Not assigned'}</span>
                        </div>
                      </div>

                      {/* Verification Status */}
                      <div className="flex items-center text-gray-600 mt-4">
                        <Clock className="w-5 h-5 mr-2 text-yellow-600" />
                        <div>
                          <span className="font-medium">Status: </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending Verification
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h4>
                    <div className="space-y-2 text-gray-600">
                      <p>Phone: {selectedResident.phone}</p>
                      <p>Address: {selectedResident.address?.street}, {selectedResident.address?.city}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => handleAction(selectedResident._id, 'Approved')}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 flex items-center"
                  >
                    <Check className="mr-2" size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(selectedResident._id, 'Reject')}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200 flex items-center"
                  >
                    <X className="mr-2" size={16} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 