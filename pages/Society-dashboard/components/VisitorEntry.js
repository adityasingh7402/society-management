import React, { useEffect, useState } from 'react';
import PreloaderSociety from '../../components/PreloaderSociety';
import { Eye, User, Home, Trash2, Filter, Calendar, CheckCircle, XCircle, X, Phone, Mail, MapPin, Clock, LogOut, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/router';
import Notification from '../../../components/Society/widgets/Notification';

// Helper to group visitors by date range
function groupVisitorsByDate(visitors) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfToday.getDate() - 1);
  const startOfLastWeek = new Date(startOfToday); startOfLastWeek.setDate(startOfToday.getDate() - 7);
  const startOfLastMonth = new Date(startOfToday); startOfLastMonth.setMonth(startOfToday.getMonth() - 1);
  const startOfLastYear = new Date(startOfToday); startOfLastYear.setFullYear(startOfToday.getFullYear() - 1);

  const groups = {
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
    lastYear: [],
  };

  visitors.forEach(v => {
    const entry = new Date(v.entryTime);
    if (entry >= startOfToday) {
      groups.today.push(v);
    } else if (entry >= startOfYesterday) {
      groups.yesterday.push(v);
    } else if (entry >= startOfLastWeek) {
      groups.lastWeek.push(v);
    } else if (entry >= startOfLastMonth) {
      groups.lastMonth.push(v);
    } else if (entry >= startOfLastYear) {
      groups.lastYear.push(v);
    }
  });
  return groups;
}

