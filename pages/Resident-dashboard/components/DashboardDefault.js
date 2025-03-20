import Link from 'next/link';
import React, { useState } from 'react';
import {
  UserCircle, Building2, Bell, Users, Wrench, PieChart, FileText, Home, ClipboardList, Package, Pencil, Lightbulb, History, Hammer, Search, Megaphone, BarChart, ShieldAlert, Siren
} from 'lucide-react';

const DashboardDefault = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };
  const menuItems = [
    { icon: UserCircle, label: 'Profile', href: '/Resident-dashboard/components/Profile' },
    { icon: Building2, label: 'Property', href: '/Resident-dashboard/components/SellProperty' },
    { icon: Bell, label: 'Notices', href: '/Resident-dashboard/components/Profile' },
    { icon: Users, label: 'Tenant', href: '/Resident-dashboard/components/TenantInfo' },
    { icon: Wrench, label: 'Maintenance', href: '/Resident-dashboard/components/Profile' },
    { icon: PieChart, label: 'Polls', href: '/Resident-dashboard/components/Profile' },
  ];
  const menuSections = [
    {
      title: 'Profile Management',
      items: [
        { icon: UserCircle, label: 'Profile', href: '/Resident-dashboard/components/Profile' },
        { icon: FileText, label: 'Ownership', href: '/Resident-dashboard/components/Ownership' },
        { icon: Home, label: 'House', href: '/Resident-dashboard/components/House' }
      ]
    },
    {
      title: 'Property Actions',
      items: [
        { icon: ClipboardList, label: 'Sell Property', href: '/Resident-dashboard/components/SellProperty' },
        { icon: Package, label: 'Sell Items', href: '/Resident-dashboard/components/SellItems' }
      ]
    },
    {
      title: 'Tenant Details',
      items: [
        { icon: Users, label: 'Tenant Info', href: '/Resident-dashboard/components/TenantInfo' },
        { icon: Pencil, label: 'Lease', href: '#' }
      ]
    },
    {
      title: 'Utility Bills',
      items: [
        { icon: Lightbulb, label: 'Bills', href: '#' },
        { icon: History, label: 'History', href: '#' }
      ]
    },
    {
      title: 'Maintenance Tickets',
      items: [
        { icon: Hammer, label: 'New Request', href: '#' },
        { icon: Search, label: 'Track Request', href: '#' }
      ]
    },
    {
      title: 'Notices / Polls & Surveys',
      items: [
        { icon: Megaphone, label: 'Announcements', href: '#' },
        { icon: BarChart, label: 'Polls', href: '#' }
      ]
    },
    {
      title: 'Visitor Pre-Approvals',
      items: [
        { icon: ShieldAlert, label: 'Visitor Entry', href: '#' }
      ]
    },
    {
      title: 'Emergency Alerts',
      items: [
        { icon: Siren, label: 'Emergency', href: '#' }
      ]
    }
  ];
  return (
    <div className='bg-slate-100 relative'>
      {/* Floating Circle Button */}
      <button
        onClick={togglePopup}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-10"
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
            className="bg-gray-100 rounded-2xl p-2 w-11/12 flex justify-center items-center max-w-2xl relative circle-to-container"
            style={{
              transformOrigin: 'center center',
            }}
          >
            {/* Close Button */}
            <button
              onClick={togglePopup}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 fade-in"
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
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-3xl">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {menuItems.map((item, index) => (
                  <a
                    key={index}
                    href={item.href || '#'}
                    className="group flex flex-col items-center p-3 rounded-xl transition-all duration-300 hover:bg-blue-50 hover:shadow-md"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl mb-2 transition-all duration-300 group-hover:bg-blue-100 group-hover:scale-110">
                      <item.icon size={32} strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300">
                      {item.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the Dashboard Content */}
      <div className="bg-[#001a3d] text-white min-h-max py-8 px-6 sm:px-6 lg:px-8 flex items-center flex-col justify-center">
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
            <div className="space-y-1 text-center md:text-left flex justify-center items-start flex-col">
              <h1 className="text-5xl font-bold">Society</h1>
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
        {menuSections.map((section, index) => (
          <div key={index} className="mb-8 select-none">
            <h2 className="text-sm text-[#001a3d] font-semibold mb-4">{section.title}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-2 gap-4">
              {section.items.map((item, i) => (
                <Link key={i} href={item.href} className="flex flex-col items-center justify-center p-5 bg-white border rounded-2xl shadow hover:shadow-md transition-shadow">
                  <div className='flex items-center justify-center w-14 h-14 bg-blue-50 text-blue-600 rounded-full mb-2 transition-all duration-300 group-hover:bg-blue-100 group-hover:scale-110'>
                    <item.icon className="w-10 h-10" />
                  </div>
                  <div className="text-sm font-medium text-center">{item.label}</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardDefault;
