import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Check, CheckCheck, X, ArrowLeft, Send, MessageCircle, User, Clock, Loader2, ZoomIn, ZoomOut, Download, Maximize2, Minimize2 } from 'lucide-react';

export default function SocietyChat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socketLoading, setSocketLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [messageStatus, setMessageStatus] = useState({});
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();
  
  // Image viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  const generateResidentColor = (userId) => {
    const numericId = typeof userId === 'string' ?
      userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) :
      userId;
    const hue = numericId % 360;
    const saturation = 60 + (numericId % 20);
    const lightness = 45 + (numericId % 20);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Open image in full-screen viewer
  const openImageViewer = (imageUrl) => {
    setCurrentImage(imageUrl);
    setViewerOpen(true);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    // Prevent scrolling when viewer is open
    document.body.style.overflow = 'hidden';
  };

  // Close image viewer
  const closeImageViewer = () => {
    setViewerOpen(false);
    setCurrentImage(null);
    // Restore scrolling
    document.body.style.overflow = 'auto';
  };

  // Handle zoom in/out
  const handleZoom = (increment) => {
    setZoomLevel(prevZoom => {
      const newZoom = prevZoom + increment;
      // Limit zoom between 0.5 and 3
      return Math.max(0.5, Math.min(3, newZoom));
    });
    // Reset position when zooming
    if (increment < 0) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Handle image dragging
  const handleMouseDown = (e) => {
    if (zoomLevel <= 1) return; // Only allow dragging when zoomed in
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset image viewer when user navigates away
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setSocketLoading(true);
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

        const messagesResponse = await fetch(`/api/Message-Api/getMessages?societyId=${userData.societyCode}`, {
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
        
        // Simulate socket connection complete
        setTimeout(() => {
          setSocketLoading(false);
        }, 1500);
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
        setSocketLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Reduced polling frequency
    return () => clearInterval(interval);
  }, [router]);

  // In your handleSendMessage function
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
  
    const tempId = Date.now().toString();
    setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }));
    
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
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    try {
      const response = await fetch('/api/Message-Api/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          societyCode: currentUser.societyCode,
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
      setMessageStatus(prev => ({ ...prev, [data.message._id]: 'sent' }));
    } catch (err) {
      console.error('Error sending message:', err);
      setMessageStatus(prev => ({ ...prev, [tempId]: 'failed' }));
    }
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
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
    } catch (err) {
      console.error('Error deleting message:', err);
    }
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-white">
        <div className="text-center">
          <div className="inline-block p-6 bg-white rounded-full shadow-md">
            <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
          </div>
          <p className="mt-4 text-teal-700 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-red-50 to-white">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 mx-auto rounded-full flex items-center justify-center mb-4">
            <X className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-center text-lg font-semibold text-red-700 mb-2">Error Loading Chat</h2>
          <p className="text-center text-gray-600">{error}</p>
          <button 
            onClick={() => router.reload()}
            className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
            <img 
              src={message.media.url} 
              alt="Shared image" 
              className="max-w-full rounded-md cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openImageViewer(message.media.url)}
            />
          </div>
        )}
        {message.content && <div>{message.content}</div>}
      </>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-md px-4 py-3">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </button>
          
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center relative border-2 border-white shadow-md">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            
            <div className="ml-3">
              <h2 className="font-semibold text-gray-800 text-lg">Society Chat</h2>
              <p className="text-xs text-gray-500">
                {socketLoading ? 'Connecting...' : 'Connected'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-white"
        ref={messagesEndRef}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-center px-4">
            <div>
              <p className="text-red-500 font-medium mb-2">Error loading messages</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center mb-6">
              <MessageCircle className="h-12 w-12 text-white" />
            </div>
            <p className="text-gray-800 font-medium text-lg">No messages yet</p>
            <p className="text-gray-500 mt-1">Start a conversation!</p>
          </div>
        ) : (
          Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-gray-100 text-gray-500 text-xs px-4 py-1.5 rounded-full font-medium">
                  {formatDateHeader(new Date(date))}
                </div>
              </div>

              {dateMessages.map((message) => {
                const isCurrentUser = message.senderId === currentUser?.id;
                return (
                  <div
                    key={message._id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                  >
                    {!isCurrentUser && (
                      <div 
                        className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: generateResidentColor(message.senderId) }}
                      >
                        <span className="text-white text-sm font-medium">
                          {message.senderName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className={`max-w-[85%] md:max-w-[70%] space-y-1 ${!isCurrentUser && 'ml-2'}`}>
                      {!isCurrentUser && (
                        <span className="text-xs text-gray-500 font-medium ml-1">
                          {message.senderName}
                        </span>
                      )}
                      
                      <div
                        className={`px-4 py-2.5 rounded-[20px] ${
                          isCurrentUser
                            ? 'bg-[#0D6EFD] text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {renderMessageContent(message)}
                      </div>

                      <div className={`flex items-center text-xs ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-gray-400">
                          {formatMessageTime(message.timestamp)}
                        </span>
                        {isCurrentUser && (
                          <MessageStatus messageId={message._id} senderId={message.senderId} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center bg-gray-50 rounded-full overflow-hidden shadow-inner">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 py-3 px-4 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`p-3 ${
              !newMessage.trim()
                ? 'text-gray-400'
                : 'text-[#0D6EFD] hover:text-blue-700'
            } transition-colors`}
          >
            <Send size={22} />
          </button>
        </div>
      </div>

      {/* Image Viewer */}
      {viewerOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeImageViewer}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeImageViewer}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X size={24} />
            </button>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 rounded-full py-2 px-4 flex items-center space-x-4">
              <button 
                onClick={() => handleZoom(-0.2)}
                className="text-white hover:text-gray-300"
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut size={20} />
              </button>
              
              <span className="text-white text-sm font-medium">
                {Math.round(zoomLevel * 100)}%
              </span>
              
              <button 
                onClick={() => handleZoom(0.2)}
                className="text-white hover:text-gray-300"
                disabled={zoomLevel >= 3}
              >
                <ZoomIn size={20} />
              </button>
              
              <button 
                onClick={() => setZoomLevel(1)}
                className="text-white hover:text-gray-300 ml-2"
              >
                {zoomLevel > 1 ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>

            <div 
              ref={imageRef}
              className={`transform transition-transform duration-200 ${isDragging ? 'cursor-grabbing' : zoomLevel > 1 ? 'cursor-grab' : 'cursor-default'}`}
              style={{
                transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img 
                src={currentImage} 
                alt="Enlarged view" 
                className="max-h-[90vh] max-w-[90vw] object-contain"
                draggable="false"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}