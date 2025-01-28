import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardDefault from "./components/DashboardDefault";
import SocietyProfile from "./components/SocietyProfile";

export default function Home() {
    const router = useRouter();
    const [component, setComponent] = useState("DashboardDefault");
    const [activeLink, setActiveLink] = useState("Dashboard");
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility
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
                setManagerDetails(data)
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
        router.push("/"); // Redirect to the home page
    };

    const handleComponent = (item, linkName) => {
        setComponent(item);
        setActiveLink(linkName);
        setIsSidebarOpen(false); // Close the sidebar when a link is clicked
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
            {/* Full-width h1 at the top */}

            <div className="text-xl font-semibold bg-white justify-between items-center h-20 p-4 flex flex-row shadow-md w-full text-center sticky top-0 z-50 px-3 md:px-10">

                <button
                    className="lg:hidden text-gray-700 focus:outline-none"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                </button>
                <div className="heading"> Welcome to Society Panel </div>
                <div className="heading"> {managerDetails.managerName} </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-1">
                {/* Sidebar */}
                <aside
                    className={`bg-gray-900 text-white w-80 py-5 min-h-screen fixed left-0 z-40 transform transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                        } lg:translate-x-0`}
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
                    <nav>
                        <ul className="text-xl">
                            <li
                                className={`mb-3 flex items-center py-3 px-5 rounded cursor-pointer relative transition-all ${activeLink === "Dashboard"
                                        ? "bg-gray-800 border-r-4 border-red-600"
                                        : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"
                                    }`}
                                onClick={() => handleComponent("DashboardDefault", "Dashboard")}
                            >
                                Dashboard
                            </li>
                            <li
                                className={`mb-3 flex items-center py-3 px-5 rounded cursor-pointer relative transition-all ${activeLink === "SocietyProfile"
                                        ? "bg-gray-800 border-r-4 border-red-600"
                                        : "hover:bg-gray-800 hover:border-r-4 hover:border-red-600"
                                    }`}
                                onClick={() => handleComponent("SocietyProfile", "SocietyProfile")}
                            >
                                Society Profile
                            </li>
                        </ul>
                        <button
                            onClick={handleLogout}
                            className="bg-gray-700 w-full text-white px-8 py-3 rounded-full text-lg shadow-lg hover:bg-red-600 transition"
                        >
                            Logout
                        </button>
                    </nav>
                </aside>



                {/* Main content */}
                <main className="flex-1 bg-gray-100 lg:ml-64">
                    {/* Header with the sidebar toggle button */}

                    {/* Render the main content */}
                    {loading ? <p>Loading...</p> : renderComponent()}
                </main>
            </div>
        </div>
    );
}