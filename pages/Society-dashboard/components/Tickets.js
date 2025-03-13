import React, { useState } from 'react';

export default function Tickets() {
  // Sample ticket data
  const tickets = [
    { id: 1, resident: "Rahul Sharma", flatNo: "A-201", complaintType: "Plumbing", date: "2025-03-05", status: "Resolved" },
    { id: 2, resident: "Anita Patel", flatNo: "B-404", complaintType: "Electrical", date: "2025-03-10", status: "Pending" },
    { id: 3, resident: "Vikram Kumar", flatNo: "C-102", complaintType: "Carpentry", date: "2025-02-15", status: "Pending" },
    { id: 4, resident: "Priya Singh", flatNo: "A-305", complaintType: "Cleaning", date: "2025-03-07", status: "Resolved" },
    { id: 5, resident: "Suresh Gupta", flatNo: "B-202", complaintType: "Plumbing", date: "2025-02-15", status: "Pending" },
    { id: 6, resident: "Meera Joshi", flatNo: "D-101", complaintType: "Electrical", date: "2025-03-01", status: "Resolved" },
    { id: 7, resident: "Amit Verma", flatNo: "C-306", complaintType: "Carpentry", date: "2025-02-15", status: "Pending" },
    { id: 8, resident: "Sanjay Kapoor", flatNo: "A-108", complaintType: "Cleaning", date: "2025-03-09", status: "Resolved" }
  ];

  // State for filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterComplaintType, setFilterComplaintType] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  // Filtered tickets
  const filteredTickets = tickets.filter((ticket) => {
    return (
      (filterStatus === "all" || ticket.status.toLowerCase() === filterStatus) &&
      (filterComplaintType === "all" || ticket.complaintType === filterComplaintType) &&
      (filterDate === "" || ticket.date === filterDate)
    );
  });

  // Calculate totals
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter((ticket) => ticket.status === "Resolved").length;
  const pendingTickets = tickets.filter((ticket) => ticket.status === "Pending").length;

  // Breakdown by complaint type
  const complaintTypeBreakdown = tickets.reduce((acc, ticket) => {
    if (!acc[ticket.complaintType]) {
      acc[ticket.complaintType] = { total: 0, resolved: 0, pending: 0 };
    }
    acc[ticket.complaintType].total += 1;
    if (ticket.status === "Resolved") {
      acc[ticket.complaintType].resolved += 1;
    } else {
      acc[ticket.complaintType].pending += 1;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Complaints</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Tickets */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Total Tickets</h2>
            <p className="text-3xl font-bold text-blue-600">{totalTickets}</p>
          </div>

          {/* Resolved Tickets */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Resolved Tickets</h2>
            <p className="text-3xl font-bold text-green-600">{resolvedTickets}</p>
          </div>

          {/* Pending Tickets */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Pending Tickets</h2>
            <p className="text-3xl font-bold text-red-600">{pendingTickets}</p>
          </div>
        </div>

        {/* Complaint Type Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Complaint Type Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(complaintTypeBreakdown).map(([type, data]) => (
              <div key={type} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">{type}</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-gray-600">Total: {data.total}</p>
                  <p className="text-sm text-gray-600">Resolved: {data.resolved}</p>
                  <p className="text-sm text-gray-600">Pending: {data.pending}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

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
                <option value="resolved">Resolved</option>
                <option value="pending">Pending</option>
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
                <option value="Carpentry">Carpentry</option>
                <option value="Cleaning">Cleaning</option>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complaint Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.resident}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.flatNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.complaintType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          ticket.status === "Resolved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}