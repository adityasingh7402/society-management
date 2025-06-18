import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, Building, Ticket } from 'lucide-react';
import PreloaderSociety from '../../components/PreloaderSociety';

export default function Tickets() {
  // State for tickets and loading
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterComplaintType, setFilterComplaintType] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [societyId, setSocietyId] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // Get society details
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();
      const societyIdFromData = societyData.societyId;
      setSocietyId(societyIdFromData);

      // Now fetch tickets with the society ID
      const response = await fetch(`/api/Maintenance-Api/get-society-tickets?societyId=${societyIdFromData}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();
      setTickets(data.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const token = localStorage.getItem('Society');

      const response = await fetch(`/api/Maintenance-Api/update-ticket?id=${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          isAdmin: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }

      const data = await response.json();

      // Update the ticket in the state
      setTickets(tickets.map(ticket =>
        ticket._id === ticketId ? data.data : ticket
      ));

      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error(error.message || 'Failed to update ticket status');
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((ticket) => {
    return (
      (filterStatus === "all" || ticket.status.toLowerCase() === filterStatus.toLowerCase()) &&
      (filterComplaintType === "all" || ticket.category === filterComplaintType) &&
      (filterDate === "" || new Date(ticket.createdAt).toISOString().split('T')[0] === filterDate)
    );
  });

  // Calculate totals
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter((ticket) => ticket.status === "Completed").length;
  const pendingTickets = tickets.filter((ticket) => ticket.status === "Pending").length;
  const inProgressTickets = tickets.filter((ticket) =>
    ["Approved", "Assigned", "In Progress"].includes(ticket.status)
  ).length;

  // Breakdown by complaint type
  const complaintTypeBreakdown = tickets.reduce((acc, ticket) => {
    if (!acc[ticket.category]) {
      acc[ticket.category] = { total: 0, resolved: 0, pending: 0, inProgress: 0 };
    }
    acc[ticket.category].total += 1;

    if (ticket.status === "Completed") {
      acc[ticket.category].resolved += 1;
    } else if (ticket.status === "Pending") {
      acc[ticket.category].pending += 1;
    } else {
      acc[ticket.category].inProgress += 1;
    }

    return acc;
  }, {});

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Add this state for active tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Add this state for expandable sections
  const [expandedSection, setExpandedSection] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <Ticket className="mr-3" size={32} />
              Maintenance Tickets
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'dashboard'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'tickets'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('tickets')}
          >
            All Tickets
          </button>
          {/* <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'analytics'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button> */}
        </div>

        {isLoading ? (
          <PreloaderSociety />
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  {/* Total Tickets */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Total Tickets</h2>
                    <p className="text-3xl font-bold text-blue-600">{totalTickets}</p>
                  </div>

                  {/* Resolved Tickets */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Completed</h2>
                    <p className="text-3xl font-bold text-green-600">{resolvedTickets}</p>
                  </div>

                  {/* In Progress Tickets */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">In Progress</h2>
                    <p className="text-3xl font-bold text-blue-600">{inProgressTickets}</p>
                  </div>

                  {/* Pending Tickets */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Pending</h2>
                    <p className="text-3xl font-bold text-red-600">{pendingTickets}</p>
                  </div>
                </div>

                {/* Complaint Type Breakdown */}
                {/* <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Complaint Type Breakdown</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(complaintTypeBreakdown).map(([type, data]) => (
                      <div key={type} className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{type}</h3>
                          <span className="text-2xl font-bold text-blue-600">{data.total}</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-green-600 font-medium">Completed</span>
                              <span className="text-green-600 font-medium">{data.resolved}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(data.resolved / data.total) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-blue-600 font-medium">In Progress</span>
                              <span className="text-blue-600 font-medium">{data.inProgress}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(data.inProgress / data.total) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-red-600 font-medium">Pending</span>
                              <span className="text-red-600 font-medium">{data.pending}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(data.pending / data.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div> */}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Filters</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="all">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Complaint Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Complaint Type</label>
                      <select
                        value={filterComplaintType}
                        onChange={(e) => setFilterComplaintType(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="all">All</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Structural">Structural</option>
                        <option value="Appliance">Appliance</option>
                        <option value="Heating/Cooling">Heating/Cooling</option>
                        <option value="Pest Control">Pest Control</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Date Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Tickets Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">All Tickets</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat No.</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTickets.length > 0 ? (
                          filteredTickets.map((ticket) => (
                            <tr key={ticket._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.residentName || "Resident"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.flatNumber}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{ticket.title}</td>
                              <td className="px-6 py-4">
                                {ticket.images && ticket.images.length > 0 ? (
                                  <div className="flex space-x-2">
                                    {ticket.images.map((url, index) => (
                                      <img
                                        key={index}
                                        src={url}
                                        alt={`Ticket ${index + 1}`}
                                        className="h-16 w-16 object-cover rounded-md cursor-pointer hover:opacity-75 transition-opacity"
                                        onClick={() => window.open(url, '_blank')}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">No images</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.category}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(ticket.createdAt)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.status === "Completed"
                                    ? "bg-green-100 text-green-800"
                                    : ticket.status === "Pending"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-blue-100 text-blue-800"
                                    }`}
                                >
                                  {ticket.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleStatusChange(ticket._id, e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                  <option value="">Change Status</option>
                                  <option value="Approved">Approve</option>
                                  <option value="Assigned">Assign</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Complete</option>
                                  <option value="Rejected">Reject</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                              No tickets found matching the current filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Tickets Tab */}
            {activeTab === 'tickets' && (
              <>
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Filters</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="all">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Complaint Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Complaint Type</label>
                      <select
                        value={filterComplaintType}
                        onChange={(e) => setFilterComplaintType(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="all">All</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Structural">Structural</option>
                        <option value="Appliance">Appliance</option>
                        <option value="Heating/Cooling">Heating/Cooling</option>
                        <option value="Pest Control">Pest Control</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Date Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Tickets Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">All Tickets</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat No.</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTickets.length > 0 ? (
                          filteredTickets.map((ticket) => (
                            <tr key={ticket._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.residentName || "Resident"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.flatNumber}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{ticket.title}</td>
                              <td className="px-6 py-4">
                                {ticket.images && ticket.images.length > 0 ? (
                                  <div className="flex space-x-2">
                                    {ticket.images.map((url, index) => (
                                      <img
                                        key={index}
                                        src={url}
                                        alt={`Ticket ${index + 1}`}
                                        className="h-16 w-16 object-cover rounded-md cursor-pointer hover:opacity-75 transition-opacity"
                                        onClick={() => window.open(url, '_blank')}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">No images</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.category}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(ticket.createdAt)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.status === "Completed"
                                    ? "bg-green-100 text-green-800"
                                    : ticket.status === "Pending"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-blue-100 text-blue-800"
                                    }`}
                                >
                                  {ticket.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleStatusChange(ticket._id, e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                  <option value="">Change Status</option>
                                  <option value="Approved">Approve</option>
                                  <option value="Assigned">Assign</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Complete</option>
                                  <option value="Rejected">Reject</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                              No tickets found matching the current filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Analytics Tab */}
            {/* {activeTab === 'analytics' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Ticket Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Resolution Time</h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Category Distribution</h3>
                  </div>
                </div>
              </div>
            )} */}
          </>
        )}
      </main>
    </div>
  );
}