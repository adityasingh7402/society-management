import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export default function SocietyChat() {
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
        const token = localStorage.getItem('Society');
        if (!token) {
          router.push('/societyLogin');
          return;
        }

        const userResponse = await fetch('/api/Society-Api/get-society-details', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userResponse.ok) throw new Error('Failed to fetch profile');
        const userData = await userResponse.json();

        setCurrentUser({
          id: userData.societyId,
          name: userData.societyName,
          isSociety: true
        });

        const messagesResponse = await fetch(`/api/Message-Api/getMessages?societyId=${userData.societyId}`, {
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

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
  
    const tempId = Date.now().toString();
    setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }));
    
    try {
      const response = await fetch('/api/Message-Api/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          societyId: currentUser.id,
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
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === 'sent' && (
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M5 13l4 4L19 7" />
          </svg>
        )}
        {status === 'failed' && (
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
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
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow-sm p-4 flex items-center sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-gray-800">Society Chat</h1>
        <span className="ml-2 text-sm text-gray-500">({messages.length} messages)</span>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{
          backgroundImage: 'url("/whatsapp-bg-light.png")',
          backgroundRepeat: 'repeat'
        }}
      >
        {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
          <div key={date} className="space-y-2">
            <div className="flex justify-center">
              <span className="bg-gray-200 text-gray-600 text-xs px-4 py-1 rounded-full">
                {formatDateHeader(date)}
              </span>
            </div>

            {dateMessages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${message.senderId === currentUser?.id
                    ? 'bg-[#dcf8c6]'
                    : 'bg-white'
                    }`}
                >
                  <div
                    className="text-sm font-semibold mb-1"
                    style={{
                      color: message.isSociety ? '#1a73e8' :
                        generateResidentColor(message.senderId)
                    }}
                  >
                    {message.senderName}
                  </div>

                  <div className="text-gray-800">
                    {message.isDeleted ? (
                      <span className="italic text-gray-500">This message was deleted</span>
                    ) : (
                      message.content
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center text-xs text-gray-500">
                      {formatMessageTime(message.timestamp)}
                      <MessageStatus messageId={message._id} senderId={message.senderId} />
                    </div>
                    {!message.isDeleted && message.senderId === currentUser?.id && (
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="text-gray-400 hover:text-red-500 text-xs"
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

      <div className="bg-white p-4 shadow-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}