// components/DashboardDefault.js
import Link from 'next/link';
import React from 'react';

const DashboardDefault = () => {
  return (
    <div>
      <div className="p-6">
        {/* Tenant Dashboard */}

        {/* Profile Management */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Profile Management</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <Link href={'/Tenant-dashboard/components/Profile'}>
              <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-4xl mb-2">👤</div>
                <div className="text-lg font-medium text-center">Update Personal Details</div>
              </div>
            </Link>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">✍️</div>
              <div className="text-lg font-medium text-center">View Lease Agreements</div>
            </div>
          </div>
        </div>

        {/* Tenant Actions */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Tenant Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🏡</div>
              <div className="text-lg font-medium text-center">Submit Move-In Request</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🚪</div>
              <div className="text-lg font-medium text-center">Submit Move-Out Request</div>
            </div>
          </div>
        </div>

        {/* Maintenance Tickets */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Maintenance Tickets</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🛠️</div>
              <div className="text-lg font-medium text-center">File New Maintenance Request</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-lg font-medium text-center">Track Maintenance Status</div>
            </div>
          </div>
        </div>

        {/* Notices */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Notices</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📢</div>
              <div className="text-lg font-medium text-center">View Announcements</div>
            </div>
          </div>
        </div>

        {/* Polls & Surveys */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Polls & Surveys</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-lg font-medium text-center">Participate in Polls</div>
            </div>
          </div>
        </div>

        {/* Delivery Notifications */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Delivery Notifications</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📦</div>
              <div className="text-lg font-medium text-center">Get Notified on Deliveries</div>
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
