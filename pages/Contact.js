import Head from 'next/head';
import { motion } from 'framer-motion';
import { FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import { HiLocationMarker } from "react-icons/hi";
import Link from 'next/link';

export default function Contact() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Head>
        <title>Contact Us - Society Management System</title>
        <meta name="description" content="Get in touch with us for support and inquiries." />
      </Head>

      {/* Header Section */}
      <header className="bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">SocietyManage</h1>
          <nav>
            <ul className="flex space-x-6">
              <Link href={"/"}><div className="hover:underline text-lg font-medium">Home</div></Link>
              <Link href={"/contact"}><div className="hover:underline text-lg font-medium">Contact</div></Link>
            </ul>
          </nav>
        </div>
      </header>

      {/* Contact Section */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-4xl font-bold text-blue-600 mb-8">Get in Touch</h2>
            <p className="text-lg mb-12">We'd love to hear from you! Whether you have a question or need support, feel free to contact us.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              className="bg-white shadow-lg rounded-lg p-8"
              whileHover={{ scale: 1.05 }}
            >
              <h3 className="text-2xl font-semibold mb-4 text-blue-600">Contact Information</h3>
              <ul className="space-y-6">
                <li className="flex items-center space-x-4">
                  <FaPhoneAlt className="text-2xl text-blue-600" />
                  <span className="text-lg">+1 (123) 456-7890</span>
                </li>
                <li className="flex items-center space-x-4">
                  <FaEnvelope className="text-2xl text-blue-600" />
                  <span className="text-lg">support@societymanage.com</span>
                </li>
                <li className="flex items-center space-x-4">
                  <HiLocationMarker className="text-2xl text-blue-600" />
                  <span className="text-lg">123 Society Street, Cityville, Country</span>
                </li>
              </ul>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              className="bg-white shadow-lg rounded-lg p-8"
              whileHover={{ scale: 1.05 }}
            >
              <h3 className="text-2xl font-semibold mb-4 text-blue-600">Send Us a Message</h3>
              <form action="https://formspree.io/f/maykqwwp" method="POST" className="space-y-6">
                <div>
                  <label htmlFor="name" className="flex justify-start items-start text-lg font-medium">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full p-3 border border-gray-300 rounded-md"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="flex justify-start items-start text-lg font-medium">Your Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full p-3 border border-gray-300 rounded-md"
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="flex justify-start items-start text-lg font-medium">Your Message</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    className="w-full p-3 border border-gray-300 rounded-md"
                    placeholder="Type your message here"
                    rows="4"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-3 rounded-full text-xl shadow-lg hover:bg-blue-700 transition"
                >
                  Send Message
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} SocietyManage. All rights reserved.</p>
          <p>Contact us at <a href="mailto:support@societymanage.com" className="text-blue-400 hover:underline">support@societymanage.com</a></p>
        </div>
      </footer>
    </div>
  );
}
