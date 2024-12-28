import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardDefault from "./components/DashboardDefault";
import Dashboard from "./components/SocietyProfile";
import NGOList from "./components/NGOList";
import VolunteerList from "./components/VolunteerList";
import DonationList from "./components/DonationList";

export default function Home() {
    const router = useRouter();
    const [component, setComponent] = useState("DashboardDefault");
    const [activeLink, setActiveLink] = useState("Dashboard");
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                setFormData(data);
            } catch (error) {
                console.error("Error fetching profile:", error);
                if (error.message === "Failed to fetch profile") {
                    router.push("/societyLogin");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleComponent = (item, linkName) => {
        setComponent(item);
        setActiveLink(linkName);
        setIsSidebarOpen(false); // Close menu on navigation
    };

    const renderComponent = () => {
        switch (component) {
            case "Dashboard":
                return <Dashboard />;
            case "NGOList":
                return <NGOList />;
            case "VolunteerList":
                return <VolunteerList />;
            case "DonationList":
                return <DonationList />;
            case "DashboardDefault":
            default:
                return <DashboardDefault />;
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside
                className={`bg-green-800 text-white w-64 min-h-screen p-4 transition-transform transform lg:translate-x-0 fixed lg:relative z-30 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <button
                    className="lg:hidden absolute top-4 right-4 text-white"
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
                <h1 className="text-2xl font-bold mb-6">Panel</h1>
                <nav>
                    <ul>
                        <li
                            className={`mb-2 flex items-center p-2 rounded cursor-pointer ${activeLink === "Dashboard" ? "bg-green-900" : ""}`}
                            onClick={() => handleComponent("DashboardDefault", "Dashboard")}
                        >
                            Dashboard
                        </li>
                        <li className="mt-4 text-lg font-semibold text-gray-200">Profile</li>
                        <li
                            className={`mb-2 flex items-center p-2 rounded cursor-pointer ${activeLink === "ProfileUpdate" ? "bg-green-900" : ""}`}
                            onClick={() => handleComponent("Dashboard", "ProfileUpdate")}
                        >
                            Profile Update
                        </li>
                        <li className="mt-6 font-semibold text-gray-200">Lists</li>
                        <li
                            onClick={() => handleComponent("NGOList", "NGOList")}
                            className={`mb-2 p-2 rounded cursor-pointer ${activeLink === "NGOList" ? "bg-green-900" : ""}`}
                        >
                            NGO List
                        </li>
                        <li
                            onClick={() => handleComponent("VolunteerList", "VolunteerList")}
                            className={`mb-2 p-2 rounded cursor-pointer ${activeLink === "VolunteerList" ? "bg-green-900" : ""}`}
                        >
                            Volunteer List
                        </li>
                        <li
                            onClick={() => handleComponent("DonationList", "DonationList")}
                            className={`mb-2 p-2 rounded cursor-pointer ${activeLink === "DonationList" ? "bg-green-900" : ""}`}
                        >
                            Donation List
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main content */}
            <main
                className={`flex-1 bg-gray-100 p-6 transition-all duration-300 ${isSidebarOpen ? "lg:ml-64" : "ml-0"
                    }`}
            >
                {/* Header */}
                <header className="flex justify-between items-center bg-white p-4 shadow-md sticky top-0 z-20">
                    <button
                        className="block lg:hidden text-gray-700 focus:outline-none"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
                                d="M4 6h16M4 12h16m-7 6h7"
                            />
                        </svg>
                    </button>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-gray-100 rounded-full px-4 py-2 w-48 sm:w-64"
                    />
                    {/* <div className="flex items-center space-x-4">
                        <span className="text-gray-700 font-semibold">
                            {loading ? "Loading..." : formData.email || "User"}
                        </span>
                    </div> */}
                </header>

                {/* Main Content */}
                <div onClick={() => setIsSidebarOpen(false)} className="space-y-4">{loading ? <p>Loading...</p> : renderComponent()}</div>
            </main>
        </div>
    );
}
