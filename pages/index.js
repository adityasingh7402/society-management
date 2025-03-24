import Head from 'next/head';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Users, 
  Building, 
  Megaphone, 
  CreditCard, 
  Wrench, 
  Globe, 
  Shield, 
  UserCheck, 
  AlertTriangle 
} from 'lucide-react';

export default function Home() {
  const [isSocietyLogged, setIsSocietyLogged] = useState(false);

  useEffect(() => {
    // Check localStorage for the "Society" key
    const society = localStorage.getItem("Society");
    setIsSocietyLogged(!!society); // Update state based on existence of the "Society" key
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  // Header animation variants
  const headerVariants = {
    initial: { y: -100 },
    animate: { y: 0, transition: { type: 'spring', stiffness: 120 } }
  };

  // Button animation variants
  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.2)" },
    tap: { scale: 0.98 }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Head>
        <title>SocietyManage - Smart Community Management</title>
        <meta name="description" content="Simplify your society management with our comprehensive solution." />
      </Head>

      {/* Header Section with Animation */}
      <motion.header 
        className="bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-white shadow-lg sticky top-0 z-50"
        variants={headerVariants}
        initial="initial"
        animate="animate"
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <motion.h1 
            className="sm:text-xl md:text-3xl cursor-pointer font-bold"
            whileHover={{ scale: 1.05 }}
          >
            SocietyManage
          </motion.h1>
          <nav>
            <ul className="flex space-x-6">
              <motion.div whileHover={{ scale: 1.1 }}>
                <Link href={isSocietyLogged ? "/Society-dashboard" : "/societyLogin"}>
                  <div className="text-lg font-medium">
                    {isSocietyLogged ? "Dashboard" : "Society Login"}
                  </div>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }}>
                <Link href={"/Security-dashboard"}>
                  <div className="text-lg font-medium">Contact</div>
                </Link>
              </motion.div>
            </ul>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section with Enhanced Animations */}
      <section className="relative bg-gradient-to-b from-indigo-700 to-purple-800 bg-cover bg-center text-white pt-40 pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute w-64 h-64 bg-indigo-500 rounded-full opacity-20 -top-20 -left-20"
            animate={{ 
              y: [0, 20, 0],
              x: [0, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute w-96 h-96 bg-purple-500 rounded-full opacity-20 top-40 -right-40"
            animate={{ 
              y: [0, -30, 0],
              x: [0, -15, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.h1 
              className="text-6xl font-extrabold mb-6 leading-tight"
              animate={{ 
                scale: [1, 1.02, 1],
                transition: { duration: 3, repeat: Infinity, repeatType: "reverse" }
              }}
            >
              Manage Your Society <br/> with Ease and Efficiency
            </motion.h1>
            <motion.p 
              className="text-xl mb-10 max-w-2xl mx-auto opacity-90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              Streamline communication, manage finances, and ensure security with our all-in-one platform designed specifically for community living.
            </motion.p>
            <Link href={"./Enroll-society"}>
              <motion.button 
                className="bg-white text-indigo-700 px-10 py-4 rounded-full text-xl font-bold shadow-lg"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Enroll Your Society
              </motion.button>
            </Link>
          </motion.div>
        </div>
        
        {/* Animated Floating Elements */}
        <div className="relative h-40 mt-12">
          <motion.div
            className="absolute left-1/2 w-20 h-20 bg-indigo-400 rounded-full opacity-70"
            animate={{ 
              y: [0, -30, 0],
              x: [0, 20, 0, -20, 0]
            }}
            transition={{ 
              y: { duration: 2, repeat: Infinity, repeatType: "reverse" },
              x: { duration: 5, repeat: Infinity, repeatType: "reverse" }
            }}
          ></motion.div>
          
          <motion.div
            className="absolute left-1/4 w-14 h-14 bg-purple-400 rounded-full opacity-70"
            animate={{ 
              y: [0, -25, 0],
              x: [0, -15, 0, 15, 0]
            }}
            transition={{ 
              y: { duration: 1.8, repeat: Infinity, repeatType: "reverse", delay: 0.5 },
              x: { duration: 4.5, repeat: Infinity, repeatType: "reverse" }
            }}
          ></motion.div>
          
          <motion.div
            className="absolute right-1/4 w-16 h-16 bg-pink-400 rounded-full opacity-70"
            animate={{ 
              y: [0, -25, 0],
              x: [0, 25, 0, -25, 0]
            }}
            transition={{ 
              y: { duration: 2.2, repeat: Infinity, repeatType: "reverse", delay: 1 },
              x: { duration: 6, repeat: Infinity, repeatType: "reverse" }
            }}
          ></motion.div>
        </div>
      </section>

      {/* Features Section with Staggered Animation */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.span
              className="text-indigo-600 font-semibold text-lg"
              animate={{
                opacity: [0.8, 1, 0.8],
                transition: { duration: 2, repeat: Infinity }
              }}
            >
              POWERFUL FEATURES
            </motion.span>
            <motion.h2 
              className="text-4xl font-bold mt-2 text-slate-800"
              whileHover={{ scale: 1.02 }}
            >
              Everything You Need to Manage Your Community
            </motion.h2>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              { title: 'Resident Management', description: 'Easily manage profiles and information for all owners and tenants in your community.', icon: <Users size={48} /> },
              { title: 'Property Records', description: 'Maintain comprehensive property records with ownership history and tenant details.', icon: <Building size={48} /> },
              { title: 'Community Notices', description: 'Create, edit, and distribute important announcements to all residents instantly.', icon: <Megaphone size={48} /> },
              { title: 'Finance Management', description: 'Generate maintenance bills, track payments, and apply penalties with our intuitive system.', icon: <CreditCard size={48} /> },
              { title: 'Maintenance Tracking', description: 'Efficiently assign, approve and monitor all maintenance requests from residents.', icon: <Wrench size={48} /> },
              { title: 'Community Engagement', description: 'Foster community interaction with polls, surveys, and discussion forums.', icon: <Globe size={48} /> },
              { title: 'Security System', description: 'Enhanced security with comprehensive visitor monitoring and approval protocols.', icon: <Shield size={48} /> },
              { title: 'Visitor Verification', description: 'Implement thorough verification checks for every visitor entering your premises.', icon: <UserCheck size={48} /> },
              { title: 'Emergency Response', description: 'Rapid incident logging and emergency notification system for critical situations.', icon: <AlertTriangle size={48} /> }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="p-8 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300"
                variants={itemVariants}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div 
                  className="mb-6 text-indigo-600"
                  whileHover={{ rotate: 10 }}
                  animate={{ 
                    y: [0, -5, 0],
                    transition: { duration: 2, repeat: Infinity }
                  }}
                >
                  {feature.icon}
                </motion.div>
                <motion.h3 
                  className="text-xl font-semibold mb-4 text-slate-800"
                  whileHover={{ scale: 1.03 }}
                >
                  {feature.title}
                </motion.h3>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6 text-center">
          <motion.h2 
            className="text-3xl font-bold mb-8"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Ready to Transform How You Manage Your Society?
          </motion.h2>
          <Link href={"./Enroll-society"}>
            <motion.button 
              className="bg-white text-indigo-600 px-8 py-3 rounded-full text-lg font-bold shadow-lg"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Get Started Today
            </motion.button>
          </Link>
        </div>
      </motion.section>

      {/* Footer Section with Animation */}
      <motion.footer 
        id="contact" 
        className="bg-slate-900 text-white py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-4">SocietyManage</h3>
              <p className="text-slate-400">Simplified community management solution</p>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              viewport={{ once: true }}
              className="mt-6 md:mt-0"
            >
              <p className="mb-2">Contact us at</p>
              <motion.a 
                href="mailto:support@societymanage.com" 
                className="text-indigo-400 text-lg font-medium"
                whileHover={{ scale: 1.05 }}
              >
                support@societymanage.com
              </motion.a>
            </motion.div>
          </div>
          
          <motion.div 
            className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p>&copy; {new Date().getFullYear()} SocietyManage. All rights reserved.</p>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}