import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const ProductChat = () => {
  const router = useRouter();
  const { buyerId, productId } = router.query;
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [residentData, setResidentData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);

  useEffect(() => {
    if (router.isReady) {
      fetchResidentData();
    }
  }, [router.isReady]);

  useEffect(() => {
    if (productId && residentData) {
      fetchProductData();
      fetchMessages();
      
      // Set up real-time updates with optimized polling
      const interval = setInterval(async () => {
        // Only fetch if we have a last message timestamp
        if (lastMessageTimestamp && productData) {
          try {
            const token = localStorage.getItem('Resident');
            const response = await axios.get(
              `/api/Product-Api/get-messages`,
              {
                params: {
                  productId,
                  otherUserId: residentData._id === productData.sellerId ? buyerId : productData.sellerId,
                  since: lastMessageTimestamp
                },
                headers: {
                  Authorization: `Bearer ${token}`,
                }
              }
            );

            if (response.data.length > 0) {
              setMessages(prevMessages => [...prevMessages, ...response.data]);
              setLastMessageTimestamp(response.data[response.data.length - 1].createdAt);
            }
          } catch (error) {
            console.error('Error polling messages:', error);
          }
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [productId, residentData, lastMessageTimestamp, productData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      setError('Failed to load user data. Please try again.');
      toast.error('Failed to load user data');
    }
  };

  const fetchProductData = async () => {
    try {
      const token = localStorage.getItem('Resident');
      const response = await axios.get(`/api/Product-Api/get-product?productId=${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setProductData(response.data);

      // Set other user based on who is viewing
      const otherUserId = residentData._id === response.data.sellerId ? buyerId : response.data.sellerId;
      const otherUserResponse = await axios.get(`/api/Resident-Api/get-resident-by-id?residentId=${otherUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setOtherUser(otherUserResponse.data.resident);
    } catch (error) {
      setError('Failed to load product data. Please try again.');
      toast.error('Failed to load product data');
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Resident');
      if (!token) {
        toast.error('Please log in again');
        router.push('/login');
        return;
      }

      const otherUserId = residentData._id === productData.sellerId ? buyerId : productData.sellerId;
      
      if (!otherUserId) {
        setError('Could not determine other user');
        return;
      }

      const response = await axios.get('/api/Product-Api/get-conversation', {
        params: {
          productId,
          otherUserId
        },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      setMessages(response.data);
      
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
        toast.error('Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (senderId) => {
    try {
      const token = localStorage.getItem('Resident');
      await axios.post('/api/Product-Api/mark-as-read', 
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
      const response = await axios.post(
        '/api/Product-Api/send-message',
        {
          productId,
          message: newMessage,
          receiverId: residentData._id === productData.sellerId ? buyerId : productData.sellerId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (response.data.success) {
        setMessages(prevMessages => [...prevMessages, response.data.data]);
        setNewMessage('');
        setLastMessageTimestamp(response.data.data.createdAt);
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link
            href="/Resident-dashboard/components/Marketplace"
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
              href="/Resident-dashboard/components/Marketplace"
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={24} />
            </Link>
            
            <div className="flex items-center flex-1">
              {otherUser?.userImage ? (
                <img
                  src={otherUser.userImage}
                  alt={otherUser.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {otherUser?.name ? otherUser.name.charAt(0) : '?'}
                  </span>
                </div>
              )}
              <div className="ml-3">
                <h2 className="font-semibold text-gray-800">{otherUser?.name || 'Loading...'}</h2>
                <p className="text-sm text-gray-500 truncate">
                  {productData?.title || 'Loading product details...'}
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
                    <p
                      className={`text-xs mt-1 ${
                        message.senderId === residentData._id
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
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

export default ProductChat; 