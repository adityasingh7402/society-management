import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const PropertyChat = () => {
  const router = useRouter();
  const { buyerId, propertyId } = router.query;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [residentData, setResidentData] = useState(null);
  const [propertyData, setPropertyData] = useState(null);
  const [error, setError] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);

  useEffect(() => {
    if (router.isReady) {
      fetchResidentData();
    }
  }, [router.isReady]);

  useEffect(() => {
    if (propertyId && residentData) {
      fetchPropertyData();
      fetchMessages();
      
      // Set up real-time updates with optimized polling
      const interval = setInterval(async () => {
        // Only fetch if we have a last message timestamp
        if (lastMessageTimestamp && propertyData) {
          try {
            const token = localStorage.getItem('Resident');
            const response = await axios.get(
              `/api/Property-Api/get-messages`,
              {
                params: {
                  propertyId,
                  otherUserId: residentData._id === propertyData.sellerId ? buyerId : propertyData.sellerId,
                  since: lastMessageTimestamp
                },
                headers: {
                  Authorization: `Bearer ${token}`,
                }
              }
            );
            
            // Only update messages if we got new ones
            if (response.data && response.data.length > 0) {
              setMessages(prevMessages => [...prevMessages, ...response.data]);
              setLastMessageTimestamp(new Date().toISOString());
            }
          } catch (error) {
            toast.error('Error updating messages');
          }
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [propertyId, residentData, lastMessageTimestamp, propertyData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchResidentData = async () => {
    try {
      setLoading(true);
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
      setError('Failed to load your profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyData = async () => {
    try {
      if (!propertyId) {
        setError('No property ID provided');
        return;
      }

      const token = localStorage.getItem('Resident');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await axios.get('/api/Property-Api/get-property', {
        params: { propertyId },
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
          setError('Could not determine other user ID');
          setLoading(false);
        }
      }
    } catch (error) {
      setError('Failed to load property information');
    }
  };

  const fetchOtherUserDetails = async (userId) => {
    try {
      if (!userId) {
        setError('No user ID provided');
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
      toast.error('Failed to load user details');
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem('Resident');
      if (!token) {
        toast.error('Please log in again');
        router.push('/login');
        return;
      }

      // if (!residentData?._id) {
      //   setError('No resident data found');
      //   return;
      // }

      // if (!propertyData) {
      //   setError('No property data found');
      //   return;
      // }

      // if (!propertyId || !buyerId) {
      //   setError('Missing required information');
      //   return;
      // }

      const otherUserId = residentData._id === propertyData.sellerId ? buyerId : propertyData.sellerId;
      
      if (!otherUserId) {
        setError('Could not determine other user');
        return;
      }

      const response = await axios.get('/api/Property-Api/get-conversation', {
        params: {
          propertyId,
          otherUserId
        },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      setMessages(response.data);
      setError(null);
      
      // Mark messages as read if there are any unread ones
      const hasUnreadMessages = response.data.some(msg => 
        !msg.isRead && msg.receiverId === residentData._id
      );
      
      if (hasUnreadMessages && otherUserId) {
        await markMessagesAsRead(otherUserId);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        setError('Missing required information to load messages');
        toast.error('Missing required information to load messages');
      } else {
        // setError('Failed to load messages');
        toast.error('Failed to load messages');
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const markMessagesAsRead = async (senderId) => {
    try {
      const token = localStorage.getItem('Resident');
      await axios.post('/api/Property-Api/mark-as-read', 
        { senderId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
    } catch (error) {
      toast.error('Error marking messages as read');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('Resident');
      const receiverId = residentData._id === propertyData.sellerId ? buyerId : propertyData.sellerId;
      
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link
            href="/Resident-dashboard/components/PropertyMarketplace"
            className="text-blue-500 hover:text-blue-700 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center p-4">
            <Link
              href="/Resident-dashboard/components/PropertyMarketplace"
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={24} />
            </Link>
            
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md flex flex-col h-[calc(100vh-64px)]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2 p-4">
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
                    <p className="whitespace-pre-line">{message.message}</p>
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
          <div className="border-t p-2 m-2">
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