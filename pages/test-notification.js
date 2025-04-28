import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Bell, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestNotification() {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const sampleData = {
    residentId: "6808a4b7c9509274ee105eb5",
    visitorId: "65a123b4c5d6e7f8g9h0i1j3",
    visitorName: "John Doe",
    guardName: "Security Guard",
    guardPhone: "1234567890",
    visitorReason: "Family Visit",
    entryTime: "2024-01-20T10:30:00"
  };

  const sendNotification = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/send-notification', sampleData);
      setNotification({
        type: 'success',
        message: 'Notification sent successfully!'
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to send notification'
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
            <div className="flex items-center justify-center space-x-3">
              <Bell className="text-white w-8 h-8" />
              <h1 className="text-3xl font-bold text-white">Test Notification System</h1>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Sample Visitor Data</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(sampleData).map(([key, value]) => (
                  <div key={key} className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm font-medium text-gray-500">{key}</p>
                    <p className="text-gray-800 mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Status */}
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-lg flex items-center ${
                  notification.type === 'success' 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                <p>{notification.message}</p>
              </motion.div>
            )}

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={sendNotification}
              disabled={loading}
              className={`w-full py-4 rounded-xl flex items-center justify-center space-x-2 text-white font-medium
                ${loading ? 'bg-gray-400' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}
            >
              {loading ? (
                <>
                  <motion.div 
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Test Notification</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}