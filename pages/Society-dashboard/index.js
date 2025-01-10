import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardDefault from "./components/DashboardDefault";
import SocietyProfile from "./components/SocietyProfile";

export default function Home() {
    const router = useRouter();
    const [component, setComponent] = useState("DashboardDefault");
    const [activeLink, setActiveLink] = useState("Dashboard");
    const [loading, setLoading] = useState(true);

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

    const handleLogout = () => {
        localStorage.removeItem("Society")
        router.push("/"); // Redirect to the home page
    };
    const handleComponent = (item, linkName) => {
        setComponent(item);
        setActiveLink(linkName);
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
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="bg-green-800 text-white w-64 min-h-screen p-4">
                <h1 className="text-2xl font-bold mb-6">Panel</h1>
                <nav>
                    <ul className="text-xl">
                        <li
                            className={`mb-3 flex items-center p-2 rounded cursor-pointer ${activeLink === "Dashboard" ? "bg-green-900" : ""}`}
                            onClick={() => handleComponent("DashboardDefault", "Dashboard")}
                        >
                            Dashboard
                        </li>
                        <li
                            className={`mb-3 flex items-center p-2 rounded cursor-pointer ${activeLink === "SocietyProfile" ? "bg-green-900" : ""}`}
                            onClick={() => handleComponent("SocietyProfile", "SocietyProfile")}
                        >
                            Society Profile
                        </li>
                    </ul>
                    <button
                        onClick={handleLogout}
                        className="bg-green-600 w-full  text-white px-8 py-3 rounded-full text-xl shadow-lg hover:bg-green-700 transition"
                    >
                        Logout
                    </button>
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 bg-gray-100 p-6">
                {loading ? <p>Loading...</p> : renderComponent()}
            </main>
        </div>
    );
}
