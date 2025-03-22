import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardDefault from "./components/DashboardDefault";
import Profile from "./components/Profile";
import Link from "next/link";
import { CiLogout } from "react-icons/ci";
import { FaUser, FaHome, FaClipboardList, FaIdBadge, FaExclamationTriangle, FaUserShield, FaVideo, FaHistory, FaClipboard, FaFileAlt } from "react-icons/fa";
import { IoCloseOutline, IoCameraReverseOutline } from "react-icons/io5";
import Preloader from "../components/Preloader";

export default function Home() {
    const router = useRouter();
    const [component, setComponent] = useState("DashboardDefault");
    const [activeLink, setActiveLink] = useState("Dashboard");
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar visibility
    const [securityDetails, setSecurityDetails] = useState({});
    const [securityId, setSecurityId] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("Security");
                if (!token) {
                    router.push("/SecurityLogin");
                    return;
                }

                const response = await fetch("/api/Security-Api/get-security-details", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch profile");
                }
                const data = await response.json();
                setSecurityDetails(data);
                setSecurityId(data.securityId || 'N/A');

            } catch (error) {
                console.error("Error fetching profile:", error);
                if (error.message === "Failed to fetch profile") {
                    localStorage.removeItem("Security");
                    router.push("/SecurityLogin");
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
        localStorage.removeItem("Security");
        router.push("/SecurityLogin"); // Redirect to the login page
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
                <div className="heading"> Welcome to Security Panel </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-1">
                {/* Sidebar */}
                <aside
                    className={`bg-gray-900 text-white w-80 py-5 fixed left-0 h-full overflow-y-scroll z-40 transform transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
                >
                    <nav>
                        <ul className="text-base pb-20">
                            <li className="flex justify-start items-center space-x-4 px-2 border-b border-gray-600 pb-4">
                                <div className="image-side relative w-16 h-16">
                                    <img
                                        src={securityDetails.userImage || "/profile.png"}
                                        alt="Profile"
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                    <Link href={"./Security-dashboard/components/uploadProfile"}><div className="changeProfile cursor-pointer z-50 w-12 h-5 bottom-0 rounded-b-full bg-white bg-opacity-60 absolute left-1/2 -translate-x-1/2 flex justify-center items-center shadow-md">
                                        <IoCameraReverseOutline className="text-black text-xl" />
                                    </div></Link>
                                </div>
                                <div className="details-side">
                                    <p className="userName font-semibold text-xl">{securityDetails?.name || 'N/A'}</p>
                                    <p className="Passcode font-semibold">
                                        Security ID: <span className="font-normal">{securityId}</span>
                                    </p>
                                    <p className="Passcode font-semibold">
                                        Gate: <span className="font-normal">{securityDetails?.gate || 'N/A'}</span>
                                    </p>
                                </div>
                            </li>
                            
                            <li className="mb-1 font-semibold text-gray-400 px-5 pt-2">Profile Management</li>
                            <Link href={"./Security-dashboard/components/Profile"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-green-600"><FaUser className="mr-2" /> Profile</li></Link>
                            <Link href={"./Security-dashboard/components/Dashboard"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-green-600"><FaHome className="mr-2" /> Dashboard</li></Link>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Visitor Management</li>
                            <Link href={"./Security-dashboard/components/VisitorEntry"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-green-600"><FaIdBadge className="mr-2" /> Visitor Entry</li></Link>
                            <Link href={"./Security-dashboard/components/VisitorLog"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-green-600"><FaClipboardList className="mr-2" /> Visitor Log</li></Link>
                            <Link href={"./Security-dashboard/components/PreApprovals"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-green-600"><FaClipboard className="mr-2" /> Pre-Approvals</li></Link>
                            
                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Security Operations</li>
                            <Link href={"./Security-dashboard/components/Patrols"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-green-600"><FaUserShield className="mr-2" /> Patrols</li></Link>
                            <Link href={"./Security-dashboard/components/IncidentReports"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-green-600"><FaFileAlt className="mr-2" /> Incident Reports</li></Link>
                            <Link href={"./Security-dashboard/components/CCTV"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-green-600"><FaVideo className="mr-2" /> CCTV Access</li></Link>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Activity Logs</li>
                            <Link href={"./Security-dashboard/components/ActivityLog"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-green-600"><FaHistory className="mr-2" /> Activity Log</li></Link>
                            <Link href={"./Security-dashboard/components/ShiftHandover"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-green-600"><FaClipboardList className="mr-2" /> Shift Handover</li></Link>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Emergency Protocols</li>
                            <Link href={"./Security-dashboard/components/Emergency"}><li className="mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-green-600"><FaExclamationTriangle className="mr-2" /> Emergency</li></Link>
                            
                            <li onClick={handleLogout} className="mb-1 flex text-lg items-center py-2 px-5 rounded cursor-pointer transition-all bg-green-800 hover:bg-gray-800 hover:border-r-4 hover:border-green-600">
                                <CiLogout className="mr-3" />
                                <a>Logout</a>
                            </li>
                        </ul>
                    </nav>
                </aside>

                {/* Main content */}
                <main className={`flex-1 bg-gray-50 lg:ml-80 transition-all duration-300 relative ${isSidebarOpen ? "bg-black bg-opacity-50 pointer-events-none" : "bg-opacity-100"}`}>
                    {loading ? <Preloader /> : renderComponent()}
                </main>
            </div>
        </div>
    );
}