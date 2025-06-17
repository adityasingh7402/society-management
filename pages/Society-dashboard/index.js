import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardDefault from "./components/DashboardDefault";
import SocietyProfile from "./components/SocietyProfile";
import OwnerProfiles from "./components/OwnerProfile";
import TenantProfiles from "./components/TenantProfile";
import MaintenanceBills from "./components/MaintenanceBills";
import UtilityBills from "./components/UtilityBills";
import PaymentTracking from "./components/PaymentTracking";
import Tickets from "./components/Tickets";
import Announcements from "./components/Announcements";
import PollsSurveys from "./components/PollsSurveys";
import PreloaderSociety from "../components/PreloaderSociety";
import DiscussionForums from "./components/DiscussionForums";
import ApartmentStructureForm from "./components/ApartmentStructureForm";
import VisitorEntry from "./components/VisitorEntry";
import DeliveryManagement from "./components/DeliveryManagement";
import EmergencyAlerts from "./components/EmergencyAlerts";
import SecurityProfile from "./components/SecurityProfile";
import IncidentLogs from "./components/IncidentLogs";
import { FaUserTie, FaUsers, FaClipboardList, FaWrench, FaMoneyBill, FaStickyNote, FaBullhorn, FaPoll, FaComments, FaUserShield, FaBox, FaExclamationTriangle, FaFileAlt } from "react-icons/fa";
import { CiLogout } from "react-icons/ci";

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
            case "DashboardDefault":
                return <DashboardDefault />;
            case "SocietyProfile":
                return <SocietyProfile />;
            case "ApartmentStructureForm":
                return <ApartmentStructureForm />;
            case "OwnerProfiles":
                return <OwnerProfiles />;
            case "TenantProfiles":
                return <TenantProfiles />;
            case "MaintenanceBills":
                return <MaintenanceBills />;
            case "SecurityProfile":
                return <SecurityProfile />;
            case "UtilityBills":
                return <UtilityBills />;
            case "PaymentTracking":
                return <PaymentTracking />;
            case "Tickets":
                return <Tickets />;
            case "Announcements":
                return <Announcements />;
            case "PollsSurveys":
                return <PollsSurveys />;
            case "DiscussionForums":
                return <DiscussionForums />;
            case "VisitorEntry":
                return <VisitorEntry />;
            case "DeliveryManagement":
                return <DeliveryManagement />;
            case "EmergencyAlerts":
                return <EmergencyAlerts />;
            case "IncidentLogs":
                return <IncidentLogs />;
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
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Dashboard" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("DashboardDefault", "Dashboard")}
                            >
                                Dashboard
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "SocietyProfile" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("SocietyProfile", "SocietyProfile")}
                            >
                                Society Profile
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "ApartmentStructureForm" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("ApartmentStructureForm", "ApartmentStructureForm")}
                            >
                                Apartment Structure Form
                            </li>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Resident Management</li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "OwnerProfiles" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("OwnerProfiles", "OwnerProfiles")}
                            >
                                <FaUserTie className="mr-3" />
                                Owner Profiles
                            </li>
                            {/* <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "TenantProfiles" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("TenantProfiles", "TenantProfiles")}
                            >
                                <FaUsers className="mr-3" />
                                Tenant Profiles
                            </li> */}

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Finance & Maintenance</li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "MaintenanceBills" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("MaintenanceBills", "MaintenanceBills")}
                            >
                                <FaWrench className="mr-3" />
                                Maintenance Bills
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "UtilityBills" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("UtilityBills", "UtilityBills")}
                            >
                                <FaClipboardList className="mr-3" />
                                Utility Bills
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "PaymentTracking" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("PaymentTracking", "PaymentTracking")}
                            >
                                <FaMoneyBill className="mr-3" />
                                Payment Tracking
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Tickets" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("Tickets", "Tickets")}
                            >
                                <FaStickyNote className="mr-3" />
                                Tickets
                            </li>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Notices & Community</li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Announcements" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("Announcements", "Announcements")}
                            >
                                <FaBullhorn className="mr-3" />
                                Announcements
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "PollsSurveys" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("PollsSurveys", "PollsSurveys")}
                            >
                                <FaPoll className="mr-3" />
                                Polls & Surveys
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "DiscussionForums" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("DiscussionForums", "DiscussionForums")}
                            >
                                <FaComments className="mr-3" />
                                Discussion Forums
                            </li>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Security & Emergency</li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "SecurityProfile" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("SecurityProfile", "SecurityProfile")}
                            >
                                <FaUserShield className="mr-3" />
                                Security Profile
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "VisitorEntry" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("VisitorEntry", "VisitorEntry")}
                            >
                                <FaUserShield className="mr-3" />
                                Visitor Entry
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "DeliveryManagement" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("DeliveryManagement", "DeliveryManagement")}
                            >
                                <FaBox className="mr-3" />
                                Delivery Management
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "EmergencyAlerts" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("EmergencyAlerts", "EmergencyAlerts")}
                            >
                                <FaExclamationTriangle className="mr-3" />
                                Emergency Alerts
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "IncidentLogs" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("IncidentLogs", "IncidentLogs")}
                            >
                                <FaFileAlt className="mr-3" />
                                Incident Logs
                            </li>
                            <li onClick={handleLogout} className="mb-1 flex text-lg items-center py-2 px-5 rounded cursor-pointer transition-all bg-red-800 hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <CiLogout className="mr-3" />
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
                    {renderComponent()}
                </main>
            </div>
        </div>
    );
}
