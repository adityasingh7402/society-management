import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardDefault from "./components/DashboardDefault";
import Profile from "./components/Profile";
import Link from "next/link";
import { CiLogout } from "react-icons/ci";
import { FaUser, FaFileAlt, FaHome, FaClipboardList, FaBox, FaUserTie, FaFileSignature, FaLightbulb, FaHistory, FaTools, FaSearch, FaBullhorn, FaChartBar, FaIdBadge, FaExclamationTriangle } from "react-icons/fa";
import { IoCloseOutline } from "react-icons/io5";

export default function Home() {
    const router = useRouter();
    const [component, setComponent] = useState("DashboardDefault");
    const [activeLink, setActiveLink] = useState("Dashboard");
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar visibility

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
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
            } catch (error) {
                console.error("Error fetching profile:", error);
                if (error.message === "Failed to fetch profile") {
                    localStorage.removeItem("Resident");
                    router.push("/Login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    useEffect(() => {
        if (isSidebarOpen) {
            document.body.style.overflow = "hidden"; // Disable scrolling for the entire page
        } else {
            document.body.style.overflow = "auto"; // Enable scrolling when sidebar is closed
        }
        return () => {
            document.body.style.overflow = "auto"; // Reset on unmount
        };
    }, [isSidebarOpen]);

    const handleLogout = () => {
        localStorage.removeItem("Resident");
        router.push("/"); // Redirect to the home page
    };

    const handleComponent = (item, linkName) => {
        setComponent(item);
        setActiveLink(linkName);
        setIsSidebarOpen(false); // Close sidebar on link click
    };

    const renderComponent = () => {
        switch (component) {
            case "Profile":
                return <Profile />;
            case "DashboardDefault":
            default:
                return <DashboardDefault />;
        }
    };

    return (
        <div className="relative flex flex-col min-h-screen bg-white text-black">
            {/* Overlay when sidebar is open */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-30" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* Header */}
            <div className="text-xl font-semibold bg-gray-100 justify-between items-center h-20 p-4 flex flex-row shadow-md w-full text-center sticky top-0 z-50 px-3 md:px-10">
                {!isSidebarOpen && <button className="lg:hidden text-black focus:outline-none" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                </button>}
                {isSidebarOpen && <IoCloseOutline className="text-3xl" onClick={() => setIsSidebarOpen(!isSidebarOpen)} />}
                <div className="heading"> Welcome to Resident Panel </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-1">
                {/* Sidebar */}
                <aside
                    className={`bg-gray-900 text-white w-80 py-5 fixed left-0 max-h-screen overflow-y-scroll z-40 transform transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
                >
                    <button
                        className="lg:hidden absolute top-4 right-4 text-black"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
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
                    <nav>
                        <ul className="text-base pb-20">
                            <li className="mb-1 font-semibold text-gray-400 px-5">Profile Management</li>
                            <Link href={"./Resident-dashboard/components/Profile"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaUser className="mr-2" /> Profile</li></Link>
                            <Link href={"./Resident-dashboard/components/Ownership"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaFileAlt className="mr-2" /> Ownership</li></Link>
                            <Link href={"./Resident-dashboard/components/House"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaHome className="mr-2" /> House</li></Link>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Property Actions</li>
                            <Link href={"./Resident-dashboard/components/SellProperty"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaClipboardList className="mr-2" /> Sell Property</li></Link>
                            <Link href={"./Resident-dashboard/components/SellItems"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaBox className="mr-2" /> Sell Items</li></Link>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Tenant Details</li>
                            <Link href={"./Resident-dashboard/components/TenantInfo"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaUserTie className="mr-2" /> Tenant Info</li></Link>
                            <Link href={"./Resident-dashboard/components/Lease"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaFileSignature className="mr-2" /> Lease</li></Link>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Utility Bills</li>
                            <Link href={"./Resident-dashboard/components/Bills"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaLightbulb className="mr-2" /> Bills</li></Link>
                            <Link href={"./Resident-dashboard/components/History"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaHistory className="mr-2" /> History</li></Link>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Maintenance Tickets</li>
                            <Link href={"./Resident-dashboard/components/NewRequest"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaTools className="mr-2" /> New Request</li></Link>
                            <Link href={"./Resident-dashboard/components/TrackRequest"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaSearch className="mr-2" /> Track Request</li></Link>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Notices / Polls & Surveys</li>
                            <Link href={"./Resident-dashboard/components/Announcements"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaBullhorn className="mr-2" /> Announcements</li></Link>
                            <Link href={"./Resident-dashboard/components/Polls"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaChartBar className="mr-2" /> Polls</li></Link>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Visitor Pre-Approvals</li>
                            <Link href={"./Resident-dashboard/components/VisitorEntry"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaIdBadge className="mr-2" /> Visitor Entry</li></Link>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Emergency Alerts</li>
                            <Link href={"./Resident-dashboard/components/Emergency"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600"><FaExclamationTriangle className="mr-2" /> Emergency</li></Link>
                            <li onClick={handleLogout} className="mb-1 flex text-lg items-center py-2 px-5 rounded cursor-pointer transition-all bg-red-800 hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <CiLogout className="mr-3" />
                                <a>Logout</a>
                            </li>
                        </ul>
                    </nav>
                </aside>

                {/* Main content */}
                <main className={`flex-1 bg-gray-50 lg:ml-80 transition-all duration-300 relative ${isSidebarOpen ? "bg-black bg-opacity-50 pointer-events-none" : "bg-opacity-100"}`}>
                    {loading ? <p>Loading...</p> : renderComponent()}
                </main>
            </div>
        </div>
    );
}
