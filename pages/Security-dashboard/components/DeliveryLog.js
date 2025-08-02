import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  User, LogOut, Home, Phone, Search, CheckCircle, Loader, XCircle
} from 'lucide-react';
import { FaArrowLeft } from "react-icons/fa";

const DeliveryLog = () => {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');

  const [fullScreenImage, setFullScreenImage] = useState(null);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/DeliveryApi/get-deliveries');
        if (!response.ok) {
          throw new Error('Failed to fetch delivery records');
        }
        const { deliveries } = await response.json(); // Extract the deliveries
        // Ensure deliveries is always an array
        setDeliveries(Array.isArray(deliveries) ? deliveries : []);
      } catch (error) {
        console.error('Error fetching deliveries:', error);
        showNotification("Failed to fetch deliveries", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, []);

  const showNotification = (message, type) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  const handleSendNotification = async (deliveryId) => {
    try {
      const response = await fetch('/api/DeliveryApi/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deliveryId })
      });
      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
      showNotification("Notification sent successfully", "success");
    } catch (error) {
      console.error('Error sending notification:', error);
      showNotification("Failed to send notification", "error");
    }
  };

  const handleMarkReceived = async (deliveryId) => {
    try {
      const response = await fetch('/api/DeliveryApi/mark-received', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deliveryId })
      });
      if (!response.ok) {
        throw new Error('Failed to mark as received');
      }
      setDeliveries(deliveries.filter(d => d._id !== deliveryId));
      showNotification("Marked as received", "success");
    } catch (error) {
      console.error('Error marking as received:', error);
      showNotification("Failed to mark as received", "error");
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearchTerm =
      delivery.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.recipientPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.flatNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearchTerm;
  });

  return (
    <>
      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <button 
              onClick={() => setFullScreenImage(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-40 transition-all"
              aria-label="Close full screen image"
            >
              <XCircle size={28} />
            </button>
            <img 
              src={fullScreenImage} 
              alt="Delivery" 
              className="max-h-[90vh] max-w-full mx-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center p-2 space-x-2 text-blue-500 hover:text-blue-600 font-medium transition-colors"
        >
          <FaArrowLeft size={18} />
          <span className="text-base">Back</span>
        </button>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-4 text-center">
        Current Deliveries
      </h1>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center">
            <Loader className="animate-spin h-8 w-8 text-blue-500 mb-2" />
            <p className="text-center">Loading deliveries...</p>
          </div>
        </div>
      )}

      <div className="mb-6 bg-gray-100 rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by recipient name, phone, or flat number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredDeliveries.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <User size={40} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 font-medium">No deliveries currently</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm ? 'Try changing your search term' : 'No deliveries recorded today'}
            </p>
          </div>
        ) : (
          filteredDeliveries.map((delivery) => (
            <div
              key={delivery._id}
              className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-green-500"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-800 flex items-center">
                      <User size={18} className="mr-2 text-blue-600" />
                      {delivery.recipientName}
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Delivered
                      </span>
                    </h3>

                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center mb-1">
                          <span className="font-medium">Company:</span>
                        </div>
                        <div className="text-gray-800 font-medium">{delivery.deliveryCompany}</div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <div className="flex items-center mb-1">
                          <span className="font-medium">Items:</span>
                        </div>
                        <div className="text-gray-800 font-medium">{delivery.deliveryItems}</div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <div className="flex items-center mb-1">
                          <span className="font-medium">Time:</span>
                        </div>
                        <div className="text-gray-800 font-medium">{new Date(delivery.deliveryTime).toLocaleString()}</div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <div className="flex items-center mb-1">
                          <Phone size={14} className="mr-1 text-gray-500" />
                          <span className="font-medium">Phone:</span>
                        </div>
                        <div className="text-gray-800 font-medium">{delivery.recipientPhone}</div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery person image and action buttons */}
                  <div className="ml-4 flex flex-col items-center">
                    {delivery.deliveryPersonImage ? (
                      <div 
                        className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer mb-3"
                        onClick={() => setFullScreenImage(delivery.deliveryPersonImage)}
                      >
                        <img 
                          src={delivery.deliveryPersonImage} 
                          alt={delivery.deliveryPersonName} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/profile.png'; // Fallback image
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-md bg-gray-100 flex items-center justify-center mb-3">
                        <User size={32} className="text-gray-400" />
                      </div>
                    )}

                    <button
                      onClick={() => handleSendNotification(delivery._id)}
                      className="mb-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center justify-center text-sm font-medium transition-colors"
                    >
                      Send Notification
                    </button>

                    <button
                      onClick={() => handleMarkReceived(delivery._id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center text-sm font-medium transition-colors"
                    >
                      Mark Received
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showPopup && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-xs animate-fade-in ${
          popupType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            <span className="mr-2 flex-shrink-0">
              {popupType === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            </span>
            <p className="text-sm">{popupMessage}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="ml-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 flex-shrink-0"
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default DeliveryLog;

