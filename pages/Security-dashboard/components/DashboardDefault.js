import Link from 'next/link';
import React, { useState } from 'react';
import {
  UserCircle, ClipboardList, Bell, Users, Wrench, PieChart, FileText, Home, Package, 
  Pencil, Lightbulb, History, Hammer, Search, Megaphone, BarChart, ShieldAlert, Siren,
  QrCode
} from 'lucide-react';

const SecurityDashboardDefault = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };
 
  const menuItems = [
    { icon: UserCircle, label: 'Profile', href: '/Security-dashboard/components/Profile' },
    { icon: ClipboardList, label: 'Visitor Entry', href: '/Security-dashboard/components/VisitorEntry' },
    { icon: QrCode, label: 'QR Scanner', href: '/Security-dashboard/components/QRScanner' },
    { icon: Wrench, label: 'Approve/Visitor', href: '/Security-dashboard/components/ApproveVisitor' },
    { icon: Siren, label: 'Emergency', href: '/Security-dashboard/components/EmergencyAlerts' },
    { icon: Bell, label: 'Incident Log', href: '/Security-dashboard/components/IncidentLog' },
    { icon: PieChart, label: 'Delivery Log', href: '/Security-dashboard/components/DeliveryEntry' },
  ];

  const menuSections = [
    {
      title: 'Profile Management',
      items: [
        { icon: UserCircle, label: 'Profile', href: '/Security-dashboard/components/Profile' },
        { icon: FileText, label: 'Change Picture', href: '/Security-dashboard/components/ChangeProfilePicture' },
      ]
    },
    {
      title: 'Visitor Management',
      items: [
        { icon: ClipboardList, label: 'Visitor Entry', href: '/Security-dashboard/components/VisitorEntry' },
        { icon: QrCode, label: 'QR Scanner', href: '/Security-dashboard/components/QRScanner' },
        { icon: Users, label: 'Approve/Reject', href: '/Security-dashboard/components/ApproveVisitor' },
        { icon: History, label: 'Visitor Log', href: '/Security-dashboard/components/VisitorLog' },
      ]
    },
    {
      title: 'Delivery Management',
      items: [
        { icon: Package, label: 'Record Deliveries', href: '/Security-dashboard/components/DeliveryEntry' },
        { icon: Bell, label: 'Notify Residents', href: '/Security-dashboard/components/NotifyResidents' },
      ]
    },
    {
      title: 'Incident Reporting',
      items: [
        { icon: Hammer, label: 'Log Incidents', href: '/Security-dashboard/components/IncidentLog' },
        { icon: Search, label: 'Incident History', href: '/Security-dashboard/components/IncidentHistory' },
      ]
    },
    {
      title: 'Emergency Alerts',
      items: [
        { icon: Siren, label: 'Receive Alerts', href: '/Security-dashboard/components/EmergencyAlerts' },
        { icon: Megaphone, label: 'Broadcast Alerts', href: '/Security-dashboard/components/BroadcastAlerts' },
      ]
    }
  ];

  return (
    <div className='bg-slate-100 relative'>
      {/* Floating Circle Button */}
      <button
        onClick={togglePopup}
        className="fixed bottom-8 right-8 w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-10"
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
                  <Link
                    key={index}
                    href={item.href || '#'}
                    className="group flex flex-col items-center p-3 rounded-xl transition-all duration-300 hover:bg-green-50 hover:shadow-md"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-green-50 text-green-600 rounded-2xl mb-2 transition-all duration-300 group-hover:bg-green-100 group-hover:scale-110">
                      <item.icon size={32} strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors duration-300">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the Dashboard Content */}
      <div className="bg-[#003d1a] text-white min-h-max py-8 px-6 sm:px-6 lg:px-8 flex items-center flex-col justify-center">
        <div className="flex flex-row items-center justify-between max-w-6xl mx-auto gap-8 mb-5">
          {/* Left Side - User Icon */}
          <div className="flex-shrink-0">
            <div className="w-28 h-28 rounded-full bg-green-500 flex items-center justify-center">
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
              <h1 className="text-5xl font-bold">Security</h1>
              <p className="text-sm sm:text-base text-left text-gray-300 max-w-xl">
                Ensuring safety and security through vigilant monitoring and quick response.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-8 w-full">
          <Link
            href="/contact"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-full transition-all duration-300 transform hover:scale-105 text-center shadow-lg hover:shadow-xl"
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
      <div className="p-4 sm:p-6">
        {menuSections.map((section, sIndex) => (
          <div key={sIndex} className="mb-6 select-none">
            <h2 className="text-sm text-[#003d1a] font-semibold mb-3">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {section.items.map((item, i) => (
                <div key={i} className="hover:shadow-md transition-shadow duration-200">
                  <Link href={item.href} className="flex flex-col items-center justify-center p-4 bg-white border rounded-2xl shadow h-full hover:bg-green-50">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-50 text-green-600 rounded-full mb-2">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-center mt-1">{item.label}</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityDashboardDefault;