import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import DashboardDefault from "./components/DashboardDefault";
import {
    HomeIcon as HomeIcon,
    User,
    LogOut,
    AlertTriangle,
    UserCircle,
    Bell,
    X,
    Camera,
    CheckCircle2,
    AlertCircle,
    Info,
    ChevronRight,
    Menu,
    Search
} from 'lucide-react';
import Preloader from "../components/Preloader";

export default function Home() {
    
    const [component, setComponent] = useState("DashboardDefault");
    const [activeLink, setActiveLink] = useState("Dashboard");
    const [loading, setLoading] = useState(true);
    
    const handleDashboardLoaded = () => {
        setLoading(false);
    };

    useEffect(() => {
        const maxLoadTimer = setTimeout(() => {
            setLoading(false);
        }, 2000);

        return () => clearTimeout(maxLoadTimer);
    }, []);

    return (
        <div className="relative flex flex-col min-h-screen  text-gray-900 bg-gradient-to-r from-indigo-100 to-purple-50">
            {/* Background pattern overlay */}
            <div className="absolute inset-0 z-0 opacity-10" 
                style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366F1' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px'
                }}>
            </div>
            
            {loading ? <Preloader /> : (
                <>
                    {/* Edge drag area for opening menu */}

                    {/* Main content - Full Screen */}
                    <main className="flex-1 relative z-10">
                        {component === "DashboardDefault" && <DashboardDefault onLoaded={handleDashboardLoaded} />}
                    </main>
                </>
            )}
        </div>
    );
}