export default function VisitorEntry() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [filters, setFilters] = useState({ block: '', floor: '', flat: '', status: '', from: '', to: '' });
  const [allBlocks, setAllBlocks] = useState([]);
  const [allFloors, setAllFloors] = useState([]);
  const [allFlats, setAllFlats] = useState([]);
  const [societyId, setSocietyId] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [visitorToDelete, setVisitorToDelete] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState('');
  const router = useRouter();
  const [openGroup, setOpenGroup] = useState(''); // which group is open (except today)

  // Fetch societyId on mount
  useEffect(() => {
    const fetchSociety = async () => {
      try {
        const token = localStorage.getItem('Society');
        if (!token) {
          router.push('/societyLogin');
          return;
        }
        const res = await fetch('/api/Society-Api/get-society-details', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch society details');
        const data = await res.json();
        setSocietyId(data._id || data.societyId);
      } catch (error) {
        setNotification({ show: true, message: error.message, type: 'error' });
      }
    };
    fetchSociety();
  }, [router]);

  // Fetch visitors when societyId or filters change
  useEffect(() => {
    if (!societyId) return;
    const fetchVisitors = async () => {
      setLoading(true);
      try {
        let url = `/api/VisitorApi/Get-All-Visitors?societyId=${societyId}`;
        if (filters.block) url += `&blockName=${filters.block}`;
        if (filters.floor) url += `&floorNumber=${filters.floor}`;
        if (filters.flat) url += `&flatNumber=${filters.flat}`;
        // No status filter in API, so filter client-side
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch visitors');
        const { data } = await res.json();
        let filtered = data;
        // Date range filter
        if (filters.from) filtered = filtered.filter(v => new Date(v.entryTime) >= new Date(filters.from));
        if (filters.to) filtered = filtered.filter(v => new Date(v.entryTime) <= new Date(filters.to));
        // Status filter
        if (filters.status) filtered = filtered.filter(v => v.status === filters.status);
        setVisitors(filtered);
        // Populate block/floor/flat options
        const blocks = [...new Set(data.map(v => v.blockName))];
        setAllBlocks(blocks);
        const floors = filters.block ? [...new Set(data.filter(v => v.blockName === filters.block).map(v => v.floorNumber))] : [];
        setAllFloors(floors);
        const flats = filters.block && filters.floor ? [...new Set(data.filter(v => v.blockName === filters.block && v.floorNumber === Number(filters.floor)).map(v => v.flatNumber))] : [];
        setAllFlats(flats);
      } catch (error) {
        setNotification({ show: true, message: error.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchVisitors();
  }, [societyId, filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, ...(name === 'block' ? { floor: '', flat: '' } : name === 'floor' ? { flat: '' } : {}) }));
  };

  // Handle view visitor details
  const handleViewDetails = (visitor) => {
    setSelectedVisitor(visitor);
    setShowDetailPopup(true);
  };

  // Handle delete visitor
  const handleDelete = (visitor) => {
    setVisitorToDelete(visitor);
    setShowDeleteModal(true);
  };

  // Confirm delete visitor
  const confirmDelete = async () => {
    if (!visitorToDelete) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/VisitorApi/Delete-Visitor-Entry?visitorId=${visitorToDelete._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete visitor entry');
      setVisitors(prev => prev.filter(v => v._id !== visitorToDelete._id));
      setNotification({ show: true, message: 'Visitor entry deleted successfully', type: 'success' });
      setShowDeleteModal(false);
      setVisitorToDelete(null);
    } catch (error) {
      setNotification({ show: true, message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle image click
  const handleImageClick = (imageUrl, visitorName) => {
    setSelectedImage(imageUrl);
    setSelectedImageName(visitorName);
    setShowImageModal(true);
  };

  // Format date/time
  const formatDate = (date) => date ? new Date(date).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  // Group visitors by date for accordion rendering
  const grouped = groupVisitorsByDate(visitors);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b-4 border-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <User className="mr-3" size={32} />
              Visitor Entry Log
            </h1>
          </div>
        </div>
      </header>

      {/* Notification */}
      <Notification {...notification} />

      {/* Filters */}
      <div className="mx-auto py-4 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 mb-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Filter Visitors</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Block Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <Home className="h-4 w-4 mr-1 text-blue-600" />
                Block
              </label>
            <div className="relative">
              <select
                  name="block" 
                  value={filters.block} 
                  onChange={handleFilterChange} 
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-blue-400"
              >
                  <option value="">All Blocks</option>
                  {allBlocks.map(block => <option key={block} value={block}>Block {block}</option>)}
              </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
          </div>
            </div>
          </div>

            {/* Floor Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <svg className="h-4 w-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
                Floor
                    </label>
              <div className="relative">
                <select 
                  name="floor" 
                  value={filters.floor} 
                  onChange={handleFilterChange} 
                  disabled={!filters.block}
                  className={`w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-blue-400 ${!filters.block ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">All Floors</option>
                  {allFloors.map(floor => <option key={floor} value={floor}>Floor {floor}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

            {/* Flat Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <svg className="h-4 w-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                Flat
              </label>
              <div className="relative">
                <select 
                  name="flat" 
                  value={filters.flat} 
                  onChange={handleFilterChange} 
                  disabled={!filters.floor}
                  className={`w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-blue-400 ${!filters.floor ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">All Flats</option>
                  {allFlats.map(flat => <option key={flat} value={flat}>Flat {flat}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
          </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <svg className="h-4 w-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
                Status
              </label>
              <div className="relative">
                <select 
                  name="status" 
                  value={filters.status} 
                  onChange={handleFilterChange} 
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-blue-400"
                >
                  <option value="">All Status</option>
                  <option value="approve">✅ Approved</option>
                  <option value="reject">❌ Rejected</option>
                  <option value="pending">⏳ Pending</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
          </div>
        </div>
          </div>

            {/* From Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                From Date
              </label>
              <input
                type="date" 
                name="from" 
                value={filters.from} 
                onChange={handleFilterChange} 
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400"
              />
            </div>

            {/* To Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                To Date
              </label>
              <input
                type="date" 
                name="to" 
                value={filters.to} 
                onChange={handleFilterChange} 
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
                    <button
              onClick={() => setFilters({ block: '', floor: '', flat: '', status: '', from: '', to: '' })}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center text-sm font-medium"
                    >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
                    </button>
                  </div>
        </div>
      </div>

      {/* Main Content - Table */}
      <div className="mx-auto py-4 px-4">
        {loading ? (
          <PreloaderSociety />
                ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
            {/* Today group (always open) */}
            <div className="border-b">
              <button className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-t-lg font-semibold text-blue-800 text-lg focus:outline-none cursor-default" disabled>
                <span className="flex items-center"><Calendar className="mr-2 text-blue-600" size={20}/>Today</span>
                <span className="ml-2 text-xs bg-blue-200 text-blue-800 rounded-full px-2 py-0.5">{grouped.today.length}</span>
              </button>
              <div className="transition-all duration-300">
                {grouped.today.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner Mobile</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {grouped.today.map((v) => (
                        <tr key={v._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">{v.visitorName}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <img 
                              src={v.visitorImage || '/profile.png'} 
                              alt={v.visitorName} 
                              className="h-10 w-10 rounded-full object-cover border cursor-pointer hover:opacity-80 transition-opacity duration-200" 
                              onClick={() => handleImageClick(v.visitorImage || '/profile.png', v.visitorName)}
                              onError={e => {e.target.src = '/profile.png'}} 
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{v.visitorReason}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(v.entryTime)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(v.exitTime)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {v.status === 'approve' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Approved</span>}
                            {v.status === 'reject' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>}
                            {v.status === 'pending' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{v.blockName}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{v.floorNumber}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{v.flatNumber}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{v.ownerName}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{v.ownerMobile}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <button className="text-blue-600 hover:text-blue-900 mr-2" title="View Details" onClick={() => handleViewDetails(v)}><Eye size={18} /></button>
                            <button className="text-red-600 hover:text-red-900" title="Delete" onClick={() => handleDelete(v)}><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-6 text-gray-500">No visitors today.</div>
                )}
              </div>
            </div>
            {/* Other groups: yesterday, lastWeek, lastMonth, lastYear */}
            {[
              { key: 'yesterday', label: 'Yesterday', color: 'yellow', icon: <Calendar className="mr-2 text-yellow-600" size={20}/> },
              { key: 'lastWeek', label: 'Last Week', color: 'purple', icon: <Calendar className="mr-2 text-purple-600" size={20}/> },
              { key: 'lastMonth', label: 'Last Month', color: 'green', icon: <Calendar className="mr-2 text-green-600" size={20}/> },
              { key: 'lastYear', label: 'Last Year', color: 'gray', icon: <Calendar className="mr-2 text-gray-600" size={20}/> },
            ].map(group => (
              <div key={group.key} className="border-b">
                <button
                  className={`w-full flex items-center justify-between px-4 py-3 bg-${group.color}-50 hover:bg-${group.color}-100 font-semibold text-${group.color}-800 text-lg focus:outline-none transition-colors duration-200`}
                  onClick={() => setOpenGroup(openGroup === group.key ? '' : group.key)}
                >
                  <span className="flex items-center">{group.icon}{group.label}</span>
                  <span className="flex items-center">
                    <span className={`ml-2 text-xs bg-${group.color}-200 text-${group.color}-800 rounded-full px-2 py-0.5`}>{grouped[group.key].length}</span>
                    {openGroup === group.key ? <ChevronUp className="ml-2" size={18}/> : <ChevronDown className="ml-2" size={18}/>}
                  </span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${openGroup === group.key ? 'max-h-[2000px]' : 'max-h-0'}`}>
                  {openGroup === group.key && grouped[group.key].length > 0 && (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner Mobile</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {grouped[group.key].map((v) => (
                          <tr key={v._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">{v.visitorName}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <img 
                                src={v.visitorImage || '/profile.png'} 
                                alt={v.visitorName} 
                                className="h-10 w-10 rounded-full object-cover border cursor-pointer hover:opacity-80 transition-opacity duration-200" 
                                onClick={() => handleImageClick(v.visitorImage || '/profile.png', v.visitorName)}
                                onError={e => {e.target.src = '/profile.png'}} 
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">{v.visitorReason}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{formatDate(v.entryTime)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{formatDate(v.exitTime)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {v.status === 'approve' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Approved</span>}
                              {v.status === 'reject' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>}
                              {v.status === 'pending' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">{v.blockName}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{v.floorNumber}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{v.flatNumber}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{v.ownerName}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{v.ownerMobile}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <button className="text-blue-600 hover:text-blue-900 mr-2" title="View Details" onClick={() => handleViewDetails(v)}><Eye size={18} /></button>
                              <button className="text-red-600 hover:text-red-900" title="Delete" onClick={() => handleDelete(v)}><Trash2 size={18} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {openGroup === group.key && grouped[group.key].length === 0 && (
                    <div className="text-center py-6 text-gray-500">No visitors in this range.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visitor Detail Popup */}
      {showDetailPopup && selectedVisitor && (
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
                    <h2 className="text-lg font-semibold text-gray-900">Visitor Details</h2>
                    <p className="text-sm text-gray-500">View visitor information and entry details</p>
                  </div>
                </div>
                        <button
                  onClick={() => setShowDetailPopup(false)}
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
                           src={selectedVisitor.visitorImage || "/profile.png"}
                           alt={selectedVisitor.visitorName || 'Visitor'}
                           className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity duration-200"
                           onClick={() => handleImageClick(selectedVisitor.visitorImage || "/profile.png", selectedVisitor.visitorName)}
                           onError={(e) => {e.target.src = "/profile.png"}}
                         />
                         <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                           selectedVisitor.status === 'approve' ? 'bg-green-500' : 
                           selectedVisitor.status === 'reject' ? 'bg-red-500' : 'bg-yellow-500'
                         }`}>
                           {selectedVisitor.status === 'approve' ? <CheckCircle className="w-3 h-3 text-white" /> :
                            selectedVisitor.status === 'reject' ? <XCircle className="w-3 h-3 text-white" /> :
                            <Clock className="w-3 h-3 text-white" />}
                         </div>
                       </div>

                      {/* Basic Info */}
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-gray-900">{selectedVisitor.visitorName || 'N/A'}</h3>
                        <p className="text-sm text-gray-600">{selectedVisitor.visitorReason || 'N/A'}</p>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedVisitor.status === 'approve' ? 'bg-green-100 text-green-800' :
                          selectedVisitor.status === 'reject' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedVisitor.status === 'approve' ? '✅ Approved' :
                           selectedVisitor.status === 'reject' ? '❌ Rejected' :
                           '⏳ Pending'}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col w-full space-y-2">
                        <button
                          onClick={() => handleDelete(selectedVisitor)}
                          className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                          <Trash2 size={14} />
                          <span>Delete Entry</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Details */}
                <div className="col-span-12 lg:col-span-8 space-y-5">
                  
                  {/* Visit Details Card */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-base font-semibold text-gray-900 flex items-center">
                        <Clock className="h-4 w-4 text-gray-600 mr-2" />
                        Visit Details
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1">Entry Time</p>
                          <p className="text-sm font-semibold text-gray-900">{formatDate(selectedVisitor.entryTime)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1">Exit Time</p>
                          <p className="text-sm font-semibold text-gray-900">{formatDate(selectedVisitor.exitTime)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1">Purpose of Visit</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedVisitor.visitorReason || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1">Entry Date</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedVisitor.entryTime ? new Date(selectedVisitor.entryTime).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Details Card */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-base font-semibold text-gray-900 flex items-center">
                        <Home className="h-4 w-4 text-gray-600 mr-2" />
                        Location Details
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1">Block</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedVisitor.blockName || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1">Floor</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedVisitor.floorNumber || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1">Flat Number</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedVisitor.flatNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Owner Details Card */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-base font-semibold text-gray-900 flex items-center">
                        <User className="h-4 w-4 text-gray-600 mr-2" />
                        Owner Details
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                          <div className="p-1 bg-blue-100 rounded-md">
                            <User className="h-3 w-3 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Owner Name</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedVisitor.ownerName || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                          <div className="p-1 bg-green-100 rounded-md">
                            <Phone className="h-3 w-3 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Owner Mobile</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedVisitor.ownerMobile || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                          <div className="p-1 bg-red-100 rounded-md">
                            <Mail className="h-3 w-3 text-red-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Owner Email</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedVisitor.ownerEmail || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
              </div>
            )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && visitorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg max-w-md w-full">
            <div className="p-5">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Visitor Entry</h3>
                <p className="text-sm text-gray-600 mb-5">
                  Are you sure you want to delete the visitor entry for <span className="font-medium text-gray-900">"{visitorToDelete.visitorName}"</span>? 
                  This action cannot be undone.
                </p>
          </div>

              <div className="flex space-x-3">
            <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setVisitorToDelete(null);
                  }}
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

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
          <div className="relative flex items-center justify-center">
            <img
              src={selectedImage}
              alt={selectedImageName || 'Visitor'}
              className="w-[400px] h-[400px] object-cover rounded-full shadow-2xl"
              style={{ background: 'none', border: 'none' }}
              onError={(e) => {e.target.src = '/profile.png'}}
            />
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
                setSelectedImageName('');
              }}
              className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-80 text-white rounded-full p-2 transition-colors duration-200"
              style={{ transform: 'translate(50%, -50%)' }}
              aria-label="Close image preview"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}