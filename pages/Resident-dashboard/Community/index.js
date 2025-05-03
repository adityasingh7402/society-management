import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';

import CommunityHeader from '../../../components/Community/CommunityHeader';
import ResidentList from '../../../components/Community/ResidentList';
import ChatModal from '../../../components/Community/ChatModal';
import CallModal from '../../../components/Community/CallModal';
import { setupWebSocket, fetchResidentDetails, fetchResidents, fetchUnreadCounts } from '../../../services/CommunityService';

export default function Community() {
  const router = useRouter();
  const [residents, setResidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [residentDetails, setResidentDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Chat state
  const [selectedResident, setSelectedResident] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [messageStatus, setMessageStatus] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Call state
  const [inCall, setInCall] = useState(false);
  const [callWith, setCallWith] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState(null);

  // WebRTC refs
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const socketRef = useRef(null);

  // Add socket connection state
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      const details = await fetchResidentDetails(router);
      if (details) {
        setResidentDetails(details);
      }
    };
    
    initializeData();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (callTimer) {
        clearInterval(callTimer);
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
          markMessagesAsReadByRecipient,
          handleIncomingCall,
          handleCallAnswered,
          handleCallRejected,
          handleIceCandidate
        );
        
        // Only set socket ref and add listeners if socket was created
        if (socket) {
          socketRef.current = socket;
          
          // Add socket connection state handlers
          socket.on('connect', () => {
            setSocketConnected(true);
            setSocketError(false);
            
            // Re-fetch unread counts after connection
            fetchUnreadCounts(residentDetails._id, setUnreadCounts);
          });
          
          socket.on('connect_error', (error) => {
            setSocketConnected(false);
            setSocketError(true);
            
            // Show error message to user
            toast.error('Unable to connect to chat server. Please try refreshing the page.', {
              duration: 5000,
              id: 'socket-error',
            });
          });
          
          socket.on('disconnect', (reason) => {
            setSocketConnected(false);
            setSocketError(true);
            
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
            // Re-fetch unread counts after reconnection
            fetchUnreadCounts(residentDetails._id, setUnreadCounts);
          });
          
          socket.on('auth_error', (data) => {
            setSocketConnected(false);
            setSocketError(true);
            
            // Check if token issue and show appropriate message
            if (data.message.includes('token') || data.message.includes('auth')) {
              toast.error('Authentication error. Please refresh the page or log in again.', {
                duration: 5000,
                id: 'auth-error',
              });
            }
          });
        } else {
          // No socket was created, likely due to missing token
          setSocketConnected(false);
          setSocketError(true);
          
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

  // Update call duration timer
  useEffect(() => {
    if (inCall) {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      setCallTimer(timer);
      return () => clearInterval(timer);
    } else {
      setCallDuration(0);
      if (callTimer) {
        clearInterval(callTimer);
      }
    }
  }, [inCall]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (selectedResident && unreadCounts[selectedResident._id] > 0) {
      markMessagesAsRead(selectedResident._id);
    }
  }, [selectedResident, unreadCounts]);

  // Add a function to refresh unread counts periodically and on relevant events
  useEffect(() => {
    // Check if we have the resident's ID
    if (residentDetails && residentDetails._id) {
      // Initial fetch
      fetchUnreadCounts(residentDetails._id, setUnreadCounts);
      
      // Set up periodic refresh
      const refreshInterval = setInterval(() => {
        if (socketConnected) {
          fetchUnreadCounts(residentDetails._id, setUnreadCounts);
        }
      }, 10000); // Refresh every 10 seconds when connected
      
      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [residentDetails, socketConnected]);

  const fetchMessages = async (recipientId) => {
    try {
      const token = localStorage.getItem('Resident');
      const response = await fetch(`/api/chat/messages?userId=${residentDetails._id}&recipientId=${recipientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();

      // Update chat messages state with fetched messages
      setChatMessages(prevMessages => ({
        ...prevMessages,
        [recipientId]: data.messages.map(msg => ({
          id: msg._id,
          sender: msg.senderId,
          text: msg.message,
          timestamp: msg.timestamp,
          status: msg.status,
          isIncoming: msg.senderId !== residentDetails._id,
          media: msg.media || null
        }))
      }));
    } catch (error) {
      toast.error('Failed to load messages');
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

    // Play notification sound
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5; // Lower volume
      audio.play().catch(e => {});
    } catch (error) {
      // Error playing notification sound
    }
  };

  const updateMessageStatus = (data) => {
    const { messageId, status } = data;
    
    // Update message status in all chats
    setChatMessages(prevMessages => {
      const newMessages = { ...prevMessages };
      let updated = false;
      
      // Find the message in all conversations
      Object.keys(newMessages).forEach(recipientId => {
        const updatedMessages = newMessages[recipientId].map(msg => {
          if (msg.id === messageId) {
            updated = true;
            return { ...msg, status };
          }
          return msg;
        });
        
        newMessages[recipientId] = updatedMessages;
      });
      
      return newMessages;
    });
  };

  const markMessagesAsReadByRecipient = (data) => {
    const { from } = data;
    
    // Update all messages sent to this recipient as read
    setChatMessages(prevMessages => {
      if (!prevMessages[from]) {
        return prevMessages;
      }
      
      const updatedMessages = prevMessages[from].map(msg => 
        !msg.isIncoming ? { ...msg, status: 'read' } : msg
      );
      
      return {
        ...prevMessages,
        [from]: updatedMessages
      };
    });
  };

  const handleIncomingCall = async (data) => {
    const { callerId, offer } = data;
    const caller = residents.find(r => r._id === callerId);
    
    if (!caller) return;
    
    if (window.confirm(`Incoming call from ${caller.name}. Accept?`)) {
      try {
        await setupPeerConnection();
        
        // Set the remote description (offer)
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Create answer
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        
        // Send answer to caller
        socketRef.current.emit('call-answer', {
          to: callerId,
          answer
        });
        
        setInCall(true);
        setCallWith(caller);
      } catch (error) {
        toast.error('Failed to establish call connection');
      }
    } else {
      socketRef.current.emit('call-rejected', {
        to: callerId
      });
    }
  };

  const handleCallAnswered = async (data) => {
    const { answer } = data;
    
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      toast.error('Failed to establish call connection');
      endCall();
    }
  };

  const handleCallRejected = () => {
    toast.error('Call was rejected');
    endCall();
  };

  const handleIceCandidate = async (data) => {
    const { candidate } = data;
    
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      // Error adding ICE candidate
    }
  };

  const startCall = async (recipient) => {
    try {
      await setupPeerConnection();
      
      // Create offer
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      // Send offer to recipient
      socketRef.current.emit('call-request', {
        to: recipient._id,
        offer
      });
      
      setInCall(true);
      setCallWith(recipient);
      toast.success(`Calling ${recipient.name}...`);
    } catch (error) {
      toast.error('Failed to start call');
      endCall();
    }
  };

  const setupPeerConnection = async () => {
    try {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      const pc = new RTCPeerConnection(configuration);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      
      // Store local stream
      localStreamRef.current = stream;
      
      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Handle incoming tracks
      pc.ontrack = (event) => {
        if (remoteStreamRef.current && remoteStreamRef.current.srcObject !== event.streams[0]) {
          remoteStreamRef.current.srcObject = event.streams[0];
        }
      };
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current && callWith) {
          socketRef.current.emit('ice-candidate', {
            to: callWith._id,
            candidate: event.candidate
          });
        }
      };
      
      // Store peer connection
      peerConnectionRef.current = pc;
      
      return pc;
    } catch (error) {
      throw error;
    }
  };

  const endCall = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Reset call state
    setInCall(false);
    setCallWith(null);
    setIsMuted(false);
    setCallDuration(0);
    
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const track = audioTracks[0];
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      }
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFiles.length) || !selectedResident) return;

    try {
      const token = localStorage.getItem('Resident');
      if (!token) {
        throw new Error('Authentication token missing. Please log in again.');
      }
      
      if (!residentDetails || !residentDetails._id) {
        throw new Error('Sender information missing. Please refresh the page.');
      }
      
      // If there are files, use FormData
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        
        // Add message text and IDs - ensure message is never empty
        formData.append('message', newMessage.trim() || 'Image message');
        formData.append('recipientId', selectedResident._id);
        formData.append('senderId', residentDetails._id);
        
        // Add files if any
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
          throw new Error(errorData.message || `Failed to send message: ${response.status}`);
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

  const filteredResidents = residents.filter(resident =>
    resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resident.flatDetails?.flatNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <CommunityHeader router={router} />
      
      {socketError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 text-sm flex justify-between items-center">
          <div>
            <span>Connection to chat server is unavailable. Some features may be limited.</span>
            <button 
              onClick={() => {
                if (socketRef.current) {
                  socketRef.current.connect();
                }
              }}
              className="ml-2 text-blue-600 underline"
            >
              Try again
            </button>
          </div>
          <button 
            onClick={() => setSocketError(false)} 
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <ResidentList 
          residents={filteredResidents}
          isLoading={isLoading}
          unreadCounts={unreadCounts}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onChatSelect={(resident) => {
            setSelectedResident(resident);
            setShowChat(true);
            fetchMessages(resident._id);
            // Mark as read when opening chat
            if (unreadCounts[resident._id] > 0) {
              markMessagesAsRead(resident._id);
            }
          }}
          onCallStart={startCall}
          inCall={inCall}
          socketConnected={socketConnected}
        />
      </div>

      {showChat && selectedResident && (
        <ChatModal
          selectedResident={selectedResident}
          chatMessages={chatMessages[selectedResident._id] || []}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onClose={() => setShowChat(false)}
          onSend={sendMessage}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
        />
      )}

      {inCall && callWith && (
        <CallModal
          callWith={callWith}
          callDuration={callDuration}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onEndCall={endCall}
          localStreamRef={localStreamRef}
          remoteStreamRef={remoteStreamRef}
        />
      )}
    </div>
  );
} 