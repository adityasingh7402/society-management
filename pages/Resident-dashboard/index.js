import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import DashboardDefault from "./components/DashboardDefault";
import {
    HomeIcon as HomeIcon,
    User,
    LogOut,
    AlertTriangle,
    UserCircle,
    Bell,
    X,
    Camera,
    CheckCircle2,
    AlertCircle,
    Info,
    ChevronRight
} from 'lucide-react';
import Preloader from "../components/Preloader";

export default function Home() {
    const router = useRouter();
    const [component, setComponent] = useState("DashboardDefault");
    const [activeLink, setActiveLink] = useState("Dashboard");
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [residentDetails, setResidentDetails] = useState({});
    const [flatNumber, setFlatNumber] = useState('');
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [dashboardLoaded, setDashboardLoaded] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Add new states and refs for drag functionality
    const [dragStartX, setDragStartX] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [menuPosition, setMenuPosition] = useState(0);
    const menuRef = useRef(null);
    const dragAreaRef = useRef(null);
    const MENU_WIDTH = 320; // Width of the menu in pixels
    const DRAG_THRESHOLD = 50; // Minimum drag distance to trigger menu action

    // Dummy notifications data
    const notifications = [
        {
            id: 1,
            type: 'success',
            title: 'Maintenance Request Completed',
            message: 'Your plumbing repair request has been resolved.',
            time: '2 hours ago',
            icon: CheckCircle2,
            color: 'bg-green-500'
        },
        {
            id: 2,
            type: 'warning',
            title: 'Due Bill Reminder',
            message: 'Your maintenance bill for March is due in 3 days.',
            time: '5 hours ago',
            icon: AlertCircle,
            color: 'bg-orange-500'
        },
        {
            id: 3,
            type: 'info',
            title: 'Community Update',
            message: 'New gym equipment will be installed next week.',
            time: '1 day ago',
            icon: Info,
            color: 'bg-blue-500'
        }
    ];

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

                // Set images loaded to true regardless
                setImagesLoaded(true);

            } catch (error) {
                console.error("Error fetching profile:", error);
                if (error.message === "Failed to fetch profile") {
                    localStorage.removeItem("Resident");
                    router.push("/login");
                }
                setImagesLoaded(true);
            }
        };

        fetchProfile();

        // Set a maximum loading time of 3 seconds
        const maxLoadTimer = setTimeout(() => {
            setLoading(false);
        }, 3000);

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

    return (
        <div className="relative flex flex-col min-h-screen  text-gray-900 bg-gradient-to-r from-indigo-100 to-purple-50">
            {/* Background pattern overlay */}
            <div className="absolute inset-0 z-0 opacity-10" 
                style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366F1' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px'
                }}>
            </div>
            
            {loading ? <Preloader /> : (
                <>
                    {/* Edge drag area for opening menu */}
                    <div
                        ref={dragAreaRef}
                        className="fixed left-0 top-0 w-5 h-full z-30"
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                    />

                    {/* Overlay when sidebar is open */}
                    {(isSidebarOpen || dragging) && (
                        <div
                            className={`fixed inset-0 bg-black transition-opacity duration-300 z-30 ${
                                isSidebarOpen ? 'opacity-50' : 'opacity-0'
                            }`}
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    {/* App Bar - Updated without blur */}
                    <div className="flex justify-between items-center mt-1 mx-1 rounded-full h-14 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg top-0 z-20 border border-white/20">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors transform hover:scale-105 duration-200"
                            >
                                <UserCircle className="w-5 h-5 text-white" />
                            </button>
                            <div>
                                <p className="text-white text-base font-medium">Welcome</p>
                            </div>
                        </div>

                        <button
                            onClick={handleNotification}
                            className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors transform hover:scale-105 duration-200"
                        >
                            <Bell className="w-5 h-5 text-white" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-indigo-600 flex items-center justify-center animate-pulse">
                                <span className="text-white text-[10px] font-bold">2</span>
                            </div>
                        </button>
                    </div>

                    {/* Notification Popup - Without blur */}
                    <div className={`fixed inset-0 z-50 flex items-start justify-end pt-16 px-4 transition-opacity duration-300 ${showNotifications ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        {/* Backdrop without blur */}
                        <div 
                            className={`fixed inset-0 bg-black/20 transition-opacity duration-300 ${showNotifications ? 'opacity-100' : 'opacity-0'}`}
                            onClick={() => setShowNotifications(false)}
                        ></div>
                        
                        {/* Notification Panel */}
                        <div className={`w-full max-w-sm bg-white rounded-2xl shadow-xl relative z-10 border border-gray-100 transform transition-all duration-300 ${showNotifications ? 'translate-x-0 scale-100' : 'translate-x-full scale-95'}`}>
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                            <Bell className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">Notifications</h3>
                                            <p className="text-sm text-white/80">{notifications.length} new messages</p>
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
                            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                                {notifications.map((notification) => (
                                    <div 
                                        key={notification.id}
                                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group"
                                    >
                                        <div className="flex items-start space-x-4">
                                            <div className={`${notification.color} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                                <notification.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                                <p className="text-sm text-gray-500 line-clamp-2">{notification.message}</p>
                                                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                                <button className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-colors shadow-sm">
                                    View All Notifications
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Side Navigation Drawer - With drag functionality */}
                    <div
                        ref={menuRef}
                        className={`fixed inset-y-0 left-0 w-80 z-40 transform transition-transform duration-300 ease-out bg-white shadow-xl border-r border-indigo-100
                            ${!dragging ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}`}
                        style={{
                            transform: dragging ? `translateX(${menuPosition}px)` : undefined,
                            transition: dragging ? 'none' : undefined,
                            backgroundColor: 'white'
                        }}
                        onMouseDown={handleDragStart}
                        onMouseMove={handleDragMove}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                        onTouchStart={handleDragStart}
                        onTouchMove={handleDragMove}
                        onTouchEnd={handleDragEnd}
                    >
                        <div className="flex flex-col h-full">
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
                            <div className="p-4 border-t border-gray-200 bg-white">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full px-4 py-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors shadow-sm"
                                >
                                    <LogOut className="mr-3 text-red-600" size={20} />
                                    <span className="text-red-600 font-medium">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main content - Full Screen */}
                    <main className="flex-1 relative z-10">
                        {component === "DashboardDefault" && <DashboardDefault onLoaded={handleDashboardLoaded} />}
                    </main>
                </>
            )}

            <style jsx>{`
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

                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes fade-out {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                    }
                }

                .animate-slide-in-left {
                    animation: slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .animate-slide-out-right {
                    animation: slide-out-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }

                .animate-fade-out {
                    animation: fade-out 0.2s ease-out forwards;
                }

                /* Add smooth drag transition */
                @keyframes slide-menu {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
