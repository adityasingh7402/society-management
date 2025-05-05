import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import { Search, Bell, User, ArrowLeft, Users, Shield, Headphones, MessageCircle, Building2, Loader2 } from 'lucide-react';

import ResidentList from '../../../components/Community/ResidentList';
import ChatModal from '../../../components/Community/ChatModal';
import { setupWebSocket, fetchResidentDetails, fetchResidents, fetchUnreadCounts } from '../../../services/CommunityService';

export default function Community() {
  const router = useRouter();
  const [residents, setResidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [residentDetails, setResidentDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [societyManagerPhone, setSocietyManagerPhone] = useState('');
  const [activeSection, setActiveSection] = useState(null);

  // Chat state
  const [selectedResident, setSelectedResident] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [messageStatus, setMessageStatus] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Socket state
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(false);
  const [socketLoading, setSocketLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      const details = await fetchResidentDetails(router);
      if (details) {
        setResidentDetails(details);
        
        // Fetch society details to get manager phone
        try {
          const token = localStorage.getItem('Resident');
          const response = await fetch(`/api/societies/${details.societyCode}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const societyData = await response.json();
            if (societyData.managerPhone) {
              setSocietyManagerPhone(societyData.managerPhone);
            }
          }
        } catch (error) {
          console.error('Error fetching society details:', error);
        }
      }
    };
    
    initializeData();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (residentDetails && residentDetails._id) {
      const loadResidents = async () => {
        setIsLoading(true);
        const residentsData = await fetchResidents(residentDetails);
        setResidents(residentsData);
        setIsLoading(false);
      };
      
      loadResidents();
      
      // Setup socket connection
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
          residentDetails, 
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
            
            // Re-fetch unread counts after connection
            fetchUnreadCounts(residentDetails._id, setUnreadCounts);
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
            // Re-fetch unread counts after reconnection
            fetchUnreadCounts(residentDetails._id, setUnreadCounts);
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
      
      // Fetch unread message counts
      fetchUnreadCounts(residentDetails._id, setUnreadCounts);
    }
  }, [residentDetails]);

  const fetchMessages = async (recipientId) => {
    try {
      const token = localStorage.getItem('Resident');
      
      const response = await fetch(`/api/chat/messages?userId=${residentDetails._id}&recipientId=${recipientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch messages');
      }
      
      const data = await response.json();
      
      // Format messages for UI display
      const formattedMessages = data.messages.map(msg => ({
        id: msg._id,
        sender: msg.senderId,
        text: msg.message,
        timestamp: msg.timestamp,
        status: msg.status,
        isIncoming: msg.senderId !== residentDetails._id,
        media: msg.media || null
      }));
      
      // Update chat messages state
      setChatMessages(prev => ({
        ...prev,
        [recipientId]: formattedMessages
      }));
      
      return formattedMessages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages. Please try again.');
      return [];
    }
  };

  const markMessagesAsRead = async (senderId) => {
    try {
      if (!senderId) {
        return;
      }
      
      const token = localStorage.getItem('Resident');
      const response = await fetch('/api/chat/mark-as-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderId,
          userId: residentDetails._id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error('Failed to mark messages as read');
      }

      // Update unread counts
      setUnreadCounts(prev => ({
        ...prev,
        [senderId]: 0
      }));

      // Notify sender that messages were read via socket
      if (socketRef.current) {
        socketRef.current.emit('messages_read', {
          to: senderId,
          from: residentDetails._id
        });
      }
      
      // Also update local chat state to show messages as read
      setChatMessages(prevMessages => {
        if (!prevMessages[senderId]) return prevMessages;
        
        return {
          ...prevMessages,
          [senderId]: prevMessages[senderId].map(msg => 
            msg.isIncoming ? { ...msg, status: 'read' } : msg
          )
        };
      });
    } catch (error) {
      // Error marking messages as read
    }
  };

  const handleIncomingMessage = (message) => {
    const { from, text, timestamp, id, media } = message;
    
    // Update chat messages - ensure we don't add duplicates by checking message ID
    setChatMessages(prevMessages => {
      const existingMessages = prevMessages[from] || [];
      const isMessageExists = existingMessages.some(msg => msg.id === id);
      
      // If message already exists, don't add it again
      if (isMessageExists) return prevMessages;
      
      const updatedMessages = {
        ...prevMessages,
        [from]: [
          ...existingMessages,
          {
            id,
            sender: from,
            text,
            timestamp,
            status: 'delivered',
            isIncoming: true,
            media
          }
        ]
      };
      
      // Update UI immediately
      setTimeout(() => {
        const messageContainer = document.querySelector('.chat-messages');
        if (messageContainer) {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }
      }, 50);
      
      return updatedMessages;
    });

    // Update unread count if chat is not open with this sender
    if (!selectedResident || selectedResident._id !== from) {
      setUnreadCounts(prev => ({
        ...prev,
        [from]: (prev[from] || 0) + 1
      }));
      
      // Also refresh from server to ensure accuracy
      setTimeout(() => {
        fetchUnreadCounts(residentDetails._id, setUnreadCounts);
      }, 500);
      
      // Acknowledge message receipt, but don't mark as read
      if (socketRef.current) {
        socketRef.current.emit('message_status', {
          to: from,
          messageId: id,
          status: 'delivered'
        });
      }
    } else {
      // If chat is open, mark as read immediately
      markMessagesAsRead(from);
    }
  };

  const updateMessageStatus = (data) => {
    const { messageId, status } = data;
    
    // Update message status in chat state
    setMessageStatus(prev => ({
      ...prev,
      [messageId]: status
    }));
    
    // Also update message object in the chatMessages state
    setChatMessages(prevMessages => {
      let updated = false;
      
      // Create new object with updated message status
      const newMessages = {};
      
      // Check all conversations for the message
      Object.keys(prevMessages).forEach(recipientId => {
        newMessages[recipientId] = prevMessages[recipientId].map(msg => {
          if (msg.id === messageId) {
            updated = true;
            return {
              ...msg,
              status
            };
          }
          return msg;
        });
      });
      
      return updated ? newMessages : prevMessages;
    });
  };

  const markMessagesAsReadByRecipient = (data) => {
    const { from } = data;
    
    // Mark all messages sent to this recipient as read
    setChatMessages(prevMessages => {
      if (!prevMessages[from]) return prevMessages;
      
      return {
        ...prevMessages,
        [from]: prevMessages[from].map(msg => 
          !msg.isIncoming ? { ...msg, status: 'read' } : msg
        )
      };
    });
  };

  // Replace WebRTC call with phone dialer
  const startCall = (resident) => {
    if (resident.phoneNumber) {
      window.open(`tel:${resident.phoneNumber}`);
    } else {
      toast.error('No phone number available for this resident');
    }
  };

  const handleChatSelect = async (resident) => {
    setSelectedResident(resident);
    setShowChat(true);
    
    // Fetch messages if not already loaded
    if (!chatMessages[resident._id] || chatMessages[resident._id].length === 0) {
      await fetchMessages(resident._id);
    }
    
    // Mark messages as read when opening chat
    if (unreadCounts[resident._id] && unreadCounts[resident._id] > 0) {
      markMessagesAsRead(resident._id);
    }
  };

  const closeChat = () => {
    setShowChat(false);
    setSelectedResident(null);
    setNewMessage('');
    setSelectedFiles([]);
  };

  const navigateBack = () => {
    // Use window.location instead of router.push to force a full page reload
    window.location.href = '/Resident-dashboard';
  };

  const handleOpenResidentChat = () => {
    setActiveSection('residents');
  };
  
  const handleOpenSocietyChat = () => {
    router.push('/Resident-dashboard/components/ResidentChat');
  };
  
  const handleOpenHelpDeskChat = () => {
    // Create a help desk "resident" object
    if (!societyManagerPhone) {
      toast.error('Help desk contact information not available');
      return;
    }
    
    // Create a help desk user object
    const helpDeskUser = {
      _id: 'helpdesk',
      name: 'Help Desk',
      phoneNumber: societyManagerPhone,
      isHelpDesk: true,
      flatDetails: { flatNumber: 'Society Manager' },
      userImage: '/support.png'
    };
    
    // Open chat with this user
    handleChatSelect(helpDeskUser);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) {
      return;
    }
    
    try {
      const token = localStorage.getItem('Resident');
      
      // If files are selected, use FormData to upload them
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('senderId', residentDetails._id);
        formData.append('recipientId', selectedResident._id);
        formData.append('message', newMessage.trim());
        
        // Add files to form data
        selectedFiles.forEach(file => {
          formData.append('media', file);
        });
        
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to send message');
        }
        
        const data = await response.json();
        handleSuccessfulMessage(data);
      } 
      // If no files, use JSON for simpler sending
      else {
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: newMessage.trim(),
            recipientId: selectedResident._id,
            senderId: residentDetails._id
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to send message: ${response.status}`);
        }

        const data = await response.json();
        handleSuccessfulMessage(data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    }
  };

  // Helper function to process successful message sending
  const handleSuccessfulMessage = (data) => {
    // Create message object
    const messageObj = {
      id: data.messageId,
      sender: residentDetails._id,
      text: newMessage,
      timestamp: new Date().toISOString(),
      status: 'sent',
      isIncoming: false,
      media: data.media || null
    };
    
    // Update local chat state
    setChatMessages(prevMessages => {
      const existingMessages = prevMessages[selectedResident._id] || [];
      
      return {
        ...prevMessages,
        [selectedResident._id]: [
          ...existingMessages,
          messageObj
        ]
      };
    });

    // Emit message via socket
    if (socketRef.current) {
      socketRef.current.emit('chat_message', {
        to: selectedResident._id,
        from: residentDetails._id,
        text: newMessage,
        messageId: data.messageId,
        media: data.media,
        timestamp: messageObj.timestamp
      });
    }

    // Reset input
    setNewMessage('');
    setSelectedFiles([]);
  };

  // Calculate total unread messages
  const totalUnreadMessages = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // Filter residents based on search query
  const filteredResidents = residents.filter(resident =>
    resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (resident.flatDetails?.flatNumber && resident.flatDetails.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {!showChat ? (
        <>
          {/* Directory View */}
          <div className="max-w-lg mx-auto bg-white min-h-screen pb-8">
            {/* App Header */}
            <div className="bg-teal-600 text-white px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <button
                    onClick={navigateBack}
                    className="mr-2"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                  <h1 className="text-xl font-medium">Society Directory</h1>
                </div>
                <div className="flex items-center">
                  {socketLoading && (
                    <div className="flex items-center text-white">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-xs">Connecting...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Directory Options */}
            {!activeSection ? (
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Select an option to chat</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Resident Block */}
                  <div 
                    onClick={handleOpenResidentChat} 
                    className="bg-white border-2 border-teal-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="bg-teal-50 p-4">
                      <Users className="h-12 w-12 text-teal-600 mx-auto" />
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-medium text-teal-700">Resident Chat</h3>
                      <p className="text-xs text-gray-500 mt-1">Chat with other residents</p>
                      {totalUnreadMessages > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 mt-2 inline-block">
                          {totalUnreadMessages} new {totalUnreadMessages === 1 ? 'message' : 'messages'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Society Chat Block */}
                  <div 
                    onClick={handleOpenSocietyChat} 
                    className="bg-white border-2 border-blue-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="bg-blue-50 p-4">
                      <Building2 className="h-12 w-12 text-blue-600 mx-auto" />
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-medium text-blue-700">Society Chat</h3>
                      <p className="text-xs text-gray-500 mt-1">Group discussion forum</p>
                    </div>
                  </div>
                  
                  {/* Security Block */}
                  <div 
                    className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-md cursor-not-allowed opacity-75"
                  >
                    <div className="bg-gray-50 p-4">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto" />
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-medium text-gray-500">Security</h3>
                      <p className="text-xs text-gray-400 mt-1">Contact security (coming soon)</p>
                    </div>
                  </div>
                  
                  {/* Help Desk Block */}
                  <div 
                    onClick={handleOpenHelpDeskChat} 
                    className="bg-white border-2 border-amber-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="bg-amber-50 p-4">
                      <Headphones className="h-12 w-12 text-amber-600 mx-auto" />
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-medium text-amber-700">Help Desk</h3>
                      <p className="text-xs text-gray-500 mt-1">Contact management</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeSection === 'residents' ? (
              <>
                {/* Search Bar */}
                <div className="bg-gray-100 px-4 py-2">
                  <div className="bg-white rounded-full px-4 py-2 flex items-center shadow-sm">
                    <Search className="h-4 w-4 text-gray-500 mr-2" />
                    <input
                      type="text"
                      placeholder="Search residents"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 outline-none text-sm"
                    />
                    <button 
                      onClick={() => setActiveSection(null)}
                      className="text-xs text-teal-600"
                    >
                      Back
                    </button>
                  </div>
                </div>

                {/* Residents List */}
                <div className="h-[calc(100vh-120px)] overflow-y-auto border-t">
                  <ResidentList 
                    residents={filteredResidents}
                    isLoading={isLoading}
                    unreadCounts={unreadCounts}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onChatSelect={handleChatSelect}
                    onCallStart={startCall}
                    socketConnected={socketConnected}
                  />
                </div>
              </>
            ) : null}
          </div>
        </>
      ) : (
        <>
          {/* Chat View */}
          <div className="fixed inset-0 bg-gray-100">
            <ChatModal
              selectedResident={selectedResident}
              chatMessages={chatMessages[selectedResident._id] || []}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onClose={closeChat}
              onSend={sendMessage}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
            />
          </div>
        </>
      )}
    </div>
  );
} 