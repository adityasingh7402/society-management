import { useState, useEffect } from "react";
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
    Camera
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
        // Notification functionality would go here
    };

    return (
        <div className="relative flex flex-col min-h-screen bg-gray-50 text-gray-900 bg-gradient-to-b from-white to-indigo-50">
            {/* Background pattern overlay */}
            <div className="absolute inset-0 z-0 opacity-10" 
                style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366F1' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px'
                }}>
            </div>
            
            {loading ? <Preloader /> : (
                <>
                    {/* Overlay when sidebar is open */}
                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black opacity-50 z-30"
                            onClick={() => setIsSidebarOpen(false)}
                        ></div>
                    )}

                    {/* App Bar - Updated with modern design */}
                    <div className="flex justify-between items-center mt-1 mx-1 rounded-full h-14 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg backdrop-blur-md top-0 z-20 border border-white/20">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors transform hover:scale-105 duration-200"
                            >
                                <UserCircle className="w-5 h-5 text-white" />
                            </button>
                            <div>
                                <p className="text-white text-base font-medium">Welcome</p>
                            </div>
                        </div>

                        <button
                            onClick={handleNotification}
                            className="relative w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors transform hover:scale-105 duration-200"
                        >
                            <Bell className="w-5 h-5 text-white" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-indigo-600 flex items-center justify-center animate-pulse">
                                <span className="text-white text-[10px] font-bold">2</span>
                            </div>
                        </button>
                    </div>

                    {/* Side Navigation Drawer - Mobile Style */}
                    <div className={`fixed inset-y-0 left-0 w-80 z-40 transform transition-transform duration-300 ease-in-out 
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                        bg-white text-gray-900 shadow-xl border-r border-indigo-100`}
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

                            {/* User Profile Section - Enhanced */}
                            <div className="p-4 pb-5 bg-gradient-to-r from-indigo-100 to-purple-50 border-b border-gray-200 relative overflow-hidden">
                                {/* Background pattern for profile section */}
                                <div className="absolute inset-0 opacity-10" 
                                    style={{ 
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%235C54F4' fill-opacity='0.25' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                                        backgroundSize: '100px 100px'
                                    }}>
                                </div>
                                
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
                                        <p className="mt-2 text-xs text-gray-500 bg-white/70 backdrop-blur-sm rounded-md py-1 px-2 inline-block shadow-sm">
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
        </div>
    );
}
