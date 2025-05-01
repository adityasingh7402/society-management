import React, { useRef, useEffect } from 'react';
import { X, Send, User, Check, CheckCheck, Paperclip } from 'lucide-react';

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

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              <User className="text-gray-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{selectedResident.name}</h2>
              <p className="text-sm text-gray-500">Flat: {selectedResident.flatDetails?.flatNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            chatMessages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 flex ${message.isIncoming ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.isIncoming
                      ? 'bg-white border border-gray-200 text-gray-900'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {message.media && (
                    <div className="mb-2">
                      {message.media.type?.startsWith('image/') ? (
                        <img 
                          src={message.media.url} 
                          alt="Shared image" 
                          className="rounded-lg max-w-full h-auto"
                        />
                      ) : (
                        <div className="flex items-center p-2 bg-gray-100 rounded-lg">
                          <Paperclip className="mr-2 text-gray-500" />
                          <a 
                            href={message.media.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 underline"
                          >
                            {message.media.filename || 'Attachment'}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  {message.text && <p>{message.text}</p>}
                  <div className="flex items-center justify-end mt-1 space-x-1">
                    <p className="text-xs opacity-75">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {!message.isIncoming && (
                      <span className="ml-1">
                        {message.status === 'sent' && <Check className="h-3 w-3" />}
                        {message.status === 'delivered' && <CheckCheck className="h-3 w-3" />}
                        {message.status === 'read' && <CheckCheck className="h-3 w-3 text-blue-400" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="p-2 border-t flex overflow-x-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative mr-2">
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
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <button
              onClick={() => fileInputRef.current.click()}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            >
              <Paperclip />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSend()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={onSend}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Send />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 