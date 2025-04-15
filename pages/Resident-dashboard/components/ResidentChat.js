import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Check, CheckCheck, X, ArrowLeft, Send, MessageCircle } from 'lucide-react';

export default function ResidentChat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [messageStatus, setMessageStatus] = useState({});
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  const generateResidentColor = (userId) => {
    const numericId = typeof userId === 'string' ?
      userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) :
      userId;
    const hue = numericId % 360;
    const saturation = 60 + (numericId % 20);
    const lightness = 45 + (numericId % 20);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
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
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [router]);

  // In your handleSendMessage function
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
  
    const tempId = Date.now().toString();
    setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }));
    
    try {
      const response = await fetch('/api/Message-Api/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          societyCode: currentUser.societyCode, // Changed from societyId to societyCode
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
      setMessages([...messages, data.message]);
      setMessageStatus(prev => ({ ...prev, [data.message._id]: 'sent' }));
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setMessageStatus(prev => ({ ...prev, [tempId]: 'failed' }));
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
          <CheckCheck className="w-4 h-4 text-gray-400" />
        )}
        {status === 'sent' && (
          <CheckCheck className="w-4 h-4 text-blue-500" />
        )}
        {status === 'failed' && (
          <X className="w-4 h-4 text-red-500" />
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
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-sm z-50">
        <div className="p-4 md:p-6 max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-base hidden sm:inline">Back</span>
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-blue-600 flex items-center">
            <MessageCircle className="mr-2" size={24} />
            Society Chat
          </h1>
          <div className="w-10 sm:w-20" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 h-[calc(100vh-120px)]">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden min-h-full flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
              <div key={date} className="space-y-3">
                <div className="flex justify-center sticky top-2 z-10">
                  <span className="bg-blue-100 text-blue-800 text-xs px-4 py-1 rounded-full shadow-sm">
                    {formatDateHeader(date)}
                  </span>
                </div>

                {dateMessages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-3 shadow-sm ${
                        message.senderId === currentUser?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white'
                      }`}
                    >
                      <div
                        className={`text-sm font-semibold mb-1 ${
                          message.senderId === currentUser?.id ? 'text-blue-100' : 'text-blue-600'
                        }`}
                      >
                        {message.senderName}
                      </div>

                      <div className={message.senderId === currentUser?.id ? 'text-white' : 'text-gray-800'}>
                        {message.isDeleted ? (
                          <span className="italic opacity-75">This message was deleted</span>
                        ) : (
                          message.content
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center text-xs opacity-75">
                          {formatMessageTime(message.timestamp)}
                          <MessageStatus messageId={message._id} senderId={message.senderId} />
                        </div>
                        {!message.isDeleted && message.senderId === currentUser?.id && (
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            className="text-xs opacity-75 hover:opacity-100 transition-opacity ml-4"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-3 sm:p-4 bg-white border-t border-gray-100 sticky bottom-0">
            <div className="flex space-x-2 max-w-4xl mx-auto">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-4 sm:px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
              >
                <Send size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}