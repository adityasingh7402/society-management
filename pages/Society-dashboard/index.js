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
import PendingResidents from "./components/PendingResidents";
import BillHeads from "./components/BillHeads";
import GeneralLedger from './components/GeneralLedger';
import ScheduledBills from './components/ScheduledBills';
import { FaUserTie, FaUsers, FaClipboardList, FaWrench, FaMoneyBill, FaStickyNote, FaBullhorn, FaPoll, FaComments, FaUserShield, FaBox, FaExclamationTriangle, FaFileAlt, FaUserClock, FaFileInvoiceDollar } from "react-icons/fa";
import { CiLogout } from "react-icons/ci";

export default function Home() {
    const router = useRouter();
    const [component, setComponent] = useState("DashboardDefault");
    const [activeLink, setActiveLink] = useState("Dashboard");
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [managerDetails, setManagerDetails] = useState({});

    // Handle hash change and initial hash
    useEffect(() => {
        // Function to set component based on hash
        const handleHash = () => {
            const hash = window.location.hash.slice(1); // Remove the # symbol
            if (hash) {
                setComponent(hash);
                // Set the active link name based on the hash
                const linkName = hash.replace(/([A-Z])/g, ' $1').trim(); // Convert camelCase to space-separated
                setActiveLink(linkName);
            }
        };

        // Listen for hash changes
        window.addEventListener('hashchange', handleHash);
        
        // Handle initial hash on load
        handleHash();

        return () => {
            window.removeEventListener('hashchange', handleHash);
        };
    }, []);

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
        // Update URL hash without triggering a page reload
        window.location.hash = item;
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
            case "PendingResidents":
                return <PendingResidents />;
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
            case "BillHeads":
                return <BillHeads />;
            case "GeneralLedger":
                return <GeneralLedger />;
            case "ScheduledBills":
                return <ScheduledBills />;
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
                                <a href="#DashboardDefault" className="flex items-center w-full">
                                    Dashboard
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Society Profile" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("SocietyProfile", "Society Profile")}
                            >
                                <a href="#SocietyProfile" className="flex items-center w-full">
                                    Society Profile
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Apartment Structure Form" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("ApartmentStructureForm", "Apartment Structure Form")}
                            >
                                <a href="#ApartmentStructureForm" className="flex items-center w-full">
                                    Apartment Structure Form
                                </a>
                            </li>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Resident Management</li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Pending Residents" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("PendingResidents", "Pending Residents")}
                            >
                                <a href="#PendingResidents" className="flex items-center w-full">
                                    <FaUserClock className="mr-3" />
                                    Pending Residents
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Owner Profiles" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("OwnerProfiles", "Owner Profiles")}
                            >
                                <a href="#OwnerProfiles" className="flex items-center w-full">
                                    <FaUserTie className="mr-3" />
                                    Owner Profiles
                                </a>
                            </li>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Finance & Maintenance</li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Bill Heads" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("BillHeads", "Bill Heads")}
                            >
                                <a href="#BillHeads" className="flex items-center w-full">
                                    <FaFileInvoiceDollar className="mr-3" />
                                    Bill Heads
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Maintenance Bills" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("MaintenanceBills", "Maintenance Bills")}
                            >
                                <a href="#MaintenanceBills" className="flex items-center w-full">
                                    <FaWrench className="mr-3" />
                                    Maintenance Bills
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Utility Bills" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("UtilityBills", "Utility Bills")}
                            >
                                <a href="#UtilityBills" className="flex items-center w-full">
                                    <FaClipboardList className="mr-3" />
                                    Utility Bills
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Payment Tracking" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("PaymentTracking", "Payment Tracking")}
                            >
                                <a href="#PaymentTracking" className="flex items-center w-full">
                                    <FaMoneyBill className="mr-3" />
                                    Payment Tracking
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Tickets" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("Tickets", "Tickets")}
                            >
                                <a href="#Tickets" className="flex items-center w-full">
                                    <FaStickyNote className="mr-3" />
                                    Tickets
                                </a>
                            </li>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Notices & Community</li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Announcements" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("Announcements", "Announcements")}
                            >
                                <a href="#Announcements" className="flex items-center w-full">
                                    <FaBullhorn className="mr-3" />
                                    Announcements
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Polls & Surveys" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("PollsSurveys", "Polls & Surveys")}
                            >
                                <a href="#PollsSurveys" className="flex items-center w-full">
                                    <FaPoll className="mr-3" />
                                    Polls & Surveys
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Discussion Forums" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("DiscussionForums", "Discussion Forums")}
                            >
                                <a href="#DiscussionForums" className="flex items-center w-full">
                                    <FaComments className="mr-3" />
                                    Discussion Forums
                                </a>
                            </li>

                            <li className="mb-1 font-semibold text-gray-400 px-5 border-t border-gray-600 pt-2">Security & Emergency</li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Security Profile" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("SecurityProfile", "Security Profile")}
                            >
                                <a href="#SecurityProfile" className="flex items-center w-full">
                                    <FaUserShield className="mr-3" />
                                    Security Profile
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Visitor Entry" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("VisitorEntry", "Visitor Entry")}
                            >
                                <a href="#VisitorEntry" className="flex items-center w-full">
                                    <FaUserShield className="mr-3" />
                                    Visitor Entry
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Delivery Management" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("DeliveryManagement", "Delivery Management")}
                            >
                                <a href="#DeliveryManagement" className="flex items-center w-full">
                                    <FaBox className="mr-3" />
                                    Delivery Management
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Emergency Alerts" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("EmergencyAlerts", "Emergency Alerts")}
                            >
                                <a href="#EmergencyAlerts" className="flex items-center w-full">
                                    <FaExclamationTriangle className="mr-3" />
                                    Emergency Alerts
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Incident Logs" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("IncidentLogs", "Incident Logs")}
                            >
                                <a href="#IncidentLogs" className="flex items-center w-full">
                                    <FaFileAlt className="mr-3" />
                                    Incident Logs
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "General Ledger" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("GeneralLedger", "General Ledger")}
                            >
                                <a href="#GeneralLedger" className="flex items-center w-full">
                                    <FaFileInvoiceDollar className="mr-3" />
                                    General Ledger
                                </a>
                            </li>
                            <li
                                className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${activeLink === "Scheduled Bills" ? "bg-gray-800 border-r-4 border-red-600" : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"}`}
                                onClick={() => handleComponent("ScheduledBills", "Scheduled Bills")}
                            >
                                <a href="#ScheduledBills" className="flex items-center w-full">
                                    <FaUserClock className="mr-3" />
                                    Scheduled Bills
                                </a>
                            </li>
                            <li onClick={handleLogout} className="mb-1 flex text-lg items-center py-2 px-5 rounded cursor-pointer transition-all bg-red-800 hover:bg-gray-800 hover:border-r-4 hover:border-red-600">
                                <CiLogout className="mr-3" />
                                <a>Logout</a>
                            </li>
                        </ul>
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
