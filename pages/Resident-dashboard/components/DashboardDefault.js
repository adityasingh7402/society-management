import React, { useState } from 'react';
import Link from 'next/link';
import { 
  UserCircle, Bell, MessageCircleMore, ShoppingCart, Siren, 
  Wrench, PieChart, FileText, Home, ClipboardList, Package,
  Users, Pencil, Lightbulb, History, Hammer, Search,
  Megaphone, BarChart, ShieldAlert, Plus, X, ChevronRight
} from 'lucide-react';

const AndroidDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [fabOpen, setFabOpen] = useState(false);
  const [categoryPopup, setCategoryPopup] = useState(null);
  const [isClosingPopup, setIsClosingPopup] = useState(false);
  const [isOpeningPopup, setIsOpeningPopup] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Bottom navigation items
  const bottomNavItems = [
    { id: 'home', icon: Home, label: 'Home', href: '/Resident-dashboard/components/Profile' },
    { id: 'profile', icon: UserCircle, label: 'Profile', href: '/Resident-dashboard/components/Emergency' },
    { id: 'chat', icon: MessageCircleMore, label: 'Chat', href: '/Resident-dashboard/components/Emergency' },
    { id: 'notifications', icon: Bell, label: 'Alerts', href: '/Resident-dashboard/components/Emergency' },
  ];

  // Society slider data
  const sliderData = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80',
      title: 'Welcome to Paradise Heights',
      subtitle: 'Modern living at its finest',
      description: 'Experience luxury and comfort in our premium residential community'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: 'Community Amenities',
      subtitle: 'Everything you need',
      description: 'Swimming pool, gym, playground, and 24/7 security for your peace of mind'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: 'Green Spaces',
      subtitle: 'Nature within reach',
      description: 'Beautiful landscaped gardens and parks for a serene living experience'
    }
  ];

  // Auto-slide functionality
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [sliderData.length]);

  // Quick action items for FAB
  const quickActions = [
    { icon: Siren, label: 'Emergency', color: 'bg-red-500', href: '/Resident-dashboard/components/Emergency' },
    { icon: Wrench, label: 'Maintenance', color: 'bg-orange-500', href: '/Resident-dashboard/components/Maintenance' },
    { icon: ShoppingCart, label: 'Marketplace', color: 'bg-green-500', href: '/Resident-dashboard/components/Marketplace' },
    { icon: PieChart, label: 'Polls', color: 'bg-purple-500', href: '/Resident-dashboard/components/Polls' },
  ];

  // Popup handlers with proper open and close animations
  const handleClosePopup = () => {
    setIsClosingPopup(true);
    setTimeout(() => {
      setCategoryPopup(null);
      setIsClosingPopup(false);
      setIsOpeningPopup(false);
    }, 300); // Match animation duration
  };

  const handleOpenPopup = (category) => {
    setCategoryPopup(category);
    setIsClosingPopup(false);
    setIsOpeningPopup(true);
    // Reset opening state after animation completes
    setTimeout(() => {
      setIsOpeningPopup(false);
    }, 300);
  };

  // New function to handle link clicks within popup
  const handlePopupLinkClick = () => {
    // Immediately close the popup when any link is clicked
    setCategoryPopup(null);
    setIsClosingPopup(false);
    setIsOpeningPopup(false);
  };

  const featureCategories = [
    {
      id: 'property',
      title: 'Property',
      icon: Home,
      color: 'bg-blue-500',
      items: [
        { icon: FileText, label: 'Ownership', href: '/Resident-dashboard/components/Ownership' },
        { icon: Home, label: 'House Details', href: '/Resident-dashboard/components/House' },
        { icon: ClipboardList, label: 'Sell Property', href: '/Resident-dashboard/components/SellProperty' },
        { icon: Package, label: 'Sell Items', href: '/Resident-dashboard/components/SellItems' }
      ]
    },
    {
      id: 'services',
      title: 'Services',
      icon: Wrench,
      color: 'bg-orange-500',
      items: [
        { icon: Hammer, label: 'New Request', href: '/Resident-dashboard/components/NewRequest' },
        { icon: Search, label: 'Track Request', href: '/Resident-dashboard/components/TrackRequest' },
        { icon: Lightbulb, label: 'Utility Bills', href: '/Resident-dashboard/components/Bills' },
        { icon: History, label: 'Bill History', href: '/Resident-dashboard/components/MaintenanceBills' }
      ]
    },
    {
      id: 'community',
      title: 'Community',
      icon: Users,
      color: 'bg-green-500',
      items: [
        { icon: MessageCircleMore, label: 'Resident Chat', href: '/Resident-dashboard/components/ResidentChat' },
        { icon: Megaphone, label: 'Announcements', href: '/Resident-dashboard/components/Announcements' },
        { icon: BarChart, label: 'Polls & Surveys', href: '/Resident-dashboard/components/PollsSurveys' },
        { icon: ShieldAlert, label: 'Visitor Entry', href: '/Resident-dashboard/components/VisitorEntry' }
      ]
    },
    {
      id: 'tenant',
      title: 'Tenant',
      icon: Users,
      color: 'bg-purple-500',
      items: [
        { icon: Users, label: 'Tenant Info', href: '/Resident-dashboard/components/TenantInfo' },
        { icon: Pencil, label: 'Lease Details', href: '/Resident-dashboard/components/Lease' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header with Image Slider */}
      <div className="relative h-64 overflow-hidden">
        {/* Image Slider */}
        <div 
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {sliderData.map((slide) => (
            <div key={slide.id} className="w-full h-full flex-shrink-0 relative">
              <img 
                src={slide.image} 
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/60 to-transparent"></div>
              
              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-12">
                {/* Bottom Content */}
                <div className="space-y-3 mt-auto">
                  <div>
                    <h1 className="text-white text-xl font-bold">{slide.title}</h1>
                    <p className="text-white/90 text-sm font-medium">{slide.subtitle}</p>
                    <p className="text-white/80 text-xs mt-1">{slide.description}</p>
                  </div>
                  
                  {/* Buttons */}
                  <div className="flex space-x-3">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      Contact
                    </button>
                    <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      About
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {sliderData.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white w-6' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Manual Navigation Arrows */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + sliderData.length) % sliderData.length)}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          ‹
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % sliderData.length)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Due Bills</p>
                <p className="text-xl font-bold text-gray-900">₹2,450</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Requests</p>
                <p className="text-xl font-bold text-gray-900">3</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Wrench className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Categories */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Services</h2>
          {featureCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl shadow-sm">
              <button
                onClick={() => handleOpenPopup(category)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">{category.title}</h3>
                    <p className="text-sm text-gray-600">{category.items.length} services</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button with Animated Quick Actions */}
      <div className="fixed bottom-24 right-6">
        {/* Quick Actions Menu - Now with smooth animations */}
        <div className={`absolute bottom-16 right-0 space-y-3 transition-all duration-300 ease-out transform origin-bottom-right ${
          fabOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
        }`}>
          {quickActions.map((action, index) => (
            <div 
              key={index} 
              className={`flex items-center space-x-3 transition-all duration-300 ease-out transform ${
                fabOpen 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 translate-x-8'
              }`}
              style={{ 
                transitionDelay: fabOpen ? `${index * 50}ms` : '0ms' 
              }}
            >
              <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap shadow-lg">
                {action.label}
              </span>
              <Link href={action.href} passHref>
                <div 
                  className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center shadow-lg transform transition-all duration-200 hover:scale-110 active:scale-95`}
                  onClick={() => setFabOpen(false)} // Close FAB when quick action is clicked
                >
                  <action.icon className="w-6 h-6 text-white" />
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Main FAB Button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 active:scale-95 ${
            fabOpen ? 'rotate-45 bg-gray-600 scale-110' : 'hover:scale-110 hover:bg-blue-600'
          }`}
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => (
            <Link key={item.id} href={item.href} passHref>
              <div
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Category Popup - With proper open and close animations */}
      {categoryPopup && (
        <div className={`fixed inset-0 bg-black z-50 flex items-end transition-all duration-300 ${
          isClosingPopup ? 'bg-opacity-0' : 
          isOpeningPopup ? 'bg-opacity-0' : 'bg-opacity-50'
        }`}>
          <div className={`bg-white w-full rounded-t-3xl max-h-96 overflow-hidden transition-transform duration-300 ease-out ${
            isClosingPopup ? 'translate-y-full' : 
            isOpeningPopup ? 'translate-y-full' : 'translate-y-0'
          }`}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${categoryPopup.color} rounded-xl flex items-center justify-center`}>
                    <categoryPopup.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{categoryPopup.title}</h3>
                </div>
                <button
                  onClick={handleClosePopup}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors active:scale-95"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {categoryPopup.items.map((item, index) => (
                  <Link key={index} href={item.href} passHref>
                    <div
                      className={`flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 active:scale-95 ${
                        isClosingPopup ? 'animate-fade-out-down' : 
                        isOpeningPopup ? 'animate-fade-in-up-delayed' : 'animate-fade-in-up-delayed'
                      }`}
                      style={{ 
                        animationDelay: isClosingPopup ? '0ms' : `${index * 50}ms`,
                        animationFillMode: 'forwards'
                      }}
                      onClick={handlePopupLinkClick} // Close popup immediately when clicked
                    >
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                        <item.icon className="w-6 h-6 text-gray-700" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 text-center">{item.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up-delayed {
          0% { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes fade-out-down {
          from { 
            opacity: 1; 
            transform: translateY(0); 
          }
          to { 
            opacity: 0; 
            transform: translateY(20px); 
          }
        }
        
        .animate-fade-in-up-delayed {
          animation: fade-in-up-delayed 0.1s ease-out;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        
        .animate-fade-out-down {
          animation: fade-out-down 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AndroidDashboard;