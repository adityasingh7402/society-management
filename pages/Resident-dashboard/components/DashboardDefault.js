import Link from 'next/link';
import React, { useState } from 'react';

const DashboardDefault = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  return (
    <div className='bg-slate-100 relative'>
      {/* Floating Circle Button */}
      <button
        onClick={togglePopup}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>

      {/* Popup Container */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* Animated Container */}
          <div
            className="bg-gray-100 rounded-2xl p-6 w-11/12 max-w-2xl relative circle-to-container"
            style={{
              transformOrigin: 'bottom right', // Start animation from the bottom-right corner
            }}
          >
            {/* Close Button */}
            <button
              onClick={togglePopup}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 fade-in"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* 3x3 Grid of Functions */}
            <div className="grid grid-cols-3 gap-4 fade-in m-3">
              <Link href="/Resident-dashboard/components/Profile">
                <div className="flex flex-col items-center transition-colors cursor-pointer">
                  {/* Icon Container */}
                  <div className="flex items-center justify-center w-16 h-16 bg-white text-blue-900 text-3xl rounded-full mb-2">
                    👤
                  </div>
                  {/* Text Outside */}
                  <div className="text-sm font-medium text-center mt-2">Profile</div>
                </div>
              </Link>
              <div className="flex flex-col items-center transition-colors cursor-pointer">
                <div className="flex items-center justify-center w-16 h-16 bg-white text-blue-900 text-3xl rounded-full mb-2">
                  📋
                </div>
                <div className="text-sm font-medium text-center mt-2">Property</div>
              </div>
              <div className="flex flex-col items-center transition-colors cursor-pointer">
                <div className="flex items-center justify-center w-16 h-16 bg-white text-blue-900 text-3xl rounded-full mb-2">
                  📢
                </div>
                <div className="text-sm font-medium text-center mt-2">Notices</div>
              </div>
              <div className="flex flex-col items-center transition-colors cursor-pointer">
                <div className="flex items-center justify-center w-16 h-16 bg-white text-blue-900 text-3xl rounded-full mb-2">
                  🧑‍💼
                </div>
                <div className="text-sm font-medium text-center mt-2">Tenant</div>
              </div>
              <div className="flex flex-col items-center transition-colors cursor-pointer">
                <div className="flex items-center justify-center w-16 h-16 bg-white text-blue-900 text-3xl rounded-full mb-2">
                  🛠️
                </div>
                <div className="text-sm font-medium text-center mt-2">Maintenance</div>
              </div>
              <div className="flex flex-col items-center transition-colors cursor-pointer">
                <div className="flex items-center justify-center w-16 h-16 bg-white text-blue-900 text-3xl rounded-full mb-2">
                  📊
                </div>
                <div className="text-sm font-medium text-center mt-2">Polls</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Rest of the Dashboard Content */}
      <div className="bg-[#001a3d] text-white h-[27vh] py-8 px-6 sm:px-6 lg:px-8 flex items-center flex-col justify-center">
        <div className="flex flex-row items-center justify-between max-w-6xl mx-auto gap-8 mb-5">
          {/* Left Side - User Icon */}
          <div className="flex-shrink-0">
            <div className="w-28 h-28 rounded-full bg-blue-500 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-20 w-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="flex-1 w-full">
            <div className="space-y-4 text-center md:text-left flex justify-center items-start flex-col">
              <h1 className="text-4xl font-bold">Society</h1>
              <p className="text-sm sm:text-base text-left text-gray-300 max-w-xl">
                Connecting people and building communities through meaningful interactions and shared experiences.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-8 w-full">
          <Link
            href="/contact"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-full transition-all duration-300 transform hover:scale-105 text-center shadow-lg hover:shadow-xl"
          >
            Contact
          </Link>
          <Link
            href="/help"
            className="flex-1 bg-white text-black font-medium py-2 rounded-full transition-all duration-300 transform hover:scale-105 text-center shadow-lg hover:shadow-xl"
          >
            Help Desk
          </Link>
        </div>
      </div>

      {/* Rest of the Dashboard Sections */}
      <div className="p-6">
        {/* Profile Management */}
        <div className="mb-8 select-none">
          <h2 className="text-sm text-[#001a3d] font-semibold mb-4">Profile Management</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <Link href={'/Resident-dashboard/components/Profile'}>
              <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
                <div className="text-4xl mb-2">👤</div>
                <div className="text-sm font-medium text-center">Profile</div>
              </div>
            </Link>
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📄</div>
              <div className="text-sm font-medium text-center">Ownership</div>
            </div>
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🏠</div>
              <div className="text-sm font-medium text-center">House</div>
            </div>
          </div>
        </div>
        {/* Property Actions */}
        <div className="mb-8 select-none">
          <h2 className="text-sm text-[#001a3d] font-semibold mb-4">Property Actions</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📋</div>
              <div className="text-sm font-medium text-center">Sell Property</div>
            </div>
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📦</div>
              <div className="text-sm font-medium text-center">Sell Items</div>
            </div>
          </div>
        </div>

        {/* Tenant Details */}
        <div className="mb-8 select-none">
          <h2 className="text-sm text-[#001a3d] font-semibold mb-4">Tenant Details</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🧑‍💼</div>
              <div className="text-sm font-medium text-center">Tenant Info</div>
            </div>
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">✍️</div>
              <div className="text-sm font-medium text-center">Lease</div>
            </div>
          </div>
        </div>

        {/* Utility Bills */}
        <div className="mb-8 select-none">
          <h2 className="text-sm text-[#001a3d] font-semibold mb-4">Utility Bills</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">💡</div>
              <div className="text-sm font-medium text-center">Bills</div>
            </div>
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📑</div>
              <div className="text-sm font-medium text-center">History</div>
            </div>
          </div>
        </div>

        {/* Maintenance Tickets */}
        <div className="mb-8 select-none">
          <h2 className="text-sm text-[#001a3d] font-semibold mb-4">Maintenance Tickets</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🛠️</div>
              <div className="text-sm font-medium text-center">New Request</div>
            </div>
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-sm font-medium text-center">Track Request</div>
            </div>
          </div>
        </div>

        {/* Notices / Polls & Surveys */}
        <div className="mb-8 select-none">
          <h2 className="text-sm text-[#001a3d] font-semibold mb-4">Notices / Polls & Surveys</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📢</div>
              <div className="text-sm font-medium text-center">Announcements</div>
            </div>
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-sm font-medium text-center">Polls</div>
            </div>
          </div>
        </div>

        {/* Visitor Pre-Approvals */}
        <div className="mb-8 select-none">
          <h2 className="text-sm text-[#001a3d] font-semibold mb-4">Visitor Pre-Approvals</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🛂</div>
              <div className="text-sm font-medium text-center">Visitor Entry</div>
            </div>
          </div>
        </div>

        {/* Emergency Alerts */}
        <div className="mb-8 select-none">
          <h2 className="text-sm text-[#001a3d] font-semibold mb-4">Emergency Alerts</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
              <div className="text-4xl mb-2">🚨</div>
              <div className="text-sm font-medium text-center">Emergency</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDefault;
