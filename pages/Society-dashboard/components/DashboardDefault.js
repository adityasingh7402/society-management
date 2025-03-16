import React, { useState } from 'react';

export default function Dashboard() {
  // Sample society data
  const societyStats = {
    totalResidents: 450,
    totalFlats: 200,
    occupancyRate: 85,
    maintenanceCollection: 92,
    upcomingEvents: 3,
    activeComplaints: 15
  };

  // Sample announcements
  const announcements = [
    { id: 1, title: "Annual General Meeting", date: "2025-04-15", description: "Annual meeting to discuss society matters and elect new committee members." },
    { id: 2, title: "Diwali Celebration", date: "2025-10-20", description: "Society-wide Diwali celebration with cultural programs and activities." },
    { id: 3, title: "Maintenance Notice", date: "2025-03-25", description: "Water supply will be interrupted from 10:00 AM to 2:00 PM for maintenance." }
  ];

  // Sample utility usage
  const utilityData = [
    { month: "January", water: 85000, electricity: 12000 },
    { month: "February", water: 80000, electricity: 11500 },
    { month: "March", water: 82000, electricity: 11800 }
  ];

  // Sample wing wise flat occupancy
  const wingOccupancy = [
    { wing: "A Wing", totalFlats: 50, occupied: 45 },
    { wing: "B Wing", totalFlats: 50, occupied: 42 },
    { wing: "C Wing", totalFlats: 50, occupied: 40 },
    { wing: "D Wing", totalFlats: 50, occupied: 43 }
  ];

  // Sample recent activity
  const recentActivity = [
    { id: 1, activity: "New resident moved in", flatNo: "B-303", date: "2025-03-12" },
    { id: 2, activity: "Maintenance payment received", flatNo: "A-101", date: "2025-03-14" },
    { id: 3, activity: "Complaint resolved", flatNo: "C-205", date: "2025-03-15" },
    { id: 4, activity: "New parking allocated", flatNo: "D-404", date: "2025-03-16" },
    { id: 5, activity: "Guest approval request", flatNo: "B-107", date: "2025-03-16" }
  ];

  // Filter state for date range
  const [dateRange, setDateRange] = useState("month");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Society Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Filter */}
        <div className="flex justify-end mb-6">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setDateRange("week")}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                dateRange === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setDateRange("month")}
              className={`px-4 py-2 text-sm font-medium ${
                dateRange === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setDateRange("year")}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                dateRange === "year"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Residents */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Total Residents</h2>
            <p className="text-3xl font-bold text-blue-600">{societyStats.totalResidents}</p>
            <p className="text-sm text-gray-500 mt-2">Across {societyStats.totalFlats} flats</p>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Occupancy Rate</h2>
            <p className="text-3xl font-bold text-green-600">{societyStats.occupancyRate}%</p>
            <p className="text-sm text-gray-500 mt-2">Up 3% from last month</p>
          </div>

          {/* Maintenance Collection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Maintenance Collection</h2>
            <p className="text-3xl font-bold text-purple-600">{societyStats.maintenanceCollection}%</p>
            <p className="text-sm text-gray-500 mt-2">For current quarter</p>
          </div>
        </div>

        {/* Secondary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Active Complaints */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Active Complaints</h2>
            <p className="text-3xl font-bold text-red-600">{societyStats.activeComplaints}</p>
            <button className="mt-4 bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm font-medium">View Details</button>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Upcoming Events</h2>
            <p className="text-3xl font-bold text-amber-600">{societyStats.upcomingEvents}</p>
            <button className="mt-4 bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm font-medium">View Calendar</button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium">New Notice</button>
              <button className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium">Add Event</button>
              <button className="bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium">Raise Issue</button>
              <button className="bg-amber-600 text-white px-3 py-2 rounded-md text-sm font-medium">Book Amenity</button>
            </div>
          </div>
        </div>

        {/* Wing Occupancy */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Wing Occupancy Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {wingOccupancy.map((wing) => (
              <div key={wing.wing} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">{wing.wing}</h3>
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Occupied:</span>
                    <span>{wing.occupied}/{wing.totalFlats}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(wing.occupied / wing.totalFlats) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Layout for Announcements and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Announcements */}
          <div className="bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">Latest Announcements</h2>
            <div className="p-6">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="mb-6 last:mb-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">{announcement.date}</span>
                  </div>
                  <p className="mt-2 text-gray-600">{announcement.description}</p>
                </div>
              ))}
              <button className="mt-4 text-blue-600 hover:text-blue-800 font-medium">View All Announcements</button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">Recent Activity</h2>
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="px-6 py-4">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">{activity.activity}</p>
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Flat: {activity.flatNo}</p>
                  </li>
                ))}
              </ul>
              <div className="bg-gray-50 px-6 py-3">
                <button className="text-blue-600 hover:text-blue-800 font-medium">View All Activity</button>
              </div>
            </div>
          </div>
        </div>

        {/* Utility Usage */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Utility Usage (in Liters/kWh)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Water</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Electricity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {utilityData.map((data, index) => {
                  // Calculate change percentages
                  const waterChange = index > 0 
                    ? ((data.water - utilityData[index-1].water) / utilityData[index-1].water * 100).toFixed(1)
                    : null;
                  const electricityChange = index > 0 
                    ? ((data.electricity - utilityData[index-1].electricity) / utilityData[index-1].electricity * 100).toFixed(1)
                    : null;
                  
                  return (
                    <tr key={data.month}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.water.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {waterChange && (
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              parseFloat(waterChange) > 0
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {parseFloat(waterChange) > 0 ? `+${waterChange}%` : `${waterChange}%`}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.electricity.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {electricityChange && (
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              parseFloat(electricityChange) > 0
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {parseFloat(electricityChange) > 0 ? `+${electricityChange}%` : `${electricityChange}%`}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
);
}