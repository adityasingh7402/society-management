import React, { useRef, useEffect, useState } from 'react';
import { X, Send, User, Check, CheckCheck, Paperclip, Loader2, Phone, ArrowLeft, MoreVertical, Image, ZoomIn, ZoomOut, Maximize2, Minimize2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll - simplified without keyboard handling
  useEffect(() => {
    if (messagesEndRef.current) {
      const shouldSmoothScroll = !isFirstLoad;

      messagesEndRef.current?.scrollIntoView({
        behavior: shouldSmoothScroll ? 'smooth' : 'auto',
        block: 'end'
      });

      if (isFirstLoad && chatMessages.length > 0) {
        setIsFirstLoad(false);
      }
    }
  }, [chatMessages, isFirstLoad]);

  useEffect(() => {
    setIsFirstLoad(true);
  }, [selectedResident]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

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

    chatMessages.forEach(message => {
      const day = getMessageDay(message.timestamp);
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(message);
    });

    return grouped;
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

  const handleMouseDown = (e) => {
    if (zoomLevel <= 1) return;
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

  const shouldShowAvatar = (message, index) => {
    if (index === 0) return true;
    if (!message.isIncoming) return false;

    const prevMessage = chatMessages[index - 1];
    return prevMessage.isIncoming !== message.isIncoming ||
      new Date(message.timestamp) - new Date(prevMessage.timestamp) > 300000;
  };

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
              onClick={onClose}
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
                {selectedResident.userImage ? (
                  <img
                    src={selectedResident.userImage}
                    alt={selectedResident.name}
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
                {selectedResident.name}
              </h2>
              <p className="text-xs text-gray-500 truncate max-w-[140px] sm:max-w-xs">
                {selectedResident.flatDetails?.flatNumber ?
                  `Flat: ${selectedResident.flatDetails?.flatNumber}` :
                  'Online'}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Product/Property Reference Banner */}
      <AnimatePresence>
        {(productRef?.id || propertyRef?.id) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href={productRef?.id ?
                `/Resident-dashboard/components/ProductDetail?id=${productRef.id}` :
                `/Resident-dashboard/components/PropertyDetail?id=${propertyRef.id}`
              }
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
                  {productRef?.id ? 'Product Inquiry' : 'Property Inquiry'}
                </p>
                <p className="text-sm text-gray-800 font-medium truncate">
                  {productRef?.title || propertyRef?.title}
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
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white"
        style={{
          minHeight: 0,
          scrollBehavior: 'smooth'
        }}
      >
        <AnimatePresence mode="wait">
          {chatMessages.length === 0 && (productRef?.title || propertyRef?.title) ? (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 shadow-sm border border-blue-100 mx-2"
            >
              <p className="font-semibold text-blue-700 mb-2">Welcome! 👋</p>
              <p className="text-gray-700">You're inquiring about: <span className="font-medium text-gray-900">{productRef?.title || propertyRef?.title}</span></p>
              <p className="mt-2 text-gray-600 text-sm">Start the conversation by introducing yourself.</p>
            </motion.div>
          ) : chatMessages.length === 0 ? (
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
              <p className="text-gray-500 mt-1">Start a conversation! 💬</p>
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
                  {dayMessages.map((message, index) => (
                    <motion.div
                      key={message.id || index}
                      initial={{
                        opacity: 0,
                        x: message.isIncoming ? -20 : 20,
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
                      className={`flex ${message.isIncoming ? 'justify-start' : 'justify-end'} items-end space-x-2`}
                    >
                      {message.isIncoming && shouldShowAvatar(message, index) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.05 + 0.1 }}
                          className="h-7 w-7 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center shadow-sm"
                        >
                          {selectedResident.userImage ? (
                            <img
                              src={selectedResident.userImage}
                              alt={selectedResident.name}
                              className="h-7 w-7 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-3 w-3 text-gray-500" />
                          )}
                        </motion.div>
                      )}

                      {message.isIncoming && !shouldShowAvatar(message, index) && (
                        <div className="w-7"></div>
                      )}

                      <div className="max-w-[280px] sm:max-w-[320px] space-y-1">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className={`px-4 py-2.5 rounded-[18px] shadow-sm transition-all duration-200 ${message.isIncoming
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            }`}
                        >
                          {message.media && (
                            <div className="mb-2">
                              {message.media.type?.startsWith('image/') ? (
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  className="rounded-xl overflow-hidden"
                                >
                                  <img
                                    src={message.media.url}
                                    alt="Shared image"
                                    className="w-full h-auto cursor-pointer transition-opacity duration-200"
                                    loading="lazy"
                                    onClick={() => openImageViewer(message.media.url)}
                                  />
                                </motion.div>
                              ) : (
                                <div className="flex items-center p-2 bg-gray-50 rounded-xl">
                                  <Paperclip className="mr-2 text-gray-500" size={16} />
                                  <span className="text-gray-700 text-sm truncate max-w-[180px]">
                                    {message.media.filename || 'Attachment'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          {message.text && <p className="text-sm break-words leading-relaxed">{message.text}</p>}
                        </motion.div>

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
                    </motion.div>
                  ))}
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

      {/* Message Input - Simplified without keyboard handling */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="p-3 bg-white border-t border-gray-100 relative z-10"
      >
        <div className="flex items-center bg-gray-50 rounded-full overflow-hidden shadow-sm border border-gray-200 transition-all duration-200 focus-within:shadow-md focus-within:border-blue-300">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 hover:text-blue-500 transition-colors duration-200"
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
          </motion.button>

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendClick()}
            placeholder="Type a message..."
            className="flex-1 py-3 px-2 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
            disabled={sending}
          />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSendClick}
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
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
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