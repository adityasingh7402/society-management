// components/DashboardDefault.js
import Link from 'next/link';
import React from 'react';

const DashboardDefault = () => {
  return (
    <div>
      <div className="p-6">
        {/* Resident Owner Dashboard */}
        {/* <h1 className="text-6xl font-bold mb-6">Resident Owner Dashboard</h1> */}

        {/* Profile Management */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Profile Management</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <Link href={'/Resident-dashboard/components/Profile'}>
              <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-4xl mb-2">👤</div>
                <div className="text-lg font-medium text-center">Update Contact Details</div>
              </div>
            </Link>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📄</div>
              <div className="text-lg font-medium text-center">Ownership Information</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🏠</div>
              <div className="text-lg font-medium text-center">House Status</div>
            </div>
          </div>
        </div>

        {/* Property Actions */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Property Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📋</div>
              <div className="text-lg font-medium text-center">List Property for Sale</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📦</div>
              <div className="text-lg font-medium text-center">List Items for Sale</div>
            </div>
          </div>
        </div>

        {/* Tenant Details */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Tenant Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🧑‍💼</div>
              <div className="text-lg font-medium text-center">View Tenant Information</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">✍️</div>
              <div className="text-lg font-medium text-center">Manage Lease Agreements</div>
            </div>
          </div>
        </div>

        {/* Utility Bills */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Utility Bills</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">💡</div>
              <div className="text-lg font-medium text-center">View Pending Bills</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📑</div>
              <div className="text-lg font-medium text-center">Payment History</div>
            </div>
          </div>
        </div>

        {/* Maintenance Tickets */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Maintenance Tickets</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🛠️</div>
              <div className="text-lg font-medium text-center">File New Request</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-lg font-medium text-center">Track Ticket Status</div>
            </div>
          </div>
        </div>

        {/* Notices / Polls & Surveys */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Notices / Polls & Surveys</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📢</div>
              <div className="text-lg font-medium text-center">View Announcements</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-lg font-medium text-center">Participate in Polls</div>
            </div>
          </div>
        </div>

        {/* Visitor Pre-Approvals */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Visitor Pre-Approvals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🛂</div>
              <div className="text-lg font-medium text-center">Notify Security</div>
            </div>
          </div>
        </div>

        {/* Emergency Alerts */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Emergency Alerts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🚨</div>
              <div className="text-lg font-medium text-center">Emergency Alerts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDefault;
