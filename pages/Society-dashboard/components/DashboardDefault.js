// components/DashboardDefault.js
import React, { useEffect, useState } from 'react';

const DashboardDefault = () => {

  // useEffect(() => {
  //   const fetchDashboardData = async () => {
  //     try {
  //       const response = await fetch('/api/getDashboardData');
  //       if (!response.ok) throw new Error('Failed to fetch dashboard data');
  //       const data = await response.json();
  //       setDashboardData(data);
  //     } catch (error) {
  //       console.error('Error fetching dashboard data:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchDashboardData();
  // }, []);

  return (
    <div>
      <div className="p-6">
        {/* <h1 className="text-6xl font-bold mb-6">Society Management Dashboard</h1> */}

        {/* Resident Management & Property Management */}
        <div className="mb-10 select-none">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Resident Management & Property Management</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🏠</div>
              <div className="text-lg font-medium text-center">Owner Profiles</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">👨‍💼</div>
              <div className="text-lg font-medium text-center">Tenant Profiles</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🏡</div>
              <div className="text-lg font-medium text-center">Properties</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📋</div>
              <div className="text-lg font-medium text-center">Ownership Records</div>
            </div>
          </div>
        </div>

        {/* Finance Management & Maintenance Requests */}
        <div className="mb-10">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Finance Management & Maintenance Requests</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">💰</div>
              <div className="text-lg font-medium text-center">Maintenance Bills</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-lg font-medium text-center">Payment Tracking</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🛠️</div>
              <div className="text-lg font-medium text-center">Tickets</div>
            </div>
          </div>
        </div>

        {/* Notices & Community Features */}
        <div className="mb-10">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Notices & Community Features</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📢</div>
              <div className="text-lg font-medium text-center">Announcements</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-lg font-medium text-center">Polls & Surveys</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">💬</div>
              <div className="text-lg font-medium text-center">Discussion Forums</div>
            </div>
          </div>
        </div>

        {/* Security Management & Emergency Protocols */}
        <div className="mb-10">
          <h2 className="text-base text-blue-800 font-semibold mb-4">Security Management & Emergency Protocols</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">👮</div>
              <div className="text-lg font-medium text-center">Visitor Logs</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📦</div>
              <div className="text-lg font-medium text-center">Delivery Management</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🚨</div>
              <div className="text-lg font-medium text-center">Emergency Alerts</div>
            </div>
            <div className="flex flex-col items-center justify-center p-10 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📜</div>
              <div className="text-lg font-medium text-center">Incident Logs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDefault;
