import React, { useEffect, useState } from 'react';
import PreloaderSociety from '../../components/PreloaderSociety';
import { Eye, User, Tag } from 'lucide-react';
import { useRouter } from 'next/router';
import DetailPopup from '../../../components/Society/widgets/DetailPopup';
import UpdatePopup from '../../../components/Society/widgets/UpdatePopup';
import Notification from '../../../components/Society/widgets/Notification';
import TagsPopup from '../../../components/Society/widgets/TagsPopup';

export default function OwnerProfile() {
  const [approvedResidents, setApprovedResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResident, setSelectedResident] = useState(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [showTagsPopup, setShowTagsPopup] = useState(false);
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

  // Handle view tags
  const handleViewTags = (resident) => {
    setSelectedResident(resident);
    setShowTagsPopup(true);
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

      {/* Notification Component */}
      <Notification {...notification} />

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved At</th>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{resident.approvedBy?.adminName || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {resident.approvedBy?.approvedAt 
                            ? new Date(resident.approvedBy.approvedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleViewDetails(resident)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
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

      {/* Detail Popup Component */}
      {showDetailPopup && selectedResident && (
        <DetailPopup
          resident={selectedResident}
          onClose={() => setShowDetailPopup(false)}
          onUpdate={handleUpdateClick}
          onDelete={handleDeleteProfile}
          onViewTags={handleViewTags}
        />
      )}

      {/* Update Popup Component */}
      {showUpdatePopup && (
        <UpdatePopup
          formData={updateFormData}
          onChange={handleUpdateInputChange}
          onSubmit={handleUpdateSubmit}
          onClose={() => setShowUpdatePopup(false)}
        />
      )}

      {/* Tags Popup Component */}
      {showTagsPopup && selectedResident && (
        <TagsPopup
          resident={selectedResident}
          onClose={() => setShowTagsPopup(false)}
        />
      )}
    </div>
  );
}