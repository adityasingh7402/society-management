// components/DashboardDefault.js
import Link from 'next/link';
import React from 'react';

const DashboardDefault = () => {
  return (
    <div>
      <div className="p-6">
        {/* Security Dashboard */}

        {/* Profile Management */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Profile Management</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <Link href={'/Security-dashboard/components/Profile'}>
              <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-4xl mb-2">👤</div>
                <div className="text-lg font-medium text-center">Update Personal Details</div>
              </div>
            </Link>
            <Link href={'/Security-dashboard/components/ChangeProfilePicture'}>
              <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-4xl mb-2">🖼️</div>
                <div className="text-lg font-medium text-center">Change Profile Picture</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Visitor Management */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Visitor Management</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <Link href={'/Security-dashboard/components/VisitorLog'}>
              <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-4xl mb-2">📝</div>
                <div className="text-lg font-medium text-center">Log Visitors</div>
              </div>
            </Link>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">✔️</div>
              <div className="text-lg font-medium text-center">Approve/Reject Visitor Access</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📜</div>
              <div className="text-lg font-medium text-center">View Visitor History</div>
            </div>
          </div>
        </div>

        {/* Delivery Management */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Delivery Management</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <Link href={'/Security-dashboard/components/DeliveryLog'}>
              <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-4xl mb-2">📦</div>
                <div className="text-lg font-medium text-center">Record Deliveries</div>
              </div>
            </Link>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🔔</div>
              <div className="text-lg font-medium text-center">Notify Residents</div>
            </div>
          </div>
        </div>

        {/* Incident Reporting */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Incident Reporting</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <Link href={'/Security-dashboard/components/IncidentLog'}>
              <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-4xl mb-2">⚠️</div>
                <div className="text-lg font-medium text-center">Log Incidents</div>
              </div>
            </Link>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📂</div>
              <div className="text-lg font-medium text-center">View Incident History</div>
            </div>
          </div>
        </div>

        {/* Emergency Alerts */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Emergency Alerts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🚨</div>
              <div className="text-lg font-medium text-center">Receive Emergency Notifications</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📢</div>
              <div className="text-lg font-medium text-center">Broadcast Alerts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDefault;
