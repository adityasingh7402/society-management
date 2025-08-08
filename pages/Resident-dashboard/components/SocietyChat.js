import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Check, CheckCheck, X, ArrowLeft, Send, MessageCircle, User, Clock, Loader2, ZoomIn, ZoomOut, Download, Maximize2, Minimize2, Image as ImageIcon, Paperclip } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { setupWebSocket } from '../../../services/CommunityService';

export default function SocietyChat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [messageStatus, setMessageStatus] = useState({});
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);

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
  const inputRef = useRef(null);
  const router = useRouter();

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

  const generateResidentColor = (userId) => {
    const numericId = typeof userId === 'string' ?
      userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) :
      userId;
    const hue = numericId % 360;
    const saturation = 60 + (numericId % 20);
    const lightness = 45 + (numericId % 20);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

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

  // Initial data fetch
  useEffect(() => {
    fetchResidentData();
  }, [router]);

  // Socket setup after resident data is loaded
  useEffect(() => {
    if (currentUser && currentUser.id) {
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
          {
            _id: currentUser.id,
            name: currentUser.name,
            societyCode: currentUser.societyCode
          }, 
          handleIncomingMessage,
          updateMessageStatus,
          markMessagesAsReadByRecipient
        );
        
        // Only set socket ref and add listeners if socket was created
        if (socket) {
          socketRef.current = socket;
          
          // Join society chat room
          socket.emit('join_society_chat', {
            societyCode: currentUser.societyCode,
            userId: currentUser.id,
            userName: currentUser.name
          });
          
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
  }, [currentUser]);

  // Fetch messages after user data is loaded
  useEffect(() => {
    if (currentUser && currentUser.societyCode) {
      fetchMessages();
    }
  }, [currentUser]);

  const fetchResidentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Resident');
      if (!token) {
        router.push('/residentLogin');
        return;
      }

      const userResponse = await fetch('/api/Resident-Api/get-resident-details', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userResponse.ok) throw new Error('Failed to fetch profile');
      const userData = await userResponse.json();

      const userObj = {
        id: userData.residentId,
        name: userData.name,
        societyCode: userData.societyCode,
        isSociety: false
      };
      
      setCurrentUser(userObj);
    } catch (error) {
      console.error('Error fetching resident details:', error);
      setError('Failed to load your profile');
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem('Resident');
      if (!token) {
        toast.error('Please log in again');
        router.push('/residentLogin');
        return;
      }

      const messagesResponse = await fetch(`/api/Message-Api/getMessages?societyId=${currentUser.societyCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!messagesResponse.ok) {
        const errorData = await messagesResponse.json();
        throw new Error(errorData.message || 'Failed to fetch messages');
      }

      const messagesData = await messagesResponse.json();
      setMessages(messagesData.messages);
      setError(null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
      setLoading(false);
    }
  };

  // Socket message handlers
  const handleIncomingMessage = (message) => {
    const { from, text, timestamp, id, media, senderName, isSociety } = message;
    
    // Update messages state - ensure we don't add duplicates by checking message ID
    setMessages(prevMessages => {
      const isMessageExists = prevMessages.some(msg => msg._id === id);
      
      // If message already exists, don't add it again
      if (isMessageExists) return prevMessages;
      
      const newMessage = {
        _id: id,
        senderId: from,
        senderName: senderName,
        content: text,
        timestamp: timestamp,
        isSociety: isSociety || false,
        isDeleted: false,
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
    // For society chat, we can implement read receipts for group messages
    // This is more complex as it involves multiple recipients
    console.log('Messages marked as read:', data);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (sending) return;

    setSending(true);
    const tempId = Date.now().toString();
    
    try {
      // Optimistically add message to UI
      const optimisticMessage = {
        _id: tempId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        content: newMessage,
        timestamp: new Date().toISOString(),
        isSociety: currentUser.isSociety,
        isDeleted: false
      };
      
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }));

      const response = await fetch('/api/Message-Api/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          societyId: currentUser.societyCode,
          senderId: currentUser.id,
          senderName: currentUser.name,
          content: newMessage,
          isSociety: currentUser.isSociety
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const data = await response.json();
      
      // Replace the optimistic message with the real one
      setMessages(prev => 
        prev.map(msg => msg._id === tempId ? data.message : msg)
      );
      
      // Emit message via socket if available to other society members
      if (socketRef.current) {
        socketRef.current.emit('society_chat_message', {
          societyCode: currentUser.societyCode,
          from: currentUser.id,
          senderName: currentUser.name,
          text: newMessage,
          messageId: data.message._id,
          timestamp: data.message.timestamp,
          isSociety: currentUser.isSociety
        });
      }

      setMessageStatus(prev => ({ ...prev, [data.message._id]: 'sent' }));
      setNewMessage('');
      setSelectedFiles([]);
      setIsUserAtBottom(true); // Ensure we scroll to new message
      
      // Focus back on input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageStatus(prev => ({ ...prev, [tempId]: 'failed' }));
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch('/api/Message-Api/deleteMessage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete message');
      }

      const data = await response.json();
      setMessages(messages.map(msg =>
        msg._id === messageId ? data.message : msg
      ));
      
      // Emit delete message event via socket
      if (socketRef.current) {
        socketRef.current.emit('society_message_deleted', {
          societyCode: currentUser.societyCode,
          messageId: messageId,
          deletedBy: currentUser.id
        });
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Failed to delete message');
    }
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

  const MessageStatus = ({ messageId, senderId }) => {
    if (senderId !== currentUser?.id) return null;
    
    const status = messageStatus[messageId] || 'sent';
    
    return (
      <span className="ml-2">
        {status === 'sending' && (
          <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
        )}
        {status === 'sent' && (
          <CheckCheck className="w-3 h-3 text-blue-500" />
        )}
        {status === 'failed' && (
          <X className="w-3 h-3 text-red-500" />
        )}
      </span>
    );
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const isToday = (date) => {
    const today = new Date();
    const messageDate = new Date(date);
    return messageDate.toDateString() === today.toDateString();
  };

  const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(date);
    return messageDate.toDateString() === yesterday.toDateString();
  };

  const formatDateHeader = (date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const shouldShowAvatar = (message, index, dayMessages) => {
    if (index === 0) return true;
    if (message.senderId === currentUser?.id) return false;

    const prevMessage = dayMessages[index - 1];
    return prevMessage.senderId !== message.senderId ||
      new Date(message.timestamp) - new Date(prevMessage.timestamp) > 300000;
  };

  // Render image if message has one
  const renderMessageContent = (message) => {
    if (message.isDeleted) {
      return <span className="italic opacity-60">This message was deleted</span>;
    }
    
    return (
      <>
        {/* Check if message has an image/media */}
        {message.media && message.media.type && message.media.type.startsWith('image/') && (
          <div className="mb-2">
            <motion.img 
              src={message.media.url} 
              alt="Shared image" 
              className="max-w-full rounded-md cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openImageViewer(message.media.url)}
              whileHover={{ scale: 1.02 }}
            />
          </div>
        )}
        {message.content && <div className="whitespace-pre-line">{message.content}</div>}
      </>
    );
  };

  // Show loading screen until all essential data is loaded
  if (loading || !currentUser || loadingMessages) {
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
          {!currentUser ? 'Loading your profile...' : 'Loading messages...'}
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
          <button
            onClick={() => router.reload()}
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition-colors duration-200"
          >
            Try Again
          </button>
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
              onClick={() => router.back()}
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
                <MessageCircle className="text-white h-6 w-6" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                    socketConnected ? 'bg-green-400' : socketError ? 'bg-red-400' : 'bg-yellow-400'
                  }`}
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h2 className="font-semibold text-gray-900 text-base sm:text-lg">
                Society Chat
              </h2>
              <p className="text-xs text-gray-500">
                {socketLoading ? 'Connecting...' : 
                 socketConnected ? 'Connected' : 
                 socketError ? 'Connection error' : 'Offline'}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white chat-messages"
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
                <MessageCircle className="h-10 w-10 text-white" />
              </motion.div>
              <p className="text-gray-800 font-medium text-lg">No messages yet</p>
              <p className="text-gray-500 mt-1">Start the conversation with your society! 🏘️</p>
            </motion.div>
          ) : (
            Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
              <motion.div
                key={date}
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
                    {formatDateHeader(new Date(date))}
                  </motion.div>
                </div>

                <AnimatePresence>
                  {dateMessages.map((message, index) => {
                    const isCurrentUserMessage = message.senderId === currentUser?.id;
                    
                    return (
                      <motion.div
                        key={message._id || index}
                        initial={{
                          opacity: 0,
                          x: isCurrentUserMessage ? 20 : -20,
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
                        className={`flex ${isCurrentUserMessage ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                      >
                        {!isCurrentUserMessage && shouldShowAvatar(message, index, dateMessages) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.05 + 0.1 }}
                            className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: generateResidentColor(message.senderId) }}
                          >
                            <span className="text-white text-xs font-medium">
                              {message.senderName?.charAt(0).toUpperCase()}
                            </span>
                          </motion.div>
                        )}

                        {!isCurrentUserMessage && !shouldShowAvatar(message, index, dateMessages) && (
                          <div className="w-7"></div>
                        )}

                        <div className="max-w-[280px] sm:max-w-[320px] space-y-1">
                          {!isCurrentUserMessage && shouldShowAvatar(message, index, dateMessages) && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 + 0.15 }}
                              className="text-xs text-gray-500 font-medium ml-1"
                            >
                              {message.senderName}
                            </motion.div>
                          )}

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`px-4 py-2.5 rounded-[18px] shadow-sm transition-all duration-200 ${
                              isCurrentUserMessage
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {renderMessageContent(message)}
                          </motion.div>

                          <div className={`flex items-center text-xs ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-gray-400">
                              {formatMessageTime(message.timestamp)}
                            </span>
                            {isCurrentUserMessage && (
                              <MessageStatus messageId={message._id} senderId={message.senderId} />
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
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)}
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
}