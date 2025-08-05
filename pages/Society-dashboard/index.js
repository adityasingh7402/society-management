import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardDefault from "./components/DashboardDefault";
import SocietyProfile from "./components/SocietyProfile";
import OwnerProfiles from "./components/OwnerProfile";
import TenantProfiles from "./components/TenantProfile";
import MaintenanceBills from "./components/MaintenanceBills";
import UtilityBills from "./components/UtilityBills";
import AmenityBills from "./components/AmenityBills";
import PaymentTracking from "./components/PaymentTracking";
import Tickets from "./components/Tickets";
import Announcements from "./components/Announcements";
import PollsSurveys from "./components/PollsSurveys";
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
import ManageMembers from './components/ManageMembers';
import LogsOverview from './components/LogsOverview';
import LoadingScreen from './widget/societyComponents/loaderScreen';
import { FaUserTie, FaUsers, FaClipboardList, FaWrench, FaMoneyBill, FaStickyNote, FaBullhorn, FaPoll, FaComments, FaUserShield, FaBox, FaExclamationTriangle, FaFileAlt, FaUserClock, FaFileInvoiceDollar, FaUserCog, FaHistory } from "react-icons/fa";
import { CiLogout } from "react-icons/ci";
import React from "react";
import { motion } from "framer-motion";
import { PermissionsContext } from "../../components/PermissionsContext";
import DailyAttendanceProfile from './components/DailyAttendanceProfile';

// Sidebar navigation model
const NAV_SECTIONS = [
  {
    section: "Overview & Administration",
    items: [
      { label: "Dashboard", component: "DashboardDefault", icon: null, requiredPermissions: null },
      { label: "Society Profile", component: "SocietyProfile", icon: null, requiredPermissions: null },
      { label: "Apartment Structure", component: "ApartmentStructureForm", icon: null, requiredPermissions: null },
      { label: "Activity Logs", component: "LogsOverview", icon: <FaHistory className="mr-3" />, requiredPermissions: ["full_access"] },
    ],
  },
  {
    section: "Resident Management",
    items: [
      { label: "Pending Approvals", component: "PendingResidents", icon: <FaUserClock className="mr-3" />, requiredPermissions: ["manage_residents"] },
      { label: "Owner Directory", component: "OwnerProfiles", icon: <FaUserTie className="mr-3" />, requiredPermissions: ["manage_residents"] },
      { label: "Member Management", component: "ManageMembers", icon: <FaUserCog className="mr-3" />, requiredPermissions: ["manage_members"] },
    ],
  },
  {
    section: "Financial Management",
    items: [
      { label: "Bill Configuration", component: "BillHeads", icon: <FaFileInvoiceDollar className="mr-3" />, requiredPermissions: ["manage_bills"] },
      { label: "Scheduled Billing", component: "ScheduledBills", icon: <FaUserClock className="mr-3" />, requiredPermissions: ["manage_bills"] },
      { label: "Maintenance Charges", component: "MaintenanceBills", icon: <FaWrench className="mr-3" />, requiredPermissions: ["manage_bills"] },
      { label: "Utility Charges", component: "UtilityBills", icon: <FaClipboardList className="mr-3" />, requiredPermissions: ["manage_bills"] },
      { label: "Amenity Charges", component: "AmenityBills", icon: <FaClipboardList className="mr-3" />, requiredPermissions: ["manage_bills"] },
      { label: "Payment Collection", component: "PaymentTracking", icon: <FaMoneyBill className="mr-3" />, requiredPermissions: ["manage_bills"] },
      { label: "Financial Reports", component: "GeneralLedger", icon: <FaFileInvoiceDollar className="mr-3" />, requiredPermissions: ["view_reports"] },
    ],
  },
  {
    section: "Maintenance & Support",
    items: [
      { label: "Service Requests", component: "Tickets", icon: <FaStickyNote className="mr-3" />, requiredPermissions: ["manage_maintenance"] },
    ],
  },
  {
    section: "Community Engagement",
    items: [
      { label: "Announcements", component: "Announcements", icon: <FaBullhorn className="mr-3" />, requiredPermissions: ["manage_notices"] },
      { label: "Polls & Surveys", component: "PollsSurveys", icon: <FaPoll className="mr-3" />, requiredPermissions: ["manage_notices"] },
      { label: "Discussion Forums", component: "DiscussionForums", icon: <FaComments className="mr-3" />, requiredPermissions: ["manage_notices"] },
    ],
  },
  {
    section: "Security & Access Control",
    items: [
      { label: "Security Personnel", component: "SecurityProfile", icon: <FaUserShield className="mr-3" />, requiredPermissions: ["manage_security"] },
      { label: "Daily Attendance", component: "DailyAttendanceProfile", icon: <FaUsers className="mr-3" />, requiredPermissions: ["manage_security"] },
      { label: "Visitor Management", component: "VisitorEntry", icon: <FaUserShield className="mr-3" />, requiredPermissions: ["manage_security"] },
      { label: "Delivery Tracking", component: "DeliveryManagement", icon: <FaBox className="mr-3" />, requiredPermissions: ["manage_security"] },
      { label: "Emergency Management", component: "EmergencyAlerts", icon: <FaExclamationTriangle className="mr-3" />, requiredPermissions: ["manage_security"] },
      { label: "Incident Reports", component: "IncidentLogs", icon: <FaFileAlt className="mr-3" />, requiredPermissions: ["manage_security"] },
    ],
  },
];

// Build a mapping from component name to label
const componentToLabel = {};
NAV_SECTIONS.forEach(section => {
  section.items.forEach(item => {
    componentToLabel[item.component] = item.label;
  });
});

export default function Home() {
    const router = useRouter();
    const [component, setComponent] = useState("DashboardDefault");
    const [activeLink, setActiveLink] = useState("Dashboard");
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [managerDetails, setManagerDetails] = useState({});
    const [userPermissions, setUserPermissions] = useState([]);

    // Handle hash change and initial hash
    useEffect(() => {
        // Function to set component based on hash
        const handleHash = () => {
            const hash = window.location.hash.slice(1); // Remove the # symbol
            if (hash) {
                setComponent(hash);
                setActiveLink(componentToLabel[hash] || "Dashboard");
            } else {
                setComponent("DashboardDefault");
                setActiveLink("Dashboard");
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
                setUserPermissions(data.permissions || []);
            } catch (error) {
                console.error("Error fetching profile:", error);
                if (error.message === "Failed to fetch profile") {
                    localStorage.removeItem("Society");
                    router.push("/societyLog in");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [router]);
    console.log(userPermissions);

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
            case "AmenityBills":
                return <AmenityBills />;
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
            case "ManageMembers":
                return <ManageMembers />;
            case "DailyAttendanceProfile":
                return <DailyAttendanceProfile />;
            case "LogsOverview":
                return <LogsOverview />;
            default:
                return <DashboardDefault />;
        }
    };

    if (loading) {
      return <LoadingScreen />;
    }
    return (
      <PermissionsContext.Provider value={userPermissions}>
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
                        {NAV_SECTIONS.map((section, idx) => {
                          const visibleItems = section.items.filter(
                            item =>
                              !item.requiredPermissions ||
                              item.requiredPermissions.some(p => userPermissions.includes(p)) ||
                              userPermissions.includes("full_access")
                          );
                          if (visibleItems.length === 0) return null;
                          return (
                            <React.Fragment key={section.section}>
                              <li
                                className={`mb-1 font-semibold text-gray-400 px-5 border-b-gray-500 ${
                                  idx > 0 ? "border-t pt-2 border-gray-600" : ""
                                }`}
                              >
                                {section.section}
                              </li>
                              {visibleItems.map(item => (
                                <li
                                  key={item.label}
                                  className={`mb-1 flex items-center py-2 px-5 rounded cursor-pointer transition-all ${
                                    activeLink === item.label
                                      ? "bg-gray-800 border-r-4 border-red-600"
                                      : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"
                                  }`}
                                  onClick={() => handleComponent(item.component, item.label)}
                                >
                                  <a href={`#${item.component}`} className="flex items-center w-full">
                                    {item.icon}
                                    {item.label}
                                  </a>
                                </li>
                              ))}
                            </React.Fragment>
                          );
                        })}
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
      </PermissionsContext.Provider>
    );
}
