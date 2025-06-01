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
                    router.push("/Login");
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
                    router.push("/Login");
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
            router.push("/Login");
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
        router.push("/Login");
    };

    const handleNotification = () => {
        // Notification functionality would go here
    };

    return (
        <div className="relative flex flex-col min-h-screen bg-gray-50 text-gray-900">
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
                    <div className="flex justify-between items-center m-1 rounded-full h-14 px-4 bg-indigo-600 text-white shadow-md top-0 z-20">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                            >
                                <UserCircle className="w-5 h-5 text-white" />
                            </button>
                            <div>
                                <p className="text-white text-base font-medium">Welcome</p>
                            </div>
                        </div>

                        <button
                            onClick={handleNotification}
                            className="relative w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                            <Bell className="w-5 h-5 text-white" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold">2</span>
                            </div>
                        </button>
                    </div>

                    {/* Side Navigation Drawer - Mobile Style */}
                    <div className={`fixed inset-y-0 left-0 w-80 z-40 transform transition-transform duration-300 ease-in-out 
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                        bg-white text-gray-900 shadow-xl`}
                    >
                        <div className="flex flex-col h-full">
                            {/* Drawer Header */}
                            <div className="p-4 flex justify-between items-center border-b border-gray-200">
                                <h2 className="text-xl font-semibold">Menu</h2>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* User Profile Section - Enhanced */}
                            <div className="p-4 pb-5 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
                                <div className="flex flex-col items-center">
                                    {/* Profile Image with Upload Button */}
                                    <div className="relative mb-3">
                                        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-r from-indigo-500 to-blue-500">
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
                                            className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:bg-blue-600 transition-colors"
                                        >
                                            <Camera size={18} className="text-white" />
                                        </button>
                                    </div>

                                    {/* User Details */}
                                    <div className="text-center">
                                        <h3 className="font-bold text-xl text-gray-800">{residentDetails?.name || 'N/A'}</h3>
                                        <div className="mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                                            {flatNumber !== 'N/A' ? `Flat: ${flatNumber}` : 'No flat assigned'}
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 bg-gray-100 rounded-md py-1 px-2 inline-block">
                                            ID: {residentDetails?.residentId?.substring(0, 8) || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Menu */}
                            <nav className="flex-1 overflow-y-auto p-2">
                                <ul className="space-y-1">
                                    <li>
                                        <button
                                            onClick={() => {
                                                setComponent("DashboardDefault");
                                                setActiveLink("Dashboard");
                                                setIsSidebarOpen(false);
                                            }}
                                            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors
                                            ${activeLink === "Dashboard"
                                                    ? 'bg-indigo-100 text-indigo-600'
                                                    : 'hover:bg-gray-100'}`}
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
                                            className="flex items-center w-full px-4 py-3 rounded-lg transition-colors hover:bg-gray-100"
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
                                            className="flex items-center w-full px-4 py-3 rounded-lg transition-colors hover:bg-gray-100"
                                        >
                                            <AlertTriangle className="mr-3" size={20} />
                                            <span>Emergency</span>
                                        </button>
                                    </li>
                                </ul>
                            </nav>

                            {/* Bottom Actions */}
                            <div className="p-4 border-t border-gray-200">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full px-4 py-3 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                                >
                                    <LogOut className="mr-3 text-red-600" size={20} />
                                    <span className="text-red-600">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main content - Full Screen */}
                    <main className="flex-1">
                        {component === "DashboardDefault" && <DashboardDefault onLoaded={handleDashboardLoaded} />}
                    </main>
                </>
            )}
        </div>
    );
}
