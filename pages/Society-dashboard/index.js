import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardDefault from "./components/DashboardDefault";
import SocietyProfile from "./components/SocietyProfile";
import Link from "next/link";
import { FaUserTie, FaUsers, FaClipboardList, FaWrench, FaMoneyBill, FaChartBar, FaStickyNote, FaBullhorn, FaPoll, FaComments, FaUserShield, FaBox, FaExclamationTriangle, FaFileAlt } from "react-icons/fa";

export default function Home() {
    const router = useRouter();
    const [component, setComponent] = useState("DashboardDefault");
    const [activeLink, setActiveLink] = useState("Dashboard");
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [managerDetails, setManagerDetails] = useState({});

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("Society");
                if (!token) {
                    router.push("/societyLogin");
                    return;
                }

                const response = await fetch("/api/Society-Api/get-society-details", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch profile");
                }
                const data = await response.json();
                setManagerDetails(data);
            } catch (error) {
                console.error("Error fetching profile:", error);
                if (error.message === "Failed to fetch profile") {
                    localStorage.removeItem("Society");
                    router.push("/societyLogin");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("Society");
        router.push("/");
    };

    const handleComponent = (item, linkName) => {
        setComponent(item);
        setActiveLink(linkName);
        setIsSidebarOpen(false);
    };

    const renderComponent = () => {
        switch (component) {
            case "SocietyProfile":
                return <SocietyProfile />;
            case "DashboardDefault":
            default:
                return <DashboardDefault />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            {/* Navbar */}
            <div className="text-xl font-semibold bg-white h-20 p-4 flex justify-between items-center shadow-md w-full sticky top-0 z-50">
                <button className="lg:hidden text-gray-700" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                </button>
                <div className="heading">Welcome to Society Panel</div>
                <div className="heading">{managerDetails.managerName}</div>
            </div>

            {/* Layout Container */}
            <div className="flex flex-1 min-h-screen">
                {/* Sidebar */}
                <aside
                    className={`bg-gray-900 text-white w-80 py-5 fixed left-0 h-screen overflow-y-scroll z-40 transform transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
                >
                    {/* Close Button for Mobile */}
                    <button className="lg:hidden absolute top-4 right-4 text-white" onClick={() => setIsSidebarOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <nav>
                        <ul className="text-base pb-20">
                            <li className="mb-1 font-semibold text-gray-400 px-5">Main</li>
                            <li
                                className={`mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Dashboard" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("DashboardDefault", "Dashboard")}
                            >
                                Dashboard
                            </li>
                            <li
                                className={`mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "SocietyProfile" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("SocietyProfile", "SocietyProfile")}
                            >
                                Society Profile
                            </li>

                            <li className="mb-1 font-semibold text-gray-400 px-5">Resident Management</li>
                            <li className="mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaUserTie className="mr-3" />
                                <Link href="/owner-profiles">Owner Profiles</Link>
                            </li>
                            <li className="mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaUsers className="mr-3" />
                                <Link href="/tenant-profiles">Tenant Profiles</Link>
                            </li>

                            <li className="mb-1 font-semibold text-gray-400 px-5">Finance & Maintenance</li>
                            <li className="mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaWrench className="mr-3" />
                                <Link href="/maintenance-bills">Maintenance Bills</Link>
                            </li>
                            <li className="mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaWrench className="mr-3" />
                                <Link href="/utility-bills">Utility Bills</Link>
                            </li>
                            <li className="mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaWrench className="mr-3" />
                                <Link href="/payment-tracking">Payment Tracking</Link>
                            </li>
                            <li className="mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaWrench className="mr-3" />
                                <Link href="/tickets">Ticketss</Link>
                            </li>

                            <li className="mb-1 font-semibold text-gray-400 px-5">Notices & Community</li>
                            <li className="mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaBullhorn className="mr-3" />
                                <Link href="/announcements">Announcements</Link>
                            </li>
                            <li className="mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaBullhorn className="mr-3" />
                                <Link href="/polls-surveys">Polls & Surveys</Link>
                            </li>
                            <li className="mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaBullhorn className="mr-3" />
                                <Link href="/discussion-forums">Discussion Forums</Link>
                            </li>

                            <li className="mb-1 font-semibold text-gray-400 px-5">Security & Emergency</li>
                            <li className="mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaExclamationTriangle className="mr-3" />
                                <Link href="/visitor-logs">Visitor Logs</Link>
                            </li>
                            <li className="mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaExclamationTriangle className="mr-3" />
                                <Link href="/delivery-management">Delivery Management</Link>
                            </li>
                            <li className="mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaExclamationTriangle className="mr-3" />
                                <Link href="/emergency-alerts">Emergency Alerts</Link>
                            </li>
                            <li className="mb-2 flex items-center py-2 px-5 rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaExclamationTriangle className="mr-3" />
                                <Link href="/incident-logs">Incident Logs</Link>
                            </li>
                            <li onClick={handleLogout} className="mb-2 flex text-lg items-center py-2 px-5 rounded cursor-pointer transition-all bg-red-800 hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <FaExclamationTriangle className="mr-3" />
                                <a>Logout</a>
                            </li>

                        </ul>
                        {/* <button onClick={handleLogout} className="bg-gray-700 w-full text-white px-8 py-3 rounded-full text-lg shadow-lg hover:bg-red-600 transition">
                            Logout
                        </button> */}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 bg-gray-100 lg:ml-80">
                    {loading ? <p>Loading...</p> : renderComponent()}
                </main>
            </div>
        </div>
    );
}
