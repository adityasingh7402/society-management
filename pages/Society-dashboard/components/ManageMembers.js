import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';
import {
  User,
  Phone,
  Mail,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Eye,
  Upload,
  Image as ImageIcon,
  UserCog,
  Clock,
  Activity,
  Maximize2
} from 'lucide-react';
import { usePermissions } from "../../../components/PermissionsContext";
import AccessDenied from "../widget/societyComponents/accessRestricted";

export default function ManageMembers() {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [societyData, setSocietyData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'member',
    permissions: [],
    status: 'active'
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    permission: '',
    status: ''
  });

  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'security_admin', label: 'Security Admin' },
    { value: 'maintenance_admin', label: 'Maintenance Admin' },
    { value: 'member', label: 'Member' }
  ];

  const permissions = [
    { value: 'manage_residents', label: 'Manage Residents' },
    { value: 'manage_bills', label: 'Manage Bills' },
    { value: 'manage_maintenance', label: 'Manage Maintenance' },
    { value: 'manage_security', label: 'Manage Security' },
    { value: 'manage_notices', label: 'Manage Notices' },
    { value: 'manage_amenities', label: 'Manage Amenities' },
    { value: 'manage_complaints', label: 'Manage Complaints' },
    { value: 'view_reports', label: 'View Reports' },
    { value: 'manage_members', label: 'Manage Members' },
    { value: 'full_access', label: 'Full Access' }
  ];

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  useEffect(() => {
    fetchMembers();
  }, []);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      const response = await fetch('/api/Society-Api/manage-members', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const data = await response.json();
      setMembers(data.members || []); // Set empty array as fallback
    } catch (error) {
      setNotification({
        show: true,
        message: 'Failed to fetch members',
        type: 'error'
      });
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('Society');
      const response = await fetch('/api/Society-Api/manage-members', {
        method: showEditModal ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(showEditModal ? {
          memberId: selectedMember._id,
          updates: formData
        } : formData)
      });

      const data = await response.json();

      if (data.success) {
        setNotification({
          show: true,
          message: showEditModal ? 'Member updated successfully' : 'Member added successfully',
          type: 'success'
        });
        fetchMembers();
        resetForm();
      } else {
        throw new Error(data.message || 'Operation failed');
      }
    } catch (error) {
      setNotification({
        show: true,
        message: error.message || 'Failed to save member',
        type: 'error'
      });
      console.error('Error saving member:', error);
    }
  };

  const handleDelete = async (memberId) => {
    setMemberToDelete(members.find(m => m._id === memberId));
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('Society');
      const response = await fetch('/api/Society-Api/manage-members', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ memberIdToDelete: memberToDelete._id })
      });

      const data = await response.json();

      if (data.success) {
        setNotification({
          show: true,
          message: 'Member removed successfully',
          type: 'success'
        });
        fetchMembers();
        setShowDetailPopup(false);
      } else {
        throw new Error(data.message || 'Failed to remove member');
      }
    } catch (error) {
      setNotification({
        show: true,
        message: error.message || 'Failed to remove member',
        type: 'error'
      });
      console.error('Error removing member:', error);
    } finally {
      setShowDeleteModal(false);
      setMemberToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      role: 'member',
      permissions: [],
      status: 'active'
    });
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedMember(null);
    setShowDetailPopup(false);
  };

  const handleViewDetails = (member) => {
    setSelectedMember(member);
    setShowDetailPopup(true);
  };

  // Update the handleEditMember function
  const handleEditMember = (member) => {
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      permissions: member.permissions,
      status: member.status
    });
    setShowEditModal(true);
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    
    // Remove any non-digit characters except the +
    value = value.replace(/[^\d+]/g, '');
    
    // Ensure the value starts with +91
    if (!value.startsWith('+91')) {
      value = '+91' + value.substring(3);
    }
    
    // Limit the total length to 13 (+91 plus 10 digits)
    if (value.length > 13) {
      value = value.slice(0, 13);
    }
    
    setFormData({ ...formData, phone: value });
  };

  // Add this new function to get the added by information
  const getAddedByInfo = (addedById) => {
    if (!societyData || !addedById) return 'N/A';
    
    // First check in members array
    const addedByMember = societyData.members.find(member => member._id === addedById);
    if (addedByMember) {
      return `${addedByMember.name} (${addedByMember.role.replace('_', ' ')})`;
    }
    
    // If not found in members, check if it was added by society manager
    if (societyData._id === addedById) {
      return `${societyData.managerName} (Society Manager)`;
    }
    
    return 'N/A';
  };

  // Modify the handleViewMember function
  const handleViewMember = async (member) => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // Fetch society details if not already fetched
      if (!societyData) {
        const response = await fetch('/api/Society-Api/get-society-details', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch society details');
        }

        const data = await response.json();
        setSocietyData(data);
      }

      setSelectedMember(member);
    } catch (error) {
      console.error('Error fetching society details:', error);
      setNotification({
        show: true,
        message: 'Failed to fetch society details',
        type: 'error'
      });
    }
  };

  const filteredMembers = members.filter(member => {
    const roleMatch = !filters.role || member.role === filters.role;
    const statusMatch = !filters.status || member.status === filters.status;
    const permissionMatch = !filters.permission || member.permissions.includes(filters.permission);
    return roleMatch && statusMatch && permissionMatch;
  });

  const resetFilters = () => {
    setFilters({
      role: '',
      permission: '',
      status: ''
    });
  };

  if (loading) {
    return <PreloaderSociety />;
  }
  const permissionss = usePermissions();
  if (!permissionss.includes("manage_members") && !permissionss.includes("full_access")) {
    return <AccessDenied />;
  }

  const ImagePreviewModal = ({ imageUrl, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
      <div className="relative max-w-4xl w-full">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X size={24} />
        </button>
        <img
          src={imageUrl}
          alt="Preview"
          className="w-full h-auto rounded-lg"
          onError={(e) => {e.target.src = "/profile.png"}}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <Shield className="mr-3" size={32} />
              Manage Members
            </h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
            >
              <Plus size={20} />
              Add Member
            </button>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg shadow-lg p-4 ${
          notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            {notification.message}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {members.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <Shield size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Members Found</h3>
            <p className="text-gray-500">Start by adding your first member to the system.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={20} className="mr-2" />
              Add Member
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Filters Section */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Role Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    className="w-full rounded-lg border-gray-300 p-2 outline-blue-500 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">All Roles</option>
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>

                {/* Permission Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Permission</label>
                  <select
                    value={filters.permission}
                    onChange={(e) => setFilters({ ...filters, permission: e.target.value })}
                    className="w-full rounded-lg border-gray-300 p-2 outline-blue-500 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">All Permissions</option>
                    {permissions.map(permission => (
                      <option key={permission.value} value={permission.value}>{permission.label}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full rounded-lg border-gray-300 p-2 outline-blue-500 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                {/* Reset Filters Button */}
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(member.addedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleViewMember(member)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={() => handleEditMember(member)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Member"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(member._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Member"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full overflow-hidden">
            <div className="flex">
              {/* Left Panel - Blue Section */}
              <div className="w-1/3 bg-blue-600 p-8 text-white">
                <div className="flex flex-col items-center">
                  <div 
                    className="h-32 w-32 rounded-full hover:scale-105 transition-transform duration-300 bg-blue-400 border-4 border-white/30 overflow-hidden flex items-center justify-center cursor-pointer group"
                    onClick={() => setShowImagePreview(true)}
                  >
                    <img
                      src={selectedMember.profileImage || "/profile.png"}
                      alt={selectedMember.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {e.target.src = "/profile.png"}}
                    />
                  </div>
                </div>

                <div className="mt-12">
                  <Shield className="w-8 h-8 mb-4" />
                  <h2 className="text-2xl font-bold mb-4">View Member</h2>
                  <p className="text-blue-100 mb-8">View member information and permissions for access control.</p>

                  <div className="space-y-4">
                    <div className="flex items-center text-blue-100">
                      <User className="w-5 h-5 mr-3" />
                      <span>Complete profile information</span>
                    </div>
                    <div className="flex items-center text-blue-100">
                      <Shield className="w-5 h-5 mr-3" />
                      <span>Assign appropriate role</span>
                    </div>
                    <div className="flex items-center text-blue-100">
                      <Check className="w-5 h-5 mr-3" />
                      <span>Set required permissions</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Form Section */}
              <div className="w-2/3 p-6 overflow-y-auto bg-white rounded-r-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Member Details</h2>
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Full Name & Phone Number */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <div className="flex items-center px-3 py-2 border rounded-md bg-gray-50">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <span>{selectedMember.name}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="flex items-center px-3 py-2 border rounded-md bg-gray-50">
                        <Phone className="w-5 h-5 text-gray-400 mr-2" />
                        <span>{selectedMember.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Email & Role */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <div className="flex items-center px-3 py-2 border rounded-md bg-gray-50">
                        <Mail className="w-5 h-5 text-gray-400 mr-2" />
                        <span>{selectedMember.email}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <div className="flex items-center px-3 py-2 border rounded-md bg-gray-50">
                        <Shield className="w-5 h-5 text-gray-400 mr-2" />
                        <span>{selectedMember.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                    <div className="space-y-3">
                      {selectedMember.permissions.map((permission, index) => (
                        <div key={index} className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              type="checkbox"
                              checked={true}
                              readOnly
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-not-allowed"
                              disabled
                            />
                          </div>
                          <div className="ml-3">
                            <label className="text-sm font-medium text-gray-700">
                              {permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </label>
                            <p className="text-xs text-gray-500">Access to {permission.split('_').join(' ').toLowerCase()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status & Added Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="flex items-center px-3 py-2 border rounded-md bg-gray-50">
                        <Activity className="w-5 h-5 text-gray-400 mr-2" />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedMember.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedMember.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Added On</label>
                      <div className="flex items-center px-3 py-2 border rounded-md bg-gray-50">
                        <Clock className="w-5 h-5 text-gray-400 mr-2" />
                        <span>
                          {selectedMember.addedAt ? new Date(selectedMember.addedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Added By</label>
                    <div className="flex items-center px-3 py-2 border rounded-md bg-gray-50">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <span>{getAddedByInfo(selectedMember.addedBy)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMember(null);
                        handleEditMember(selectedMember);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Update Member
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */} 
      {showImagePreview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]" 
          onClick={() => setShowImagePreview(false)}
        >
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img 
              src={selectedMember?.profileImage || "/profile.png"} 
              alt="Profile Preview" 
              className="max-w-[400px] max-h-[400px] rounded-lg object-cover"
              onError={(e) => {e.target.src = "/profile.png"}}
            />
            <button 
              className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
              onClick={() => setShowImagePreview(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Image Popup */}
      {showUploadPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Upload Profile Picture</h3>
              <button 
                onClick={() => setShowUploadPopup(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            {/* Add upload content here */}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && memberToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6 transform transition-all animate-fade-in-up"
          >
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Member Profile</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <span className="font-medium">"{memberToDelete.name}"</span>'s profile? 
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-center space-x-4 mt-5">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMemberToDelete(null);
                }}
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

      {/* Add/Edit Member Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-0 max-w-5xl w-full">
            <div className="flex h-[670px]">
              {/* Left Section - Decorative */}
              <div className="w-1/3 bg-gradient-to-br from-blue-600 to-blue-800 rounded-l-xl p-8 text-white flex flex-col justify-between">
                <div>
                  {/* Profile Image Upload Section */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative">
                      <div 
                        className="h-32 w-32 rounded-full hover:scale-105 transition-transform duration-300 bg-blue-400 border-4 border-white/30 overflow-hidden flex items-center justify-center cursor-pointer"
                        onClick={() => setShowImagePreview(true)}
                      >
                        {/* Default Profile Image */}
                        <img 
                          src="/profile.png"
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      
                      {/* Upload Button */}
                      <button 
                        className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUploadPopup(true)}
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </button>
                    </div>
                    <p className="text-white/80 text-sm mt-3">Upload profile picture</p>
                  </div>

                  {/* Image Preview Modal */}
                  {showImagePreview && (
                    <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50" onClick={() => setShowImagePreview(false)}>
                      <div className="relative">
                        <img 
                          src="/profile.png" 
                          alt="Profile Preview" 
                          className="max-w-[400px] max-h-[400px] rounded-lg object-cover"
                        />
                        <button 
                          className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                          onClick={() => setShowImagePreview(false)}
                        >
                          <X className="h-6 w-6 text-white" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Image Popup */}
                  {showUploadPopup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-semibold text-gray-900">Upload Profile Picture</h3>
                          <button 
                            onClick={() => setShowUploadPopup(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X size={24} />
                          </button>
                        </div>

                        {/* Upload Area */}
                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                          <div className="mb-4">
                            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                              <ImageIcon className="h-8 w-8 text-blue-500" />
                            </div>
                            <p className="text-gray-700 mb-2">Drag and drop your image here</p>
                            <p className="text-gray-500 text-sm mb-4">or</p>
                            <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center mx-auto">
                              <Upload className="h-4 w-4 mr-2" />
                              Choose File
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Supported formats: JPG, PNG, GIF (Max size: 5MB)
                          </p>
                        </div>

                        {/* Preview Area (hidden by default) */}
                        <div className="mt-6 hidden">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                          <div className="w-24 h-24 rounded-full bg-gray-100 mx-auto overflow-hidden">
                            <img 
                              src="/profile.png" 
                              alt="Upload Preview" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 mt-6">
                          <button
                            onClick={() => setShowUploadPopup(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Photo
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-8">
                    <Shield className="h-16 w-16 text-white/80" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">
                    {showEditModal ? 'Update Member' : 'Welcome New Member'}
                  </h2>
                  <p className="text-blue-100 text-lg">
                    {showEditModal 
                      ? 'Update member information and permissions to ensure accurate access control.'
                      : 'Add a new member to your society management team with specific roles and permissions.'}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-sm text-blue-100">
                    <User className="h-5 w-5" />
                    <span>Complete profile information</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-blue-100">
                    <Shield className="h-5 w-5" />
                    <span>Assign appropriate role</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-blue-100">
                    <Check className="h-5 w-5" />
                    <span>Set required permissions</span>
                  </div>
                </div>
              </div>

              {/* Right Section - Form */}
              <div className="w-2/3 p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {showEditModal ? 'Edit Member Details' : 'Add New Member'}
                  </h3>
                  <button 
                    onClick={resetForm} 
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 p-2 outline-blue-500 focus:ring-blue-500"
                          placeholder="Enter full name"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          value={formData.phone || '+91'}
                          onChange={handlePhoneChange}
                          onFocus={(e) => {
                            const val = e.target.value;
                            e.target.value = '';
                            e.target.value = val;
                          }}
                          className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 p-2 outline-blue-500 focus:ring-blue-500"
                          placeholder="+91 Phone Number"
                          required
                        />
                      </div>
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 p-2 outline-blue-500 focus:ring-blue-500"
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                    </div>

                    {/* Status Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Activity className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 p-2 outline-blue-500 focus:ring-blue-500 bg-white"
                        >
                          {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Role Field */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Shield className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 p-2 outline-blue-500 focus:ring-blue-500 bg-white"
                        >
                          {roles.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                    <div className="grid grid-cols-2 gap-4 max-h-[180px] overflow-y-auto bg-gray-50 p-4 rounded-lg">
                      {permissions.map((permission) => (
                        <label key={permission.value} className="relative flex items-start py-2">
                          <div className="min-w-0 flex-1 text-sm">
                            <div className="font-medium text-gray-700">{permission.label}</div>
                            <p className="text-gray-500 text-xs">{`Access to ${permission.label.toLowerCase()}`}</p>
                          </div>
                          <div className="ml-3 flex items-center h-5">
                            <input
                              type="checkbox"
                              value={permission.value}
                              checked={formData.permissions.includes(permission.value)}
                              onChange={(e) => {
                                const newPermissions = e.target.checked
                                  ? [...formData.permissions, permission.value]
                                  : formData.permissions.filter((p) => p !== permission.value);
                                setFormData({ ...formData, permissions: newPermissions });
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {showEditModal ? 'Update Member' : 'Add Member'}
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