import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ChevronRight,
  ChevronDown,
  Store,
  Home,
  MessageCircle,
  ArrowLeft,
  Bell,
  X
} from 'lucide-react';

export default function Notifications() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState({
    today: [],
    older: {} // Will store messages grouped by date
  });
  const [residentDetails, setResidentDetails] = useState(null);

  // Fetch resident details
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("Resident");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch("/api/Resident-Api/get-resident-details", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setResidentDetails(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        if (error.message === "Failed to fetch profile") {
          localStorage.removeItem("Resident");
          router.push("/login");
        }
      }
    };

    fetchProfile();
  }, [router]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!residentDetails?._id) return;

      try {
        const token = localStorage.getItem("Resident");
        if (!token) return;

        // Fetch both property and product messages
        const [propertyRes, productRes] = await Promise.all([
          fetch('/api/Property-Api/get-messages', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/Product-Api/get-messages', {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        const propertyData = await propertyRes.json();
        const productData = await productRes.json();

        // Add type to each message and filter unread messages
        const propertyMessages = propertyData
          .filter(msg => !msg.isRead && msg.receiverId === residentDetails._id)
          .map(msg => ({ ...msg, type: 'Property' }));
        const productMessages = productData
          .filter(msg => !msg.isRead && msg.receiverId === residentDetails._id)
          .map(msg => ({ ...msg, type: 'Product' }));

        // Combine and sort all messages
        const allMessages = [...propertyMessages, ...productMessages]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Group messages by date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const grouped = {
          today: [],
          older: {}
        };

        allMessages.forEach(message => {
          const messageDate = new Date(message.createdAt);
          messageDate.setHours(0, 0, 0, 0);

          if (messageDate.getTime() === today.getTime()) {
            grouped.today.push(message);
          } else {
            const dateStr = messageDate.toLocaleDateString();
            if (!grouped.older[dateStr]) {
              grouped.older[dateStr] = [];
            }
            grouped.older[dateStr].push(message);
          }
        });

        setMessages(grouped);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    };

    fetchMessages();
  }, [residentDetails?._id]);

  // Handle message click
  const handleMessageClick = async (type, message) => {
    try {
      const token = localStorage.getItem("Resident");
      if (!token) return;

      // Mark message as read
      await fetch(`/api/${type}-Api/mark-as-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderId: message.senderId })
      });

      // Remove message from state
      setMessages(prev => {
        const newMessages = { ...prev };
        
        // Remove from today's messages
        newMessages.today = newMessages.today.filter(msg => msg._id !== message._id);
        
        // Remove from older messages
        Object.keys(newMessages.older).forEach(date => {
          newMessages.older[date] = newMessages.older[date].filter(msg => msg._id !== message._id);
          // Remove date if no messages left
          if (newMessages.older[date].length === 0) {
            delete newMessages.older[date];
          }
        });
        
        return newMessages;
      });

      // Navigate to chat
      const path = type === 'Property' ? 'PropertyChat' : 'ProductChat';
      router.push(`/Resident-dashboard/components/${path}?${type.toLowerCase()}Id=${message[`${type.toLowerCase()}Id`]}&otherUserId=${message.senderId}`);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Message component
  const MessageItem = ({ message }) => (
    <div
      onClick={() => handleMessageClick(message.type, message)}
      className="p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer relative group"
    >
      <div className="flex items-start space-x-4">
        <div className={`${message.type === 'Property' ? 'bg-blue-500' : 'bg-green-500'} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
          {message.type === 'Property' ? (
            <Home className="w-5 h-5 text-white" />
          ) : (
            <Store className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {message.type === 'Property' ? 'Property Message' : 'Product Message'}
          </p>
          <p className="text-sm text-gray-500">
            {message.senderName}: {message.message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const totalMessages = messages.today.length + 
    Object.values(messages.older).reduce((sum, msgs) => sum + msgs.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#7C3AED] shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-white">Notifications</h1>
                  <p className="text-sm text-white/80">{totalMessages} new messages</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Today's Messages */}
        {messages.today.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Today</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden divide-y divide-gray-100">
              {messages.today.map((message) => (
                <MessageItem key={message._id} message={message} />
              ))}
            </div>
          </div>
        )}

        {/* Older Messages */}
        {Object.entries(messages.older).map(([date, dateMessages]) => (
          <div key={date} className="mb-4">
            <h2 className="text-sm font-medium text-gray-500 mb-2">{date}</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden divide-y divide-gray-100">
              {dateMessages.map((message) => (
                <MessageItem key={message._id} message={message} />
              ))}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {totalMessages === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No new messages</h3>
            <p className="text-gray-500">You're all caught up! Check back later for new messages.</p>
          </div>
        )}
      </div>
    </div>
  );
} 