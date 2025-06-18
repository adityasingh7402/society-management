import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  UserCircle, Bell, MessageCircleMore, ShoppingCart, Siren, 
  Wrench, PieChart, FileText, Home, ClipboardList, Package,
  Users, Pencil, Lightbulb, History, Hammer, Search,
  Megaphone, BarChart, ShieldAlert, Plus, X, ChevronRight, FolderCheck,
  Building, Trees, Sun, Cloud, Leaf, Bird, Flower2, CloudSun, ShieldCheck, Waves,Headphones, Palmtree, AlertTriangle
} from 'lucide-react';

const AndroidDashboard = ({ onLoaded }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [fabOpen, setFabOpen] = useState(false);
  const [categoryPopup, setCategoryPopup] = useState(null);
  const [isClosingPopup, setIsClosingPopup] = useState(false);
  const [isOpeningPopup, setIsOpeningPopup] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imagesLoadedCount, setImagesLoadedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const sliderRef = useRef(null);

  // Bottom navigation items
  const bottomNavItems = [
    { id: 'home', icon: Home, label: 'Home', href: '/Resident-dashboard' },
    { id: 'profile', icon: UserCircle, label: 'Profile', href: '/Resident-dashboard/components/Profile' },
    { id: 'chat', icon: MessageCircleMore, label: 'Chat', href: '/Resident-dashboard/Community' },
    { id: 'notifications', icon: Bell, label: 'Alerts', href: '/Resident-dashboard/components/Emergency' },
  ];

  // Society slider data
  const sliderData = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80',
      title: 'Welcome to Paradise',
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

  // Preload images
  useEffect(() => {
    // Notify parent component that we're loaded after a short delay
    // This ensures the skeleton loader is shown for at least a short time
    const timer = setTimeout(() => {
      setImagesLoaded(true);
      if (onLoaded) {
        onLoaded();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [onLoaded]);

  // Auto-slide functionality
  useEffect(() => {
    if (!imagesLoaded) return; // Only start auto-slide when images are loaded
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [sliderData.length, imagesLoaded]);

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
        id: 'home',
        title: 'Property',
        icon: Home,
        color: 'bg-blue-500',
        items: [
            { icon: Home, label: 'My House Details', href: '/Resident-dashboard/components/House' },
            { icon: FileText, label: 'Ownership Details', href: '/Resident-dashboard/components/Ownership' },
            { icon: ClipboardList, label: 'Property Market', href: '/Resident-dashboard/components/PropertyMarketplace' },
            { icon: Package, label: 'Buy/Sell Items', href: '/Resident-dashboard/components/Marketplace' }
        ]
    },
    {
        id: 'bills',
        title: 'Bills',
        icon: FileText,
        color: 'bg-green-500',
        items: [
            { icon: Lightbulb, label: 'Utility Bills', href: '/Resident-dashboard/components/Bills' },
            { icon: History, label: 'Maintenance', href: '/Resident-dashboard/components/MaintenanceBills' },
            { icon: History, label: 'History', href: '/Resident-dashboard/components/History' }
        ]
    },
    {
        id: 'maintenance',
        title: 'Services',
        icon: Wrench,
        color: 'bg-orange-500',
        items: [
            { icon: Hammer, label: 'New Request', href: '/Resident-dashboard/components/NewRequest' },
            { icon: Search, label: 'Track Requests', href: '/Resident-dashboard/components/TrackRequest' },
            { icon: AlertTriangle, label: 'Emergency', href: '/Resident-dashboard/components/Emergency' }
        ]
    },
    {
        id: 'community',
        title: 'Community',
        icon: Users,
        color: 'bg-purple-500',
        items: [
            { icon: Megaphone, label: 'Announcements', href: '/Resident-dashboard/components/Announcements' },
            { icon: BarChart, label: 'Polls', href: '/Resident-dashboard/components/PollsSurveys' },
            { icon: MessageCircleMore, label: 'Resident Chat', href: '/Resident-dashboard/components/ResidentChat' },
            { icon: Users, label: 'Society Chat', href: '/Resident-dashboard/components/SocietyChat' }
        ]
    },
    {
        id: 'security',
        title: 'Security',
        icon: ShieldCheck,
        color: 'bg-red-500',
        items: [
            { icon: ShieldAlert, label: 'Visitors', href: '/Resident-dashboard/components/VisitorEntry' },
            { icon: AlertTriangle, label: 'Emergency', href: '/Resident-dashboard/components/Emergency' }
        ]
    },
    {
        id: 'support',
        title: 'Support',
        icon: Headphones,
        color: 'bg-cyan-500',
        items: [
            { icon: Headphones, label: 'Help Desk', href: '/Resident-dashboard/components/HelpDesk' },
            { icon: MessageCircleMore, label: 'Chat Support', href: '/Resident-dashboard/components/SocietyChat' }
        ]
    }
];

  const handleDragStart = (e) => {
    setIsDragging(true);
    const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
    setStartX(pageX - sliderRef.current.offsetLeft);
    setScrollLeft(currentSlide);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
    const walk = (pageX - sliderRef.current.offsetLeft - startX) * 2;
    const slideMove = Math.round(walk / sliderRef.current.offsetWidth);
    
    let newSlide = scrollLeft - slideMove;
    newSlide = Math.max(0, Math.min(newSlide, sliderData.length - 1));
    setCurrentSlide(newSlide);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-100 to-purple-50 pb-20 relative isolate">
      {/* Decorative Background Icons - with reduced size and opacity */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <Building className="absolute top-[15%] left-[10%] w-20 h-20 text-indigo-600/5 transform rotate-12 float-animation" />
        <Trees className="absolute top-[35%] right-[8%] w-24 h-24 text-purple-600/5 transform -rotate-6 float-animation-reverse" />
        <Waves className="absolute bottom-[25%] left-[5%] w-32 h-32 text-indigo-600/5 transform rotate-12 float-animation-slow" />
        <Sun className="absolute top-[45%] left-[25%] w-16 h-16 text-purple-600/5 transform rotate-45 float-animation" />
        <Cloud className="absolute top-[10%] right-[25%] w-20 h-20 text-indigo-600/5 transform -rotate-12 float-animation-reverse" />
        <Leaf className="absolute bottom-[40%] right-[15%] w-16 h-16 text-purple-600/5 transform rotate-12 float-animation" />
        <Palmtree className="absolute bottom-[15%] right-[10%] w-24 h-24 text-indigo-600/5 transform -rotate-6 float-animation-slow" />
        <ShieldCheck className="absolute top-[60%] left-[15%] w-20 h-20 text-purple-600/5 transform rotate-12 float-animation-reverse" />
        <CloudSun className="absolute bottom-[10%] left-[20%] w-16 h-16 text-indigo-600/5 transform -rotate-12 float-animation" />
      </div>
      
      {/* Header with Image Slider */}
      <div className="relative m-1 rounded-3xl h-52 overflow-hidden">
        {/* Image Slider */}
        <div 
          ref={sliderRef}
          className={`flex transition-transform duration-500 ease-in-out h-full cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {sliderData.map((slide) => (
            <div key={slide.id} className="w-full h-full flex-shrink-0 relative select-none">
              <img 
                src={slide.image} 
                alt={slide.title}
                className="w-full h-full object-cover"
                draggable="false"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>
          ))}
        </div>

        {/* Slide Indicators - Updated for modern look */}
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

        {/* Manual Navigation Arrows - Updated for better visibility */}
        {/* <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + sliderData.length) % sliderData.length)}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-colors"
        >
          <span className="text-xl font-bold">‹</span>
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % sliderData.length)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-colors"
        >
          <span className="text-xl font-bold">›</span>
        </button> */}
      </div>

      {/* Main Content */}
      <div className="px-4 py-5">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            {
              title: "Due Bills",
              value: "₹2,450",
              icon: Lightbulb,
              color: "red",
              trend: "up",
            },
            {
              title: "Open Requests",
              value: "3",
              icon: Wrench,
              color: "orange",
              trend: "down",
            },
            {
              title: "Messages",
              value: "4",
              icon: MessageCircleMore,
              color: "green",
              trend: "up",
            },
            {
              title: "Notifications",
              value: "6",
              icon: FolderCheck,
              color: "blue",
              trend: "none",
            }
          ].map((stat, index) => (
            <div 
              key={index}
              className={`bg-white rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-${stat.color}-100/20`}
            >
              {/* Decorative gradient background */}
              <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-200/30 rounded-full transform group-hover:scale-110 transition-transform duration-300`}></div>
              
              {/* Content */}
              <div className="flex flex-col relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className={`text-2xl font-bold text-gray-900 group-hover:text-${stat.color}-600 transition-colors duration-300`}>
                    {stat.value}
                  </p>
                  <div className="relative">
                    <div className={`absolute -inset-2 bg-${stat.color}-500/20 rounded-full blur-sm group-hover:bg-${stat.color}-500/30 transition-all duration-300`}></div>
                    <div className="relative">
                      <stat.icon className={`w-6 h-6 text-${stat.color}-500 opacity-80 group-hover:scale-110 transform transition-all duration-300`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Categories */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900 relative">
              Services
              <span className="absolute -bottom-1 left-0 w-1/3 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animated-gradient"></span>
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {featureCategories.map((category) => (
              <div 
                key={category.id} 
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100/50 transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-indigo-100"
              >
                <button
                  onClick={() => handleOpenPopup(category)}
                  className="w-full flex flex-col items-center p-6 relative group"
                >
                  {/* Decorative background pattern */}
                  <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-gray-100 to-transparent" 
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%235C54F4' fill-opacity='0.25' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                      backgroundSize: '100px 100px'
                    }}>
                  </div>
                  
                  {/* Icon with enhanced gradient and animation */}
                  <div 
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
                      ${category.id === 'property' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 
                        category.id === 'services' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        category.id === 'community' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                        category.id === 'directory' ? 'bg-gradient-to-br from-cyan-400 to-blue-600' :
                        'bg-gradient-to-br from-purple-400 to-purple-600'}`}
                  >
                    <category.icon className="w-10 h-10 text-white transform transition-transform group-hover:scale-110" />
                    
                    {/* Animated ring effect */}
                    <div className="absolute w-full h-full rounded-2xl border-2 border-white/20 animate-pulse"></div>
                    <div className="absolute -inset-1 rounded-2xl bg-white/20 blur-sm group-hover:blur-md transition-all duration-300"></div>
                  </div>
                  
                  {/* Title and services count with enhanced styling */}
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors duration-300">
                      {category.title}
                    </h3>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100 transition-colors duration-300">
                        {category.items.length} services
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 border-t border-gray-200 shadow-lg backdrop-blur-lg z-40">
        <div className="flex items-center justify-around py-2 px-2 max-w-screen-xl mx-auto">
          {bottomNavItems.map((item) => (
            <Link key={item.id} href={item.href} passHref>
              <div
                className={`flex flex-col items-center py-3 px-4 rounded-xl transition-all duration-300 ${
                  activeTab === item.id
                    ? 'text-indigo-600 bg-indigo-50/80 scale-110 shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className={`w-6 h-6 mb-1.5 transition-all duration-300 ${
                  activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                }`} />
                <span className="text-xs font-medium">{item.label}</span>
                
                {/* Active indicator */}
                {activeTab === item.id && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Floating Action Button with Animated Quick Actions */}
      <div className="fixed bottom-24 right-6 z-[45]">
        <div className={`absolute bottom-16 right-0 space-y-3 transition-all duration-500 ${
          fabOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
        }`}>
          {quickActions.map((action, index) => (
            <div 
              key={index} 
              className={`flex items-center space-x-3 transition-all duration-300 transform ${
                fabOpen 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 translate-x-8'
              }`}
              style={{ transitionDelay: fabOpen ? `${index * 75}ms` : '0ms' }}
            >
              <div className="bg-black/80 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg">
                <span className="text-white text-sm whitespace-nowrap">{action.label}</span>
              </div>
              <Link href={action.href} passHref>
                <div 
                  className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 active:scale-95 transition-all duration-300 border border-white/20`}
                  onClick={() => setFabOpen(false)}
                >
                  <action.icon className="w-6 h-6 text-white" />
                  <div className="absolute -inset-1 rounded-xl bg-white/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Main FAB Button with enhanced effects */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-500 ${
            fabOpen 
              ? 'rotate-45 bg-gray-900 scale-110' 
              : 'hover:scale-110 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
          }`}
        >
          <Plus className="w-8 h-8 text-white" />
          
          {/* Enhanced animation effects */}
          {!fabOpen && (
            <>
              <span className="absolute w-full h-full rounded-2xl border-2 border-white/20 animate-ping"></span>
              <span className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-indigo-400/20 to-purple-400/20 blur-xl"></span>
            </>
          )}
        </button>
      </div>

      {/* Category Popup - With proper open and close animations */}
      {categoryPopup && (
        <div className={`fixed inset-0 bg-black/50 z-50 flex items-end transition-all duration-300 ${
          isClosingPopup ? 'bg-opacity-0' : 
          isOpeningPopup ? 'bg-opacity-0' : 'bg-opacity-50'
        }`}>
          <div className={`bg-gradient-to-r from-indigo-100 to-purple-50 w-full rounded-t-3xl max-h-[80vh] overflow-y-auto transition-transform duration-300 ease-out ${
            isClosingPopup ? 'translate-y-full' : 
            isOpeningPopup ? 'translate-y-full' : 'translate-y-0'
          }`}>
            {/* Decorative Background Icons */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <Building className="absolute top-[15%] left-[10%] w-20 h-20 text-indigo-600/5 transform rotate-12 float-animation" />
              <Trees className="absolute top-[35%] right-[8%] w-24 h-24 text-purple-600/5 transform -rotate-6 float-animation-reverse" />
              <Waves className="absolute bottom-[25%] left-[5%] w-32 h-32 text-indigo-600/5 transform rotate-12 float-animation-slow" />
              <Sun className="absolute top-[45%] left-[25%] w-16 h-16 text-purple-600/5 transform rotate-45 float-animation" />
              <Cloud className="absolute top-[10%] right-[25%] w-20 h-20 text-indigo-600/5 transform -rotate-12 float-animation-reverse" />
              <Leaf className="absolute bottom-[40%] right-[15%] w-16 h-16 text-purple-600/5 transform rotate-12 float-animation" />
              <Palmtree className="absolute bottom-[15%] right-[10%] w-24 h-24 text-indigo-600/5 transform -rotate-6 float-animation-slow" />
              <ShieldCheck className="absolute top-[60%] left-[15%] w-20 h-20 text-purple-600/5 transform rotate-12 float-animation-reverse" />
              <CloudSun className="absolute bottom-[10%] left-[20%] w-16 h-16 text-indigo-600/5 transform -rotate-12 float-animation" />
            </div>

            {/* Popup header with gradient background */}
            <div className={`p-6 border-b border-gray-100 relative z-10
              ${categoryPopup.id === 'property' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 
                categoryPopup.id === 'services' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                categoryPopup.id === 'community' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                categoryPopup.id === 'directory' ? 'bg-gradient-to-br from-cyan-400 to-blue-600' :
                'bg-gradient-to-br from-purple-400 to-purple-600'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-md">
                    <categoryPopup.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{categoryPopup.title}</h3>
                    <p className="text-sm text-white/80">{categoryPopup.items.length} services available</p>
                  </div>
                </div>
                <button
                  onClick={handleClosePopup}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors active:scale-95"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            {/* Popup content */}
            <div className="p-4 max-h-[calc(80vh-100px)] overflow-y-auto relative z-10">
              <div className="grid grid-cols-2 gap-3">
                {categoryPopup.items.map((item, index) => (
                  <Link key={index} href={item.href} passHref>
                    <div
                      className={`flex flex-col items-center p-5 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white/90 transition-all duration-200 active:scale-95 border border-gray-100 shadow-sm ${
                        isClosingPopup ? 'animate-fade-out-down' : 
                        isOpeningPopup ? 'animate-fade-in-up-delayed' : 'animate-fade-in-up-delayed'
                      }`}
                      style={{ 
                        animationDelay: isClosingPopup ? '0ms' : `${index * 50}ms`,
                        animationFillMode: 'forwards'
                      }}
                      onClick={handlePopupLinkClick}
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md mb-3 border border-gray-200
                        ${categoryPopup.id === 'property' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 
                          categoryPopup.id === 'services' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          categoryPopup.id === 'community' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                          categoryPopup.id === 'directory' ? 'bg-gradient-to-br from-cyan-400 to-blue-600' :
                          'bg-gradient-to-br from-purple-400 to-purple-600'}`}>
                        <item.icon className="w-7 h-7 text-white" />
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

        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animated-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
        }

        .float-animation {
          animation: float 6s ease-in-out infinite;
        }

        .float-animation-reverse {
          animation: float 8s ease-in-out infinite reverse;
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }

        .pulse-ring {
          animation: pulse-ring 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default AndroidDashboard;