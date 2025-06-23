import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PropertyChat = () => {
  const router = useRouter();
  const { buyerId, propertyId } = router.query;
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [residentData, setResidentData] = useState(null);
  const [propertyData, setPropertyData] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    console.log('Loading state:', { loading, hasResidentData: !!residentData, hasPropertyData: !!propertyData, hasOtherUser: !!otherUser });
  }, [loading, residentData, propertyData, otherUser]);

  useEffect(() => {
    if (router.isReady) {
      console.log('Router is ready, fetching resident data');
      fetchResidentData();
    }
  }, [router.isReady]);

  useEffect(() => {
    if (propertyId && residentData) {
      console.log('Have propertyId and residentData, fetching property data');
      fetchPropertyData();
      fetchMessages();
      fetchUnreadCount();
      // Set up real-time updates
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [propertyId, residentData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchResidentData = async () => {
    try {
      const token = localStorage.getItem('Resident');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/Resident-Api/get-resident-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resident details');
      }

      const data = await response.json();
      setResidentData(data);
    } catch (error) {
      console.error('Error fetching resident details:', error);
      toast.error('Failed to load user details');
      setLoading(false);
    }
  };

  const fetchPropertyData = async () => {
    if (!propertyId) {
      console.error('No property ID available');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('Resident');
      const response = await axios.get(`/api/Property-Api/get-property?propertyId=${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setPropertyData(response.data);
      
      // Only proceed if we have both resident data and property data
      if (residentData && response.data) {
        // Set other user based on whether current user is buyer or seller
        const otherUserId = residentData._id === response.data.sellerId ? buyerId : response.data.sellerId;
        if (otherUserId) {
          await fetchOtherUserDetails(otherUserId);
        } else {
          console.error('Could not determine other user ID');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
      toast.error('Failed to load property details');
      setLoading(false);
    }
  };

  const fetchOtherUserDetails = async (userId) => {
    try {
      if (!userId) {
        console.error('No user ID provided to fetchOtherUserDetails');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('Resident');
      const response = await axios.get(`/api/Resident-Api/get-resident-by-id?residentId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setOtherUser(response.data.resident);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching other user details:', error);
      toast.error('Failed to load user details');
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('Resident');
      const response = await axios.get(`/api/Property-Api/get-messages?propertyId=${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('Resident');
      const response = await axios.get(`/api/Property-Api/get-unread-messages?count=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('Resident');
      // Always send to the other user in the chat
      const receiverId = otherUser._id;
      
      await axios.post('/api/Property-Api/send-message', {
        propertyId,
        receiverId,
        message: newMessage,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center p-4">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={24} />
            </button>
            
            <div className="flex items-center flex-1">
              {otherUser?.userImage ? (
                <img
                  src={otherUser.userImage}
                  alt={otherUser.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {otherUser?.name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div className="ml-3">
                <h2 className="font-semibold text-gray-800">{otherUser?.name || 'Loading...'}</h2>
                <p className="text-sm text-gray-500 truncate">
                  {propertyData?.title || 'Loading property details...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md">
          {/* Property Info Card */}
          <div className="p-4 border-b">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {propertyData?.images?.[0] ? (
                  <img
                    src={propertyData.images[0]}
                    alt={propertyData.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={24} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-medium text-gray-900">{propertyData?.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                  }).format(propertyData?.price || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[calc(100vh-300px)] overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.senderId === residentData._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.senderId === residentData._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p>{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderId === residentData._id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyChat; 