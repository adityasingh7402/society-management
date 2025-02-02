import Head from 'next/head';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FcSwitchCamera } from "react-icons/fc";
import Link from 'next/link';

export default function Home() {
  const [isSocietyLogged, setIsSocietyLogged] = useState(false);

  useEffect(() => {
    // Check localStorage for the "Society" key
    const society = localStorage.getItem("Society");
    setIsSocietyLogged(!!society); // Update state based on existence of the "Society" key
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Head>
        <title>Society Management Application</title>
        <meta name="description" content="Simplify your society management with our comprehensive solution." />
      </Head>

      {/* Header Section */}
      <header className="bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="sm:text-xl md:text-3xl font-bold">SocietyManage</h1>
          <nav>
            <ul className="flex space-x-6">
              <Link href={isSocietyLogged ? "/Society-dashboard" : "/societyLogin"}>
                <div className="hover:underline text-lg font-medium">
                  {isSocietyLogged ? "Dashboard" : "Society Login"}
                </div>
              </Link>
              <Link href={"/Contact"}>
                <div className="hover:underline text-lg font-medium">Contact</div>
              </Link>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-blue-700 bg-cover bg-center text-white pt-40 pb-10">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-6xl font-extrabold mb-6">Manage Your Society with Ease</h1>
            <p className="text-lg mb-8">
              Streamline communication, manage finances, and ensure security with our all-in-one platform.
            </p>
            <Link href={"./Enroll-society"}>
              <button className="bg-white text-blue-600 px-8 py-3 rounded-full text-xl shadow-lg hover:bg-gray-100">
                Enroll Society
              </button>
            </Link>
          </motion.div>
        </div>
        <div className="ball flex justify-center items-center mt-14">
          <motion.div
            className="transform -translate-x-1/2 w-20 h-20 bg-blue-500 rounded-full animate-bounce"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          ></motion.div>
        </div>
      </section>

      <section id="features" className="py-20 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Resident Management', description: 'Manage profiles of owners and tenants efficiently.', icon: '👥' },
              { title: 'Property Management', description: 'Maintain detailed property records, ownership, and tenant details.', icon: '🏠' },
              { title: 'Notices', description: 'Post, edit, or remove announcements for residents.', icon: '📢' },
              { title: 'Finance Management', description: 'Generate and send maintenance bills, track payments, and apply penalties.', icon: '💳' },
              { title: 'Maintenance Requests', description: 'Approve, assign, and monitor maintenance tickets.', icon: '🛠️' },
              { title: 'Community Features', description: 'Initiate polls, surveys, and manage forums.', icon: '🌐' },
              { title: 'Security Management', description: 'Monitor visitor logs and ensure secure approvals.', icon: '🛡️' },
              { title: 'Security Check', description: 'Security check on every Visitor.', icon: `👮‍♂️` },
              { title: 'Emergency Protocols', description: 'Log incidents and send emergency notifications.', icon: '🚨' }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="p-6 bg-white shadow-lg rounded-lg text-center transition-transform transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-4 text-blue-600">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer id="contact" className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} SocietyManage. All rights reserved.</p>
          <p>
            Contact us at{" "}
            <a href="mailto:support@societymanage.com" className="text-blue-400 hover:underline">
              support@societymanage.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
