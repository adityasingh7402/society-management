import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardDefault from "./components/DashboardDefault";
import Profile from "./components/Profile";

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
                <button
                    className="lg:hidden text-black focus:outline-none"
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
                <div className="heading"> Welcome to Resident Panel </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-1">
                {/* Sidebar */}
                <aside
                    className={`bg-white md:border-r-2 md:border-gray-200 text-black w-80 py-5 min-h-screen fixed left-0 z-40 transform transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                        } lg:translate-x-0`}
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
                        <ul className="text-xl">
                            <li
                                className={`mb-3 flex items-center py-3 px-5 rounded cursor-pointer relative transition-all ${activeLink === "Dashboard"
                                        ? "bg-gray-300 border-r-4 border-blue-600"
                                        : "hover:bg-gray-300 hover:border-r-4 hover:border-blue-600"
                                    }`}
                                onClick={() => handleComponent("DashboardDefault", "Dashboard")}
                            >
                                Dashboard
                            </li>
                        </ul>
                        <button
                            onClick={handleLogout}
                            className="bg-gray-300 w-full text-black px-8 py-3 rounded-full text-lg shadow-lg hover:bg-red-500 hover:text-white transition"
                        >
                            Logout
                        </button>
                    </nav>
                </aside>

                {/* Main content */}
                <main className="flex-1 bg-gray-50 lg:ml-80">
                    {loading ? <p>Loading...</p> : renderComponent()}
                </main>
            </div>
        </div>
    );
}
