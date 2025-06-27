import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/router";
import Link from 'next/link';
import {
  UserCircle, Bell, MessageCircleMore, ShoppingCart, Siren,
  Wrench, PieChart, FileText, Home, ClipboardList, Package,
  Users, Pencil, Lightbulb, History, Hammer, Search,
  Megaphone, BarChart, ShieldAlert, Plus, X, ChevronRight, ChevronLeft, FolderCheck,
  Building, Trees, Sun, Cloud, Leaf, Bird, Flower2, CloudSun, ShieldCheck, Waves, Headphones, Palmtree,
  HomeIcon as HomeIcon,
  LogOut,
  AlertTriangle,
  Camera,
  CheckCircle2,
  AlertCircle,
  Info,
  Menu,
  User,
  Sparkles,
  Zap,
  Layout,
  Car,
  Dog,
  Key,
  UserCog,
  MessageCircle,
  Store,
  Clock,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [residentDetails, setResidentDetails] = useState({});
  const [flatNumber, setFlatNumber] = useState('');
  const [dashboardLoaded, setDashboardLoaded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeLink, setActiveLink] = useState("Dashboard");
  const [propertyMessages, setPropertyMessages] = useState([]);
  const [productMessages, setProductMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [component, setComponent] = useState("DashboardDefault");

  // Add new states and refs for drag functionality
  const [dragStartX, setDragStartX] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [menuPosition, setMenuPosition] = useState(0);
  const menuRef = useRef(null);
  const dragAreaRef = useRef(null);
  const MENU_WIDTH = 320; // Width of the menu in pixels
  const DRAG_THRESHOLD = 50; // Minimum drag distance to trigger menu action

  // Bottom navigation items
  const bottomNavItems = [
    { id: 'home', icon: Home, label: 'Home', href: '/Resident-dashboard' },
    { id: 'profile', icon: UserCircle, label: 'Profile', href: '/Resident-dashboard/components/Profile' },
    { id: 'chat', icon: MessageCircleMore, label: 'Chat', href: '/Resident-dashboard/Community' },
    { id: 'notifications', icon: Bell, label: 'Alerts', href: '/Resident-dashboard/components/Emergency' },
  ];

  // Update the slider data with more detailed information
  const banners = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80',
      title: 'Welcome to Harmony Heights',
      subtitle: 'Your premium living space'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: 'Modern Amenities',
      subtitle: 'Discover our facilities'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: 'Community Living',
      subtitle: 'Connect with your neighbors'
    }
  ];

  // Add these functions for slider navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("Resident");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch("/api/Resident-Api/get-resident-details", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setResidentDetails(data);
        setFlatNumber(data.flatDetails?.flatNumber || 'N/A');

        // Set loading to false after successful data fetch
        setLoading(false);

      } catch (error) {
        console.error("Error fetching profile:", error);
        if (error.message === "Failed to fetch profile") {
          localStorage.removeItem("Resident");
          router.push("/login");
        }
        // Set loading to false even if there's an error
        setLoading(false);
      }
    };

    fetchProfile();

    // Set a maximum loading time of 5 seconds as a fallback
    const maxLoadTimer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(maxLoadTimer);
  }, [router]);

  // Handle dashboard loaded state
  const handleDashboardLoaded = () => {
    setDashboardLoaded(true);
    // If images are already loaded, stop loading after a short delay
    if (imagesLoaded) {
      setTimeout(() => setLoading(false), 500);
    }
  };

  // Update loading state when images and dashboard are loaded
  useEffect(() => {
    if (imagesLoaded && dashboardLoaded) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [imagesLoaded, dashboardLoaded]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isSidebarOpen]);

  const handleLogout = async () => {
    // Check if fcmToken exists in localStorage
    const fcmToken = localStorage.getItem("fcmToken");
    const residentToken = localStorage.getItem("Resident");

    // If no resident token, just redirect to login
    if (!residentToken) {
      router.push("/login");
      return;
    }

    // Only try to update FCM token if it exists
    if (fcmToken) {
      try {
        const response = await fetch("/api/Resident-Api/update-resident-fcm", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${residentToken}`,
          },
          body: JSON.stringify({
            residentId: residentDetails.residentId,
            fcmToken: fcmToken
          }),
        });

        if (!response.ok) {
          console.error("Failed to update FCM token in database");
        }
      } catch (error) {
        console.error("Error updating FCM token:", error);
      }
    }

    // Always remove tokens (if they exist) and redirect
    localStorage.removeItem("Resident");
    router.push("/login");
  };

  const handleNotification = () => {
    setShowNotifications(!showNotifications);
  };

  // Handle drag start
  const handleDragStart = (e) => {
    const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;

    // Only allow drag start from left edge when menu is closed
    if (!isSidebarOpen && pageX > 30) return;

    setDragging(true);
    setDragStartX(pageX);
  };

  // Handle drag move
  const handleDragMove = (e) => {
    if (!dragging) return;

    const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
    const diff = pageX - dragStartX;

    if (isSidebarOpen) {
      // When menu is open, drag from left to right
      const newPosition = Math.max(-MENU_WIDTH, Math.min(0, diff));
      setMenuPosition(newPosition);
    } else {
      // When menu is closed, drag from right to left
      const newPosition = Math.max(-MENU_WIDTH, Math.min(0, -MENU_WIDTH + diff));
      setMenuPosition(newPosition);
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (!dragging) return;

    setDragging(false);
    const threshold = MENU_WIDTH * 0.3; // 30% of menu width

    if (isSidebarOpen) {
      // If dragged far enough to close
      if (Math.abs(menuPosition) > threshold) {
        setIsSidebarOpen(false);
      }
    } else {
      // If dragged far enough to open
      if (Math.abs(MENU_WIDTH + menuPosition) < threshold) {
        setIsSidebarOpen(true);
      }
    }

    // Reset position
    setMenuPosition(0);
  };

  // Update menu position when sidebar state changes
  useEffect(() => {
    if (!dragging) {
      setMenuPosition(0);
    }
  }, [isSidebarOpen]);

  // Add event listeners for edge dragging
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches[0].pageX < 20) {
        handleDragStart(e);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [dragging, dragStartX, isSidebarOpen]);

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
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Update the onLoaded useEffect to use the loading state
  useEffect(() => {
    if (!loading && onLoaded) {
      onLoaded();
    }
  }, [loading, onLoaded]);

  // Quick action items for FAB
  const quickActions = [
    { icon: Siren, label: 'Emergency', color: 'bg-red-500', href: '/Resident-dashboard/components/Emergency' },
    { icon: Wrench, label: 'Maintenance', color: 'bg-orange-500', href: '/Resident-dashboard/components/Maintenance' },
    { icon: ShoppingCart, label: 'Marketplace', color: 'bg-green-500', href: '/Resident-dashboard/components/Marketplace' },
    { icon: Layout, label: 'Tags', color: 'bg-purple-500', href: '/Resident-dashboard/components/Tags' }
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
        { icon: ClipboardList, label: 'Property', href: '/Resident-dashboard/components/PropertyMarketplace' },
        { icon: Package, label: 'Items Marketplace', href: '/Resident-dashboard/components/Marketplace' }
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
        { icon: Megaphone, label: 'Announcements', href: '/Resident-dashboard/components/Announcements' },
        { icon: BarChart, label: 'Polls & Surveys', href: '/Resident-dashboard/components/PollsSurveys' },
        { icon: ShieldAlert, label: 'Visitor Entry', href: '/Resident-dashboard/components/VisitorEntry' }
      ]
    },
    {
      id: 'access',
      title: 'Access Tags',
      icon: Layout,
      color: 'bg-purple-500',
      items: [
        { icon: Car, label: 'Vehicle Tag', href: '/Resident-dashboard/components/VehicleTagRequest' },
        { icon: Dog, label: 'Animal Tag', href: '/Resident-dashboard/components/AnimalTagRequest' },
        { icon: Key, label: 'Gate Pass', href: '/Resident-dashboard/components/GatePassRequest' },
        { icon: UserCog, label: 'Service Personnel', href: '/Resident-dashboard/components/ServicePersonnelRequest' }
      ]
    },
    {
      id: 'directory',
      title: 'Directory',
      icon: Users,
      color: 'bg-green-500',
      items: [
        { icon: MessageCircleMore, label: 'Resident Chat', href: 'Resident-dashboard/components/ResidentChat' },
        { icon: Users, label: 'Society Chat', href: 'Resident-dashboard/components/SocietyChat' },
        { icon: Headphones, label: 'Help Desk', href: 'Resident-dashboard/components/HelpDesk' },
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

  // Remove the state and localStorage logic and replace with static array
  const quickLinks = [
    {
      id: 'gateUpdates',
      icon: Bell,
      label: 'Gate Updates',
      href: '/Resident-dashboard/components/VisitorEntry',
      color: 'bg-gradient-to-br from-pink-400 to-pink-600',
      shadowColor: 'shadow-pink-200'
    },
    {
      id: 'myBills',
      icon: FileText,
      label: 'My Bills',
      href: '/Resident-dashboard/components/Bills',
      color: 'bg-gradient-to-br from-orange-400 to-orange-600',
      shadowColor: 'shadow-orange-200'
    },
    {
      id: 'mySociety',
      icon: Home,
      label: 'My Society',
      href: '/Resident-dashboard/components/House',
      color: 'bg-gradient-to-br from-green-400 to-green-600',
      shadowColor: 'shadow-green-200'
    },
    {
      id: 'explore',
      icon: Search,
      label: 'Explore',
      href: '/Resident-dashboard/Community',
      color: 'bg-gradient-to-br from-purple-400 to-purple-600',
      shadowColor: 'shadow-purple-200'
    }
  ];

  // Add new function to fetch unread messages
  const fetchUnreadMessages = async () => {
    try {
      const token = localStorage.getItem("Resident");
      if (!token) return;

      // Fetch property messages
      const propertyResponse = await fetch('/api/Property-Api/get-messages', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      const propertyData = await propertyResponse.json();
      const unreadPropertyMessages = propertyData.filter(msg => !msg.isRead && msg.receiverId === residentDetails._id);
      setPropertyMessages(unreadPropertyMessages);

      // Fetch product messages
      const productResponse = await fetch('/api/Product-Api/get-messages', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      const productData = await productResponse.json();
      const unreadProductMessages = productData.filter(msg => !msg.isRead && msg.receiverId === residentDetails._id);
      setProductMessages(unreadProductMessages);

      // Update total unread count
      setUnreadCount(unreadPropertyMessages.length + unreadProductMessages.length);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Add useEffect to fetch messages periodically
  useEffect(() => {
    if (residentDetails._id) {
      fetchUnreadMessages();
      const interval = setInterval(fetchUnreadMessages, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [residentDetails._id]);

  // Add function to mark message as read and navigate
  const handleMessageClick = async (type, message) => {
    try {
      const token = localStorage.getItem("Resident");
      if (!token) return;

      // Mark message as read
      await fetch(`/api/${type}-Api/mark-as-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderId: message.senderId })
      });

      // Remove message from state
      if (type === 'Property') {
        setPropertyMessages(prev => prev.filter(msg => msg._id !== message._id));
      } else {
        setProductMessages(prev => prev.filter(msg => msg._id !== message._id));
      }

      // Update total unread count
      setUnreadCount(prev => prev - 1);

      // Navigate to chat with correct parameters
      const path = type === 'Property' ? 'PropertyChat' : 'ProductChat';
      if (type === 'Property') {
        router.push(`/Resident-dashboard/components/${path}?buyerId=${message.senderId}&propertyId=${message.propertyId}`);
      } else {
        router.push(`/Resident-dashboard/components/${path}?buyerId=${message.senderId}&productId=${message.productId}`);
      }
      setShowNotifications(false);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      {/* Background pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366F1' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
          opacity: 0.07
        }}
      />

      {/* Add a radial gradient overlay for more depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(99, 102, 241, 0.05) 80%)'
        }}
      />

      {/* Add subtle animated circles in the background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-200 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-blue-200 rounded-full opacity-10 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-20 right-1/4 w-48 h-48 bg-purple-200 rounded-full opacity-10 blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div
        ref={dragAreaRef}
        className="fixed left-0 top-0 w-5 h-full z-30"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      />

      {/* Overlay when sidebar is open */}
      {(isSidebarOpen || dragging) && (
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 z-30 ${isSidebarOpen ? 'opacity-50' : 'opacity-0'
            }`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Enhanced Header with better gradient and styling */}
      <div className="text-gray-800 px-4 py-8 relative overflow-hidden backdrop-blur-sm">

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 bg-white/15 backdrop-blur-sm rounded-xl hover:bg-white/25 transition-all duration-200 shadow-lg"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-800 bg-clip-text text-transparent">Good Morning</h1>
                <p className="from-gray-700 to-gray-800 text-sm">Welcome to Harmony Heights</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleNotification}
                className="p-3 bg-white/15 backdrop-blur-sm rounded-xl hover:bg-white/25 transition-all duration-200 shadow-lg relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{unreadCount}</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Popup - Without blur */}
      <div className={`fixed inset-0 z-50 flex items-start justify-end pt-16 px-4 transition-opacity duration-300 ${showNotifications ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${showNotifications ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setShowNotifications(false)}
        ></div>

        {/* Notification Panel */}
        <div className={`w-full max-w-sm bg-white rounded-2xl shadow-2xl relative z-10 transform transition-all duration-300 ${showNotifications ? 'translate-x-0 scale-100' : 'translate-x-full scale-95'}`}>
          {/* Header */}
          <div className="p-4 bg-[#7C3AED] rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  <p className="text-sm text-white/80">{propertyMessages.length + productMessages.length} new messages</p>
                </div>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto bg-gray-50">
            {/* Property Messages */}
            {propertyMessages.map((message) => (
              <div
                key={message._id}
                onClick={() => handleMessageClick('Property', message)}
                className="p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer relative group"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <HomeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Property Message</p>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {message.senderName}: {message.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}

            {/* Product Messages */}
            {productMessages.map((message) => (
              <div
                key={message._id}
                onClick={() => handleMessageClick('Product', message)}
                className="p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer relative group"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-green-500 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Product Message</p>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {message.senderName}: {message.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}

            {/* Empty State */}
            {propertyMessages.length === 0 && productMessages.length === 0 && (
              <div className="p-8 text-center text-gray-500 bg-white">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No new messages</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-white rounded-b-2xl border-t border-gray-100">
            <button 
              onClick={() => {
                router.push('/Resident-dashboard/components/Notifications');
                setShowNotifications(false);
              }}
              className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              View All Notifications
            </button>
          </div>
        </div>
      </div>

      {/* Side Navigation Drawer - With drag functionality */}
      <div
        ref={menuRef}
        className={`fixed inset-y-0 left-0 w-80 z-50 transform transition-transform duration-300 ease-out bg-white/85 shadow-xl border-r border-indigo-100
                            ${!dragging ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}`}
                  style={{
            transform: dragging ? `translateX(${menuPosition}px)` : undefined,
            transition: dragging ? 'none' : undefined,
            backgroundColor: 'rgba(255, 255, 255, 0.85)'
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div className="flex z-50 flex-col h-full">
          {/* Drawer Header */}
          <div className="p-4 flex justify-between items-center border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
            <h2 className="text-xl font-semibold text-indigo-800">Menu</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-full hover:bg-indigo-100 transition-colors"
            >
              <X size={20} className="text-indigo-600" />
            </button>
          </div>

          {/* User Profile Section - Without blur */}
          <div className="p-4 pb-5 bg-gradient-to-r from-indigo-100 to-purple-50 border-b border-gray-200 relative overflow-hidden">
            <div className="flex flex-col items-center relative">
              {/* Profile Image with Upload Button */}
              <div className="relative mb-3">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-r from-indigo-500 to-blue-500 shadow-lg">
                  <img
                    src={residentDetails.userImage || "/profile.png"}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                  />
                </div>
                {/* Upload Profile Image Button */}
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    router.push("./Resident-dashboard/components/uploadProfile");
                  }}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:bg-blue-600 transition-colors transform hover:scale-105 duration-200"
                >
                  <Camera size={18} className="text-white" />
                </button>
              </div>

              {/* User Details */}
              <div className="text-center">
                <h3 className="font-bold text-xl text-gray-800">{residentDetails?.name || 'N/A'}</h3>
                <div className="mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 shadow-sm">
                  {flatNumber !== 'N/A' ? `Flat: ${flatNumber}` : 'No flat assigned'}
                </div>
                <p className="mt-2 text-xs text-gray-500 bg-white/70 rounded-md py-1 px-2 inline-block shadow-sm">
                  ID: {residentDetails?.residentId?.substring(0, 8) || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-2 bg-gradient-to-b from-white to-indigo-50/50">
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => {
                    setComponent("DashboardDefault");
                    setActiveLink("Dashboard");
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200
                                            ${activeLink === "Dashboard"
                      ? 'bg-indigo-100 text-indigo-600 shadow-sm'
                      : 'hover:bg-indigo-50 hover:translate-x-1'}`}
                >
                  <HomeIcon className={`mr-3 ${activeLink === "Dashboard" ? 'text-indigo-600' : ''}`} size={20} />
                  <span className={activeLink === "Dashboard" ? 'text-indigo-600 font-medium' : ''}>Home</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    router.push("./Resident-dashboard/components/Profile");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 hover:bg-indigo-50 hover:translate-x-1"
                >
                  <User className="mr-3" size={20} />
                  <span>Profile</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    router.push("./Resident-dashboard/components/Tags");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 hover:bg-indigo-50 hover:translate-x-1"
                >
                  <Layout className="mr-3" size={20} />
                  <span>Access Tags</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    router.push("./Resident-dashboard/components/Emergency");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 hover:bg-indigo-50 hover:translate-x-1"
                >
                  <AlertTriangle className="mr-3" size={20} />
                  <span>Emergency</span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 bg-white/85">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-lg bg-red-50/90 hover:bg-red-100 transition-colors shadow-sm"
            >
              <LogOut className="mr-3 text-red-600" size={20} />
              <span className="text-red-600 font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
      {/* Decorative Background Icons - with reduced size and opacity */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <Building className="absolute top-[15%] left-[10%] w-20 h-20 text-indigo-600/5 transform rotate-12 float-animation" />
        <Trees className="absolute top-[35%] right-[8%] w-24 h-24 text-purple-600/5 transform -rotate-6 float-animation-reverse" />
        <Waves className="absolute bottom-[25%] left-[5%] w-32 h-32 text-indigo-600/5 transform rotate-12 float-animation-slow" />
        <Sun className="absolute top-[45%] left-[25%] w-16 h-16 text-purple-600/5 transform rotate-45 float-animation" />
        <Cloud className="absolute top-[10%] right-[25%] w-20 h-20 text-indigo-600/5 transform -rotate-12 float-animation-reverse" />
        <Leaf className="absolute bottom-[40%] right-[15%] w-16 h-16 text-purple-600/5 transform rotate-12 float-animation" />
        <Palmtree className="absolute bottom-[15%] right-[10%] w-24 h-24 text-indigo-600/5 transform -rotate-6 float-animation-slow" />
        <ShieldCheck className="absolute top-[60%] left-[15%] w-20 h-20 text-purple-600/5 transform rotate-12 float-animation-reverse" />
        <CloudSun className="absolute bottom-[10%] left-[20%] w-16 h-16 text-indigo-600/5 transform -rotate-12 float-animation" />
      </div> */}

      {/* Content with enhanced spacing and backgrounds */}
      <div className="relative -mt-7 z-10">
        <div className="relative overflow-hidden animate-fade-in mx-4">
          <div className="relative h-48 overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {banners.map((banner) => (
                <div key={banner.id} className="w-full flex-shrink-0 relative">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-lg">{banner.title}</h3>
                    <p className="text-sm opacity-90">{banner.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/30 rounded-full p-1 transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/30 rounded-full p-1 transition-colors"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 py-3">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${index === currentSlide ? 'bg-[#1A75FF]' : 'bg-white/50'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Flat Selection Notice - Show when no flat is assigned */}
      {flatNumber === 'N/A' && (
        <div className="mx-4 my-6">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 shadow-lg border border-indigo-100/50 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full transform -translate-x-16 translate-y-16"></div>

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 border border-indigo-100/50">
                <Building className="w-8 h-8 text-indigo-600" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Your Apartment</h3>
              <p className="text-gray-600 mb-6">Please choose your residence details to access all features and stay connected with your community.</p>

              {/* Action Button */}
              <Link href="/Resident-dashboard/components/selectApartment">
                <button className="w-full bg-[#1A75FF] hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                  <Home className="w-5 h-5" />
                  <span>Choose Your Apartment</span>
                </button>
              </Link>

              {/* Benefits List */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center space-x-3 text-gray-600">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm">Access community features</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm">Receive important notifications</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm">Connect with neighbors</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Status Notice - Show when flat is assigned and pending/rejected */}
      {flatNumber !== 'N/A' && residentDetails.flatDetails && (
        <div className="mx-4 my-6">
          {residentDetails.societyVerification === 'Reject' ? (
            // Rejected State
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 shadow-lg border border-red-100/50 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400/10 to-pink-400/10 rounded-full transform translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-red-400/10 rounded-full transform -translate-x-16 translate-y-16"></div>

              <div className="relative z-10">
                {/* Icon */}
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 border border-red-100/50">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-red-900 mb-2">Flat Verification Rejected</h3>
                <p className="text-red-600 mb-6">Your flat selection ({flatNumber}) has been rejected by the society administration. Please contact them for more information or select a different flat.</p>

                {/* Action Button */}
                <Link href="/Contact">
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                    <Home className="w-5 h-5" />
                    <span>Contact Society</span>
                  </button>
                </Link>
              </div>
            </div>
          ) : residentDetails.societyVerification === 'Pending' && (
            // Pending State
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-yellow-100/50 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full transform translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 rounded-full transform -translate-x-16 translate-y-16"></div>

              <div className="relative z-10">
                {/* Icon */}
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 border border-yellow-100/50">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-yellow-900 mb-2">Flat Verification Pending</h3>
                <p className="text-yellow-700 mb-6">Your flat selection ({flatNumber}) is under review. Please wait for the society administration to verify your residence.</p>

                {/* Status Indicator */}
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-yellow-700">Awaiting Verification</span>
                </div>

                {/* Benefits List */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center space-x-3 text-yellow-700">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span className="text-sm">Verification in progress for {flatNumber}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-yellow-700">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Info className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span className="text-sm">You'll be notified once verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 pb-5 pt-2">
        {/* Stats heading */}
        <div className="flex items-center gap-6 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h2 className="text-[17px] font-semibold text-gray-900">Stats</h2>
          </div>
          <div className="w-12 h-[2px] bg-indigo-500/30"></div>
        </div>
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/85 rounded-xl p-4 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100/80">
            {/* Background gradient decoration */}
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-tr from-red-500/20 to-red-200/30 rounded-full transform group-hover:scale-110 transition-transform duration-300"></div>
            <div className="flex flex-col relative z-10">
              <p className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors duration-200">Due Bills</p>
              <p className="text-2xl font-medium text-gray-600 group-hover:text-red-900 transition-colors duration-200">₹2,450</p>
              <div className="absolute bottom-0 right-1 w-16 h-16 flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-red-500 opacity-80 group-hover:scale-110 transform transition-all duration-300" />
              </div>
            </div>
          </div>
          <div className="bg-white/85 rounded-xl p-4 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100/80">
            {/* Background gradient decoration */}
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-tr from-orange-500/20 to-orange-200/30 rounded-full transform group-hover:scale-110 transition-transform duration-300"></div>
            <div className="flex flex-col relative z-10">
              <p className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors duration-200">Open Requests</p>
              <p className="text-2xl font-medium text-gray-600 group-hover:text-yellow-900 transition-colors duration-200">3</p>
              <div className="absolute bottom-0 right-1 w-16 h-16 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-orange-500 opacity-80 group-hover:scale-110 transform transition-all duration-300" />
              </div>
            </div>
          </div>
        </div>
        {/* <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100/80">
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-tr from-green-500/20 to-green-200/30 rounded-full transform group-hover:scale-110 transition-transform duration-300"></div>
            <div className="flex flex-col relative z-10">
              <p className="text-sm text-gray-600 font-medium">Messages</p>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">4</p>
              <div className="absolute bottom-0 right-1 w-16 h-16 flex items-center justify-center">
                <MessageCircleMore className="w-6 h-6 text-green-500 opacity-80 group-hover:scale-110 transform transition-all duration-300" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100/80">
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-blue-200/30 rounded-full transform group-hover:scale-110 transition-transform duration-300"></div>
            <div className="flex flex-col relative z-10">
              <p className="text-sm text-gray-600 font-medium">Notifications</p>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">6</p>
              <div className="absolute bottom-0 right-1 w-16 h-16 flex items-center justify-center">
                <FolderCheck className="w-6 h-6 text-blue-500 opacity-80 group-hover:scale-110 transform transition-all duration-300" />
              </div>
            </div>
          </div>
        </div> */}

        {/* Quick Access heading */}
        <div className="flex items-center gap-6 mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            <h2 className="text-[17px] font-semibold text-gray-900">Quick Access</h2>
          </div>
          <div className="w-12 h-[2px] bg-indigo-500/30"></div>
        </div>
        <div className="bg-white/85 rounded-2xl shadow-lg justify-center overflow-hidden animate-fade-in mb-8">
          <div className="flex space-x-7 overflow-x-auto pb-4 justify-center pt-4 scrollbar-hide">
            {quickLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="flex-shrink-0 group"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className={`w-14 h-14 ${link.color} rounded-full flex items-center justify-center ${link.shadowColor} shadow-lg 
                    transform transition-all duration-200 group-hover:scale-110 group-active:scale-95`}
                  >
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors duration-200">{link.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Services heading */}
        <div className="flex items-center gap-6 mb-2">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-500" />
            <h2 className="text-[17px] font-semibold text-gray-900">Services</h2>
          </div>
          <div className="w-12 h-[2px] bg-indigo-500/30"></div>
        </div>

        {/* Feature Categories */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {featureCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white/85 rounded-xl shadow-lg overflow-hidden border border-gray-100 transform transition-all duration-200 hover:shadow-xl hover:scale-[1.02] hover:border-indigo-100"
              >
                <button
                  onClick={() => handleOpenPopup(category)}
                  className="w-full flex flex-col items-center p-4 relative"
                >

                  {/* Decorative pattern background */}
                  <div className="absolute inset-0 opacity-5"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%235C54F4' fill-opacity='0.25' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                      backgroundSize: '100px 100px'
                    }}>
                  </div>

                  {/* Icon with gradient background and subtle shadow */}
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-md transform transition-all duration-300 hover:scale-110 hover:rotate-3
                      ${category.id === 'property' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                        category.id === 'services' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          category.id === 'community' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                            category.id === 'directory' ? 'bg-gradient-to-br from-cyan-400 to-blue-600' :
                              'bg-gradient-to-br from-purple-400 to-purple-600'}`}
                  >
                    <category.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Title and services count */}
                  <div className="text-center">
                    <h3 className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors duration-200">{category.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {/* Pill badge for services count */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {category.items.length} services
                      </span>
                    </p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 shadow-xl backdrop-blur-md z-40">
        <div className="flex items-center justify-around bg-gray-50 py-2 px-2 max-w-screen-xl mx-auto">
          {bottomNavItems.map((item) => (
            <Link key={item.id} href={item.href} passHref>
              <div
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                  ? 'text-indigo-600 bg-indigo-50 scale-110 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className={`w-6 h-6 mb-1 transition-all duration-200 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                  }`} />
                <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors duration-200">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Floating Action Button with Animated Quick Actions */}
      <div className="fixed bottom-24 right-6 z-[45] pointer-events-auto drop-shadow-2xl">
        {/* Quick Actions Menu - With enhanced animations */}
        <div className={`absolute bottom-16 right-0 space-y-3 transition-all duration-300 ease-out transform origin-bottom-right ${fabOpen
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
          }`}>
          {quickActions.map((action, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 transition-all duration-300 ease-out transform ${fabOpen
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-8'
                }`}
              style={{
                transitionDelay: fabOpen ? `${index * 50}ms` : '0ms'
              }}
            >
              <span className="bg-gray-900/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm whitespace-nowrap shadow-xl">
                {action.label}
              </span>
              <Link href={action.href} passHref>
                <div
                  className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center shadow-xl transform transition-all duration-200 hover:scale-110 active:scale-95 border border-white/20`}
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
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 active:scale-95 ${fabOpen
            ? 'rotate-45 bg-gray-700 scale-110'
            : 'hover:scale-110 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 animated-gradient'
            }`}
        >
          <Plus className="w-7 h-7 text-white" />

          {/* Animated ring effect */}
          {!fabOpen && (
            <>
              <span className="absolute w-full h-full rounded-full border-4 border-indigo-400/30 animate-ping"></span>
              <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-400/20 to-purple-400/20 blur-md"></span>
            </>
          )}
        </button>
      </div>

      {/* Category Popup - With proper open and close animations */}
      {categoryPopup && (
        <div className={`fixed inset-0 bg-black/50 z-50 flex items-end transition-all duration-300 ${isClosingPopup ? 'bg-opacity-0' :
          isOpeningPopup ? 'bg-opacity-0' : 'bg-opacity-50'
          }`}>
          <div className={`bg-white w-full rounded-t-3xl max-h-[80vh] overflow-y-auto transition-transform duration-300 ease-out shadow-2xl ${isClosingPopup ? 'translate-y-full' :
            isOpeningPopup ? 'translate-y-full' : 'translate-y-0'
            }`}>
            {/* Decorative Background Icons
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
            </div> */}

            {/* Popup header with gradient background */}
            <div className={`p-6 border-b border-gray-100 relative z-10 overflow-hidden
              ${categoryPopup.id === 'property' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                categoryPopup.id === 'services' ? 'bg-gradient-to-br from-[#1A75FF] to-[#1A75FF]/80' :
                  categoryPopup.id === 'community' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                    categoryPopup.id === 'directory' ? 'bg-gradient-to-br from-cyan-400 to-blue-600' :
                      'bg-gradient-to-br from-purple-400 to-purple-600'}`}>
              {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '60px 60px'
                }}>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md">
                    <categoryPopup.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{categoryPopup.title}</h3>
                    <p className="text-sm text-white/80">{categoryPopup.items.length} services available</p>
                  </div>
                </div>
                <button
                  onClick={handleClosePopup}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors active:scale-95"
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
                        className={`flex flex-col items-center p-5 bg-white/85 backdrop-blur-sm rounded-xl hover:bg-[#1A75FF]/10 transition-all duration-200 active:scale-95 border border-white/20 shadow-lg ${isClosingPopup ? 'animate-fade-out-down' :
                          isOpeningPopup ? 'animate-fade-in-up-delayed' : 'animate-fade-in-up-delayed'
                          }`}
                        style={{
                          animationDelay: isClosingPopup ? '0ms' : `${index * 50}ms`,
                          animationFillMode: 'forwards'
                        }}
                        onClick={handlePopupLinkClick}
                      >
                      <div className={`w-12 h-12 bg-white/85 rounded-full flex items-center justify-center shadow-md mb-3 border border-gray-200
                        ${categoryPopup.id === 'property' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                          categoryPopup.id === 'services' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                            categoryPopup.id === 'community' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                              categoryPopup.id === 'directory' ? 'bg-gradient-to-br from-cyan-400 to-blue-600' :
                                'bg-gradient-to-br from-purple-400 to-purple-600'}`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{item.label}</span>
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
        /* Basic Animations */
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes fade-in-up {
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

        /* Slide Animations */
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes slide-out-right {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
        }

        @keyframes slide-menu {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        /* Float Animations */
        @keyframes float {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }

        /* Gradient Animation */
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Animation Classes */
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }

        .animate-fade-out {
          animation: fade-out 0.2s ease-out forwards;
        }

        .animate-fade-in-up-delayed {
          animation: fade-in-up 0.3s ease-out;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .animate-fade-out-down {
          animation: fade-out-down 0.2s ease-out forwards;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-slide-out-right {
          animation: slide-out-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Float Animation Variants */
        .float-animation {
          animation: float 8s ease-in-out infinite;
        }

        .float-animation-reverse {
          animation: float 6s ease-in-out infinite reverse;
        }

        .float-animation-slow {
          animation: float 10s ease-in-out infinite;
        }

        /* Gradient Animation */
        .animated-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }

        /* Utility Classes */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default AndroidDashboard;