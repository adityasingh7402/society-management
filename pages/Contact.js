import Head from 'next/head';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, User, MessageSquare, ChevronRight } from "lucide-react";
import Link from 'next/link';
import { useState } from 'react';

export default function Contact() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      // Reset form after submission
      setFormState({
        name: '',
        email: '',
        message: ''
      });
    }, 1500);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const contactInfoAnimation = {
    hover: {
      scale: 1.05,
      backgroundColor: "#f0f9ff",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      <Head>
        <title>Contact Us - Society Management System</title>
        <meta name="description" content="Get in touch with us for support and inquiries." />
      </Head>

      {/* Header Section */}
      <motion.header 
        className="bg-gradient-to-r from-blue-600 to-blue-800 py-3 text-white shadow-lg sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <motion.h1 
            className="text-2xl md:text-3xl font-bold"
            whileHover={{ scale: 1.05 }}
          >
            SocietyManage
          </motion.h1>
          <nav>
            <ul className="flex space-x-6">
              <motion.li whileHover={{ scale: 1.1 }}>
                <Link href={"/"}>
                  <div className="hover:underline text-lg font-medium flex items-center">
                    Home
                    <motion.div whileHover={{ x: 5 }}>
                      <ChevronRight className="ml-1 w-4 h-4" />
                    </motion.div>
                  </div>
                </Link>
              </motion.li>
              <motion.li whileHover={{ scale: 1.1 }}>
                <Link href={"/Enroll-society"}>
                  <div className="hover:underline text-lg font-medium flex items-center">
                    Enroll Society
                    <motion.div whileHover={{ x: 5 }}>
                      <ChevronRight className="ml-1 w-4 h-4" />
                    </motion.div>
                  </div>
                </Link>
              </motion.li>
            </ul>
          </nav>
        </div>
      </motion.header>

      {/* Contact Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-blue-700 mb-6">Get in Touch</h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              We'd love to hear from you! Whether you have a question about our services or need support, our team is ready to help.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
            {/* Contact Information */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-2 space-y-6"
            >
              <motion.div 
                variants={itemVariants}
                whileHover={contactInfoAnimation.hover}
                className="bg-white rounded-xl shadow-md p-6 transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Phone className="text-blue-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Phone</h3>
                    <p className="text-gray-600">+1 (123) 456-7890</p>
                    <p className="text-gray-600 mt-1">Mon-Fri: 9am to 6pm</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                whileHover={contactInfoAnimation.hover}
                className="bg-white rounded-xl shadow-md p-6 transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Mail className="text-blue-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Email</h3>
                    <p className="text-gray-600">support@societymanage.com</p>
                    <p className="text-gray-600 mt-1">We reply within 24 hours</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                whileHover={contactInfoAnimation.hover}
                className="bg-white rounded-xl shadow-md p-6 transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <MapPin className="text-blue-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Office</h3>
                    <p className="text-gray-600">123 Society Street,</p>
                    <p className="text-gray-600">Cityville, Country</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-3 bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-8 md:p-10">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Send Us a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label htmlFor="name" className="flex items-center text-gray-700 font-medium mb-2">
                      <User className="w-4 h-4 mr-2 text-blue-600" />
                      Your Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formState.name}
                        onChange={handleChange}
                        required
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label htmlFor="email" className="flex items-center text-gray-700 font-medium mb-2">
                      <Mail className="w-4 h-4 mr-2 text-blue-600" />
                      Your Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formState.email}
                        onChange={handleChange}
                        required
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label htmlFor="message" className="flex items-center text-gray-700 font-medium mb-2">
                      <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formState.message}
                      onChange={handleChange}
                      required
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Tell us how we can help you"
                      rows="5"
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="pt-2"
                  >
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg text-lg font-semibold shadow-lg transition-all flex items-center justify-center"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          Send Message
                          <Send className="ml-2 w-5 h-5" />
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section as a bonus */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="py-16 bg-blue-50"
      >
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-blue-700 mb-12">Frequently Asked Questions</h2>
          
          <div className="max-w-3xl mx-auto grid gap-6">
            {[
              { q: "How long does it take to get a response?", a: "We aim to respond to all inquiries within 24 hours during business days." },
              { q: "What information should I include in my message?", a: "Please include your society name, your role, and specific details about your query to help us assist you better." },
              { q: "Do you offer phone support?", a: "Yes, our support team is available Monday to Friday from 9am to 6pm." }
            ].map((faq, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * index }}
                className="bg-white rounded-lg shadow-md p-6"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer Section */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold mb-4">SocietyManage</h3>
              <p className="text-gray-300 mb-4">Simplifying community management.</p>
              <div className="flex space-x-4">
                {['twitter', 'facebook', 'instagram'].map((social, i) => (
                  <motion.a 
                    key={i}
                    href="#" 
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    className="bg-gray-700 p-2 rounded-full"
                  >
                    <span className="sr-only">{social}</span>
                    <div className="w-5 h-5 bg-white rounded-full"></div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-right"
            >
              <p>&copy; {new Date().getFullYear()} SocietyManage. All rights reserved.</p>
              <p className="mt-2">
                <a href="mailto:support@societymanage.com" className="text-blue-400 hover:underline flex items-center justify-end">
                  <Mail className="w-4 h-4 mr-2" />
                  support@societymanage.com
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
}