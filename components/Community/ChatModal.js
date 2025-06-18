import React, { useRef, useEffect, useState } from 'react';
import { X, Send, User, Check, CheckCheck, Paperclip, Loader2, Phone, ArrowLeft, MoreVertical, Image, ZoomIn, ZoomOut, Maximize2, Minimize2, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function ChatModal({
  selectedResident,
  chatMessages,
  newMessage,
  setNewMessage,
  onClose,
  onSend,
  selectedFiles,
  setSelectedFiles,
  productRef,
  propertyRef
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

  // Add responsive state
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div className="flex flex-col h-screen bg-[#F8F9FE] relative">
      {/* Chat Header - Modern Android Style */}
      <div className="bg-white shadow-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6 text-gray-700" />
            </button>
            
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative border-2 border-white shadow-md">
                {selectedResident.userImage ? (
                  <img 
                    src={selectedResident.userImage} 
                    alt={selectedResident.name} 
                    className="h-12 w-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-purple-500');
                    }}
                  />
                ) : (
                  <User className="text-white h-6 w-6" />
                )}
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
            </div>
            
            <div>
              <h2 className="font-semibold text-gray-800 text-lg truncate max-w-[150px] md:max-w-xs">
                {selectedResident.name}
              </h2>
              <p className="text-xs text-gray-500 truncate max-w-[150px] md:max-w-xs">
                {selectedResident.flatDetails?.flatNumber ? 
                  `Flat: ${selectedResident.flatDetails?.flatNumber}` : 
                  'Online'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product/Property Reference Banner */}
      {(productRef?.id || propertyRef?.id) && (
        <Link 
          href={productRef?.id ? 
            `/Resident-dashboard/components/ProductDetail?id=${productRef.id}` :
            `/Resident-dashboard/components/PropertyDetail?id=${propertyRef.id}`
          }
          className="bg-white border-b border-gray-100 p-3 flex items-center hover:bg-gray-50 transition-colors"
        >
          <div className="mr-3 bg-blue-50 rounded-full p-2">
            <Tag className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium">
              {productRef?.id ? 'Product Inquiry' : 'Property Inquiry'}
            </p>
            <p className="text-sm text-gray-800 font-medium truncate">
              {productRef?.title || propertyRef?.title}
            </p>
          </div>
          <div className="ml-2 text-xs text-blue-600 font-semibold">View</div>
        </Link>
      )}
      
      {/* Chat Messages - Modern Style */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-4 space-y-6"
        style={{
          backgroundColor: '#ffffff'
        }}
      >
        {chatMessages.length === 0 && (productRef?.title || propertyRef?.title) && (
          <div className="bg-gray-50 rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="font-semibold text-blue-600 mb-2">Welcome!</p>
            <p className="text-gray-600">You're inquiring about: <span className="font-medium text-gray-800">{productRef?.title || propertyRef?.title}</span></p>
            <p className="mt-2 text-gray-500 text-sm">Start the conversation by introducing yourself.</p>
          </div>
        )}
      
        {chatMessages.length === 0 && !productRef && !propertyRef ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center mb-6">
              <User className="h-12 w-12 text-white" />
            </div>
            <p className="text-gray-800 font-medium text-lg">No messages yet</p>
            <p className="text-gray-500 mt-1">Start a conversation!</p>
          </div>
        ) : (
          Object.entries(groupMessagesByDay()).map(([day, dayMessages]) => (
            <div key={day} className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-gray-100 text-gray-500 text-xs px-4 py-1.5 rounded-full font-medium">
                  {day}
                </div>
              </div>
              
              {dayMessages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${message.isIncoming ? 'justify-start' : 'justify-end'} items-end space-x-2`}
                >
                  {message.isIncoming && shouldShowAvatar(message, index) && (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
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
                    <div className="w-8"></div>
                  )}
                  
                  <div className={`max-w-[85%] md:max-w-[70%] space-y-1`}>
                    <div
                      className={`px-4 py-2.5 rounded-[20px] ${
                        message.isIncoming
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-[#0D6EFD] text-white'
                      }`}
                    >
                      {message.media && (
                        <div className="mb-2">
                          {message.media.type?.startsWith('image/') ? (
                            <div className="rounded-xl overflow-hidden">
                              <img 
                                src={message.media.url} 
                                alt="Shared image" 
                                className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                loading="lazy"
                                onClick={() => openImageViewer(message.media.url)}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center p-2 bg-gray-50 rounded-xl">
                              <Paperclip className="mr-2 text-gray-500" />
                              <a 
                                href={message.media.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 underline text-sm truncate max-w-[200px]"
                              >
                                {message.media.filename || 'Attachment'}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {message.text && <p className="text-sm break-words">{message.text}</p>}
                    </div>
                    
                    <div className={`flex items-center text-xs ${message.isIncoming ? '' : 'justify-end'}`}>
                      <span className="text-gray-400">
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
        <div className="bg-white border-t border-gray-100 p-3 flex overflow-x-auto space-x-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative flex-shrink-0 group">
              <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shadow-sm">
                {file.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`Preview ${index}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Paperclip className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => removeSelectedFile(index)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-90 hover:opacity-100 transition-opacity"
                disabled={sending}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Message Input - Modern Style */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center bg-gray-50 rounded-full overflow-hidden shadow-inner">
          <button
            onClick={() => fileInputRef.current.click()}
            className="p-3 text-gray-500 hover:text-blue-500 transition-colors"
            disabled={sending}
          >
            <Image size={22} />
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
            className="flex-1 py-3 px-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
            disabled={sending}
          />
          
          <button
            onClick={handleSendClick}
            disabled={sending || (!newMessage.trim() && !selectedFiles.length)}
            className={`p-3 ${
              sending || (!newMessage.trim() && !selectedFiles.length)
                ? 'text-gray-400'
                : 'text-[#0D6EFD] hover:text-blue-700'
            } transition-colors`}
          >
            {sending ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Send size={22} />
            )}
          </button>
        </div>
      </div>

      {/* Image Viewer - Keep existing code but update styling */}
      {viewerOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeImageViewer}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={closeImageViewer}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 p-2 rounded-full"
              aria-label="Close viewer"
            >
              <X size={24} />
            </button>
            
            {/* Zoom controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full py-2 px-4 flex items-center space-x-4 z-10">
              <button 
                onClick={() => handleZoom(-0.2)}
                className="text-white hover:text-gray-300 disabled:opacity-50"
                disabled={zoomLevel <= 0.5}
                aria-label="Zoom out"
              >
                <ZoomOut size={20} />
              </button>
              
              <span className="text-white text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
              
              <button 
                onClick={() => handleZoom(0.2)}
                className="text-white hover:text-gray-300 disabled:opacity-50"
                disabled={zoomLevel >= 3}
                aria-label="Zoom in"
              >
                <ZoomIn size={20} />
              </button>
              
              <button 
                onClick={() => setZoomLevel(1)}
                className="text-white hover:text-gray-300 ml-2"
                aria-label="Reset zoom"
              >
                {zoomLevel > 1 ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
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
                className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
                draggable="false"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}