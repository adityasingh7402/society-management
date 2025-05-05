import React, { useRef, useEffect, useState } from 'react';
import { X, Send, User, Check, CheckCheck, Paperclip, Loader2, Phone, ArrowLeft, MoreVertical, Image, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ChatModal({
  selectedResident,
  chatMessages,
  newMessage,
  setNewMessage,
  onClose,
  onSend,
  selectedFiles,
  setSelectedFiles
}) {
  // Message container ref for auto-scrolling
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Image viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      // Determine if we should scroll smoothly
      const shouldSmoothScroll = !isFirstLoad;
      
      messagesEndRef.current.scrollIntoView({ 
        behavior: shouldSmoothScroll ? 'smooth' : 'auto' 
      });
      
      // After first load is done, future scrolls should be smooth
      if (isFirstLoad && chatMessages.length > 0) {
        setIsFirstLoad(false);
      }
    }
  }, [chatMessages, isFirstLoad]);

  // Reset first load flag when chat changes
  useEffect(() => {
    setIsFirstLoad(true);
  }, [selectedResident]);

  // Add additional class to the chat container for easier targeting
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.classList.add('chat-messages');
    }
  }, []);

  // Reset image viewer when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Format timestamp for message bubbles
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get day for grouping messages
  const getMessageDay = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Group messages by day
  const groupMessagesByDay = () => {
    const grouped = {};
    
    chatMessages.forEach(message => {
      const day = getMessageDay(message.timestamp);
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(message);
    });
    
    return grouped;
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
    // Reset position when zooming out
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file size (max 5MB per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast.error(`File(s) too large. Maximum size is 5MB per file.`);
      // Filter out oversized files
      const validFiles = files.filter(file => file.size <= maxSize);
      setSelectedFiles(prev => [...prev, ...validFiles]);
    } else if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendClick = async () => {
    if (sending) return;
    
    if (!newMessage.trim() && selectedFiles.length === 0) {
      return;
    }
    
    setSending(true);
    try {
      await onSend();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Check if someone should show sender's avatar
  const shouldShowAvatar = (message, index) => {
    if (index === 0) return true;
    if (!message.isIncoming) return false;
    
    const prevMessage = chatMessages[index - 1];
    return prevMessage.isIncoming !== message.isIncoming || 
      new Date(message.timestamp) - new Date(prevMessage.timestamp) > 300000; // 5 minutes gap
  };

  return (
    <div className="flex flex-col h-screen bg-[#e5ded8]">
      {/* Chat Header */}
      <div className="bg-teal-600 text-white py-3 px-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={onClose}
              className="mr-2 hover:bg-white/10 p-1 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center relative mr-3">
              {selectedResident.userImage ? (
                <img 
                  src={selectedResident.userImage} 
                  alt={selectedResident.name} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <User className="text-white" />
              )}
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            
            <div>
              <h2 className="font-semibold text-lg">{selectedResident.name}</h2>
              <p className="text-xs opacity-80">
                {selectedResident.flatDetails?.flatNumber ? 
                  `Flat: ${selectedResident.flatDetails?.flatNumber}` : 
                  'Online'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              className="hover:bg-white/10 p-2 rounded-full transition-colors"
              onClick={() => {
                if (selectedResident.phoneNumber) {
                  window.open(`tel:${selectedResident.phoneNumber}`);
                } else {
                  toast.error('No phone number available');
                }
              }}
            >
              <Phone className="h-5 w-5" />
            </button>
            <button className="hover:bg-white/10 p-2 rounded-full transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-4 bg-transparent"
      >
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-blue-500" />
            </div>
            <p className="text-gray-500 text-center">No messages yet.<br />Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupMessagesByDay()).map(([day, dayMessages]) => (
            <div key={day} className="mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {day}
                </div>
              </div>
              
              {dayMessages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`mb-3 flex ${message.isIncoming ? 'justify-start' : 'justify-end'}`}
                >
                  {message.isIncoming && shouldShowAvatar(message, index) && (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center self-end mr-2">
                      {selectedResident.userImage ? (
                        <img 
                          src={selectedResident.userImage} 
                          alt={selectedResident.name} 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  )}
                  
                  {message.isIncoming && !shouldShowAvatar(message, index) && (
                    <div className="w-8 mr-2"></div>
                  )}
                  
                  <div className={`max-w-[70%] space-y-1 ${message.isIncoming ? '' : 'ml-auto'}`}>
                    <div
                      className={`px-4 py-2 rounded-lg shadow-sm ${
                        message.isIncoming
                          ? 'bg-white text-gray-800 rounded-tl-none'
                          : 'bg-[#DCF8C6] text-black rounded-tr-none'
                      }`}
                    >
                      {message.media && (
                        <div className="mb-2">
                          {message.media.type?.startsWith('image/') ? (
                            <div className="rounded-lg overflow-hidden">
                              <img 
                                src={message.media.url} 
                                alt="Shared image" 
                                className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                loading="lazy"
                                onClick={() => openImageViewer(message.media.url)}
                                onLoad={() => {
                                  // Ensure we scroll to bottom when images load
                                  if (messagesEndRef.current) {
                                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center p-2 bg-gray-100 rounded-lg">
                              <Paperclip className="mr-2 text-gray-500" />
                              <a 
                                href={message.media.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 underline text-sm"
                              >
                                {message.media.filename || 'Attachment'}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {message.text && <p className="text-sm">{message.text}</p>}
                    </div>
                    
                    <div className={`flex items-center text-xs ${message.isIncoming ? '' : 'justify-end'}`}>
                      <span className="text-gray-500">
                        {formatMessageTime(message.timestamp)}
                      </span>
                      {!message.isIncoming && (
                        <span className="ml-1">
                          {message.status === 'sending' && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                          {message.status === 'sent' && <Check className="h-3 w-3 text-gray-400" />}
                          {message.status === 'delivered' && <CheckCheck className="h-3 w-3 text-gray-400" />}
                          {message.status === 'read' && <CheckCheck className="h-3 w-3 text-blue-500" />}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm p-2 flex overflow-x-auto">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative mr-2 flex-shrink-0">
              {file.type.startsWith('image/') ? (
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`Preview ${index}`} 
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Paperclip className="text-gray-500" />
                </div>
              )}
              <button 
                onClick={() => removeSelectedFile(index)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md"
                disabled={sending}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Message Input */}
      <div className="p-3 bg-[#f0f0f0] shadow-md">
        <div className="flex items-center bg-white rounded-full overflow-hidden pr-2">
          <button
            onClick={() => fileInputRef.current.click()}
            className="p-3 text-gray-500 hover:text-teal-500 transition-colors"
            disabled={sending}
          >
            <Image size={20} />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept="image/*,video/*,audio/*,application/pdf"
              disabled={sending}
            />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendClick()}
            placeholder="Type a message..."
            className="flex-1 py-2 px-3 bg-transparent focus:outline-none"
            disabled={sending}
          />
          
          <button
            onClick={handleSendClick}
            disabled={sending || (!newMessage.trim() && !selectedFiles.length)}
            className={`p-2 rounded-full ${
              sending || (!newMessage.trim() && !selectedFiles.length)
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-white bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Full Screen Image Viewer */}
      {viewerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={closeImageViewer}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={closeImageViewer}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X size={28} />
            </button>
            
            {/* Zoom controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 rounded-full py-2 px-4 flex items-center space-x-4 z-10">
              <button 
                onClick={() => handleZoom(-0.2)}
                className="text-white hover:text-gray-300"
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut size={24} />
              </button>
              
              <span className="text-white text-sm">{Math.round(zoomLevel * 100)}%</span>
              
              <button 
                onClick={() => handleZoom(0.2)}
                className="text-white hover:text-gray-300"
                disabled={zoomLevel >= 3}
              >
                <ZoomIn size={24} />
              </button>
              
              <button 
                onClick={() => setZoomLevel(1)}
                className="text-white hover:text-gray-300 ml-2"
              >
                {zoomLevel > 1 ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
              </button>
            </div>
            
            {/* The image */}
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
              onTouchStart={(e) => {
                if (zoomLevel <= 1) return;
                setIsDragging(true);
                const touch = e.touches[0];
                setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
              }}
              onTouchMove={(e) => {
                if (!isDragging) return;
                const touch = e.touches[0];
                setPosition({
                  x: touch.clientX - dragStart.x,
                  y: touch.clientY - dragStart.y
                });
              }}
              onTouchEnd={() => setIsDragging(false)}
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