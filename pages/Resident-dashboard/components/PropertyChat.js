import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ArrowLeft, Send, Image as ImageIcon, User, Check, CheckCheck, Paperclip, Loader2, Tag, ZoomIn, ZoomOut, Maximize2, Minimize2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { setupWebSocket } from '../../../services/CommunityService';

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
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);
  const [sending, setSending] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [messageStatus, setMessageStatus] = useState({});

  // Socket state
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(false);
  const [socketLoading, setSocketLoading] = useState(true);
  
  // Image viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  // Check if user is near bottom of messages
  const checkIfUserAtBottom = () => {
    if (!chatContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // Handle scroll to track user position
  const handleScroll = () => {
    setIsUserAtBottom(checkIfUserAtBottom());
  };

  useEffect(() => {
    if (router.isReady) {
      fetchResidentData();
    }
  }, [router.isReady]);

  useEffect(() => {
    if (propertyId && residentData) {
      fetchPropertyData();
    }
  }, [propertyId, residentData]);

  // Socket setup after resident data is loaded
  useEffect(() => {
    if (residentData && residentData._id) {
      const setupSocket = () => {
        setSocketLoading(true);
        // Clear previous socket if it exists
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        
        // Connect to socket.io endpoint
        fetch('/api/socketio')
          .then(() => {
            // Socket.io endpoint is available
          })
          .catch(error => {
            // Error pinging socket.io endpoint
          })
          .finally(() => {
            createSocket();
          });
      };

      const createSocket = () => {
        const socket = setupWebSocket(
          residentData, 
          handleIncomingMessage,
          updateMessageStatus,
          markMessagesAsReadByRecipient
        );
        
        // Only set socket ref and add listeners if socket was created
        if (socket) {
          socketRef.current = socket;
          
          // Add socket connection state handlers
          socket.on('connect', () => {
            setSocketConnected(true);
            setSocketError(false);
            setSocketLoading(false);
          });
          
          socket.on('connect_error', (error) => {
            setSocketConnected(false);
            setSocketError(true);
            setSocketLoading(false);
            
            // Show error message to user
            toast.error('Unable to connect to chat server. Please try refreshing the page.', {
              duration: 5000,
              id: 'socket-error',
            });
          });
          
          socket.on('disconnect', (reason) => {
            setSocketConnected(false);
            setSocketError(true);
            setSocketLoading(false);
            
            // Show appropriate message based on disconnect reason
            if (reason === 'io server disconnect') {
              // Auth error
              toast.error('Your session has expired. Please log in again.', {
                duration: 5000,
                id: 'session-expired',
              });
            }
          });
          
          socket.on('reconnect', () => {
            setSocketConnected(true);
            setSocketError(false);
            setSocketLoading(false);
          });
          
          socket.on('auth_error', (data) => {
            setSocketConnected(false);
            setSocketError(true);
            setSocketLoading(false);
            
            // Check if token issue and show appropriate message
            if (data.message.includes('token') || data.message.includes('auth')) {
              toast.error('Authentication error. Please refresh the page or log in again.', {
                duration: 5000,
                id: 'auth-error',
              });
            }
          });
          
          // Set a timeout to stop the loading indicator if it takes too long
          setTimeout(() => {
            setSocketLoading(false);
          }, 5000);
        } else {
          // No socket was created, likely due to missing token
          setSocketConnected(false);
          setSocketError(true);
          setSocketLoading(false);
          
          // Show error message to user
          toast.error('Failed to connect to chat. Please try refreshing the page.', {
            duration: 5000,
          });
        }
      };
      
      // Start the initial socket setup
      setupSocket();
      
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [residentData]);

  // Separate effect for fetching messages after both resident and property data are loaded
  useEffect(() => {
    if (residentData && propertyData && buyerId) {
      fetchMessages();
    }
  }, [residentData, propertyData, buyerId]);

  // Real-time messaging is now handled by socket connection - no need for polling

  // Smart auto-scroll: only scroll if user is at bottom or it's first load
  useEffect(() => {
    if (messagesEndRef.current && (isUserAtBottom || isFirstLoad)) {
      const shouldSmoothScroll = !isFirstLoad;
      
      messagesEndRef.current?.scrollIntoView({
        behavior: shouldSmoothScroll ? 'smooth' : 'auto',
        block: 'end'
      });

      if (isFirstLoad && messages.length > 0) {
        setIsFirstLoad(false);
      }
    }
  }, [messages, isFirstLoad, isUserAtBottom]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

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
      setLoading(false);
    }
  };

  const fetchPropertyData = async () => {
    try {
      if (!propertyId) {
        setError('No property ID provided');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('Resident');
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
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
      console.error('Error fetching property data:', error);
      setError('Failed to load property information');
      setLoading(false);
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
    } catch (error) {
      console.error('Error fetching other user details:', error);
      toast.error('Failed to load user details');
    } finally {
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

      if (!residentData || !propertyData) {
        return;
      }

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
      setLastMessageTimestamp(new Date().toISOString());
      
      // Mark messages as read if there are any unread ones
      const hasUnreadMessages = response.data.some(msg => 
        !msg.isRead && msg.receiverId === residentData._id
      );
      
      if (hasUnreadMessages && otherUserId) {
        await markMessagesAsRead(otherUserId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 400) {
        setError('Missing required information to load messages');
      } else {
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
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('Resident');
      const receiverId = residentData._id === propertyData.sellerId ? buyerId : propertyData.sellerId;
      
      const response = await axios.post('/api/Property-Api/send-message', {
        propertyId,
        receiverId,
        message: newMessage,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      // Add the message to local state immediately for better UX
      const messageObj = {
        _id: response.data.messageId || Date.now().toString(),
        senderId: residentData._id,
        message: newMessage,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      
      setMessages(prevMessages => [...prevMessages, messageObj]);
      
      // Emit message via socket if available
      if (socketRef.current) {
        socketRef.current.emit('chat_message', {
          to: receiverId,
          from: residentData._id,
          text: newMessage,
          messageId: messageObj._id,
          timestamp: messageObj.createdAt
        });
      }

      setNewMessage('');
      setSelectedFiles([]);
      setIsUserAtBottom(true); // Ensure we scroll to new message
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageDay = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const groupMessagesByDay = () => {
    const grouped = {};

    messages.forEach(message => {
      const day = getMessageDay(message.createdAt);
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(message);
    });

    return grouped;
  };

  const shouldShowAvatar = (message, index, dayMessages) => {
    if (index === 0) return true;
    if (message.senderId === residentData?._id) return false;

    const prevMessage = dayMessages[index - 1];
    return prevMessage.senderId !== message.senderId ||
      new Date(message.createdAt) - new Date(prevMessage.createdAt) > 300000;
  };

  const openImageViewer = (imageUrl) => {
    setCurrentImage(imageUrl);
    setViewerOpen(true);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    document.body.style.overflow = 'hidden';
  };

  const closeImageViewer = () => {
    setViewerOpen(false);
    setCurrentImage(null);
    document.body.style.overflow = 'auto';
  };

  const handleZoom = (increment) => {
    setZoomLevel(prevZoom => {
      const newZoom = prevZoom + increment;
      return Math.max(0.5, Math.min(3, newZoom));
    });
    if (increment < 0) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024;
    const validFiles = files.filter(file => file.size <= maxSize);

    if (validFiles.length !== files.length) {
      toast.error(`File(s) too large. Maximum size is 5MB per file.`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Socket message handlers
  const handleIncomingMessage = (message) => {
    const { from, text, timestamp, id, media } = message;
    
    // Update messages state - ensure we don't add duplicates by checking message ID
    setMessages(prevMessages => {
      const isMessageExists = prevMessages.some(msg => msg._id === id);
      
      // If message already exists, don't add it again
      if (isMessageExists) return prevMessages;
      
      const newMessage = {
        _id: id,
        senderId: from,
        message: text,
        createdAt: timestamp,
        isRead: false,
        media
      };
      
      const updatedMessages = [...prevMessages, newMessage];
      
      // Update UI immediately
      setTimeout(() => {
        const messageContainer = document.querySelector('.chat-messages');
        if (messageContainer) {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }
      }, 50);
      
      return updatedMessages;
    });

    // Mark as read if this is the other user we're chatting with
    if (otherUser && from === otherUser._id) {
      setTimeout(() => {
        markMessagesAsRead(from);
      }, 500);
    }
  };

  const updateMessageStatus = (data) => {
    const { messageId, status } = data;
    
    // Update message status in message state
    setMessageStatus(prev => ({
      ...prev,
      [messageId]: status
    }));
    
    // Also update message object in the messages state
    setMessages(prevMessages => {
      return prevMessages.map(msg => {
        if (msg._id === messageId) {
          return {
            ...msg,
            status
          };
        }
        return msg;
      });
    });
  };

  const markMessagesAsReadByRecipient = (data) => {
    const { from } = data;
    
    // Mark all messages sent to this recipient as read
    setMessages(prevMessages => {
      return prevMessages.map(msg => 
        msg.senderId === residentData._id && msg.receiverId === from 
          ? { ...msg, isRead: true } 
          : msg
      );
    });
  };

  // Show loading screen until all essential data is loaded
  if (loading || !residentData || !propertyData || loadingMessages) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-screen bg-gray-50"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"
        />
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 font-medium"
        >
          {!residentData ? 'Loading your profile...' : 
           !propertyData ? 'Loading property details...' : 
           'Loading messages...'}
        </motion.p>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 text-sm mt-1"
        >
          Please wait a moment
        </motion.p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-screen bg-gray-50"
      >
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md mx-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <X className="w-8 h-8 text-red-500" />
          </motion.div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Something went wrong</h3>
          <p className="text-red-500 mb-6">{error}</p>
          <Link
            href="/Resident-dashboard/components/PropertyMarketplace"
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition-colors duration-200"
          >
            <ArrowLeft size={16} />
            Back to Marketplace
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col bg-gray-50 relative overflow-hidden h-screen"
    >
      {/* Chat Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white shadow-sm border-b border-gray-100 px-4 py-3 relative z-10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/Resident-dashboard/components/PropertyMarketplace')}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </motion.button>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="relative"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative border-2 border-white shadow-lg"
              >
                {otherUser?.userImage ? (
                  <img
                    src={otherUser.userImage}
                    alt={otherUser.name}
                    className="h-11 w-11 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="text-white h-5 w-5" />
                )}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white"
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h2 className="font-semibold text-gray-900 text-base sm:text-lg truncate max-w-[140px] sm:max-w-xs">
                {otherUser?.name || 'User'}
              </h2>
              <p className="text-xs text-gray-500 truncate max-w-[140px] sm:max-w-xs">
                Property Discussion
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Property Reference Banner */}
      <AnimatePresence>
        {propertyData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href={`/Resident-dashboard/components/PropertyDetail?id=${propertyId}`}
              className="bg-blue-50 border-b border-blue-100 p-3 flex items-center hover:bg-blue-100 transition-colors"
            >
              <motion.div
                whileHover={{ rotate: 5 }}
                className="mr-3 bg-blue-100 rounded-full p-2"
              >
                <Tag className="h-4 w-4 text-blue-600" />
              </motion.div>
              <div className="flex-1">
                <p className="text-xs text-blue-600 font-medium">
                  Property Discussion
                </p>
                <p className="text-sm text-gray-800 font-medium truncate">
                  {propertyData.title}
                </p>
              </div>
              <motion.div
                whileHover={{ x: 5 }}
                className="ml-2 text-xs text-blue-600 font-semibold"
              >
                View
              </motion.div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white"
        style={{
          minHeight: 0,
          scrollBehavior: 'smooth'
        }}
      >
        <AnimatePresence mode="wait">
          {loadingMessages ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mb-4"
              />
              <p className="text-gray-600 font-medium">Loading messages...</p>
            </motion.div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full flex flex-col items-center justify-center text-center"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg"
              >
                <User className="h-10 w-10 text-white" />
              </motion.div>
              <p className="text-gray-800 font-medium text-lg">No messages yet</p>
              <p className="text-gray-500 mt-1">Start the conversation about this property! 🏠</p>
            </motion.div>
          ) : (
            Object.entries(groupMessagesByDay()).map(([day, dayMessages]) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full font-medium shadow-sm"
                  >
                    {day}
                  </motion.div>
                </div>

                <AnimatePresence>
                  {dayMessages.map((message, index) => {
                    const isIncoming = message.senderId !== residentData._id;
                    
                    return (
                      <motion.div
                        key={message._id || index}
                        initial={{
                          opacity: 0,
                          x: isIncoming ? -20 : 20,
                          scale: 0.95
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          scale: 1
                        }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05
                        }}
                        className={`flex ${isIncoming ? 'justify-start' : 'justify-end'} items-end space-x-2`}
                      >
                        {isIncoming && shouldShowAvatar(message, index, dayMessages) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.05 + 0.1 }}
                            className="h-7 w-7 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center shadow-sm"
                          >
                            {otherUser?.userImage ? (
                              <img
                                src={otherUser.userImage}
                                alt={otherUser.name}
                                className="h-7 w-7 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-3 w-3 text-gray-500" />
                            )}
                          </motion.div>
                        )}

                        {isIncoming && !shouldShowAvatar(message, index, dayMessages) && (
                          <div className="w-7"></div>
                        )}

                        <div className="max-w-[280px] sm:max-w-[320px] space-y-1">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`px-4 py-2.5 rounded-[18px] shadow-sm transition-all duration-200 ${isIncoming
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                              }`}
                          >
                            <p className="text-sm break-words leading-relaxed whitespace-pre-line">
                              {message.message}
                            </p>
                          </motion.div>

                          <div className={`flex items-center text-xs ${isIncoming ? '' : 'justify-end'}`}>
                            <span className="text-gray-400">
                              {formatMessageTime(message.createdAt)}
                            </span>
                            {!isIncoming && (
                              <span className="ml-1">
                                {message.isRead ? (
                                  <CheckCheck className="h-3 w-3 text-blue-500" />
                                ) : (
                                  <Check className="h-3 w-3 text-gray-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Files Preview */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border-t border-gray-100 p-3"
          >
            <div className="flex overflow-x-auto space-x-2 pb-1">
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex-shrink-0 group"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="h-14 w-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shadow-sm"
                  >
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Paperclip className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeSelectedFile(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-lg"
                    disabled={sending}
                  >
                    <X className="h-3 w-3" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="p-3 bg-white border-t border-gray-100 relative z-10"
      >
        <form onSubmit={handleSendMessage}>
          <div className="flex items-center bg-gray-50 rounded-full overflow-hidden shadow-sm border border-gray-200 transition-all duration-200 focus-within:shadow-md focus-within:border-blue-300">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-500 hover:text-blue-500 transition-colors duration-200"
              disabled={sending}
            >
              <ImageIcon size={20} />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept="image/*,video/*,audio/*,application/pdf"
                disabled={sending}
              />
            </motion.button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 py-3 px-2 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
              disabled={sending}
            />

            <motion.button
              type="submit"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={sending || (!newMessage.trim() && !selectedFiles.length)}
              className={`p-3 transition-colors duration-200 ${sending || (!newMessage.trim() && !selectedFiles.length)
                  ? 'text-gray-400'
                  : 'text-blue-500 hover:text-blue-600'
                }`}
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Image Viewer */}
      <AnimatePresence>
        {viewerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={closeImageViewer}
          >
            <div
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={closeImageViewer}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 p-2 rounded-full"
                aria-label="Close viewer"
              >
                <X size={24} />
              </motion.button>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full py-2 px-4 flex items-center space-x-4 z-10"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleZoom(-0.2)}
                  className="text-white hover:text-gray-300 disabled:opacity-50 transition-colors duration-200"
                  disabled={zoomLevel <= 0.5}
                  aria-label="Zoom out"
                >
                  <ZoomOut size={18} />
                </motion.button>

                <span className="text-white text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleZoom(0.2)}
                  className="text-white hover:text-gray-300 disabled:opacity-50 transition-colors duration-200"
                  disabled={zoomLevel >= 3}
                  aria-label="Zoom in"
                >
                  <ZoomIn size={18} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setZoomLevel(1)}
                  className="text-white hover:text-gray-300 ml-2 transition-colors duration-200"
                  aria-label="Reset zoom"
                >
                  {zoomLevel > 1 ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </motion.button>
              </motion.div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                ref={imageRef}
                className={`transform transition-transform duration-200 ${isDragging ? 'cursor-grabbing' : zoomLevel > 1 ? 'cursor-grab' : 'cursor-default'}`}
                style={{
                  transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                }}
                onMouseDown={(e) => {
                  if (zoomLevel <= 1) return;
                  setIsDragging(true);
                  setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
                }}
                onMouseMove={(e) => {
                  if (!isDragging) return;
                  setPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                  });
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                <img
                  src={currentImage}
                  alt="Enlarged view"
                  className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl rounded-lg"
                  draggable="false"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PropertyChat;