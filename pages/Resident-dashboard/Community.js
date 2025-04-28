import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  Users, 
  MessageSquare, 
  Phone, 
  X, 
  Send, 
  Mic, 
  MicOff,
  User,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FaArrowLeft } from 'react-icons/fa';
import io from 'socket.io-client'; // Add this import

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
  
  // Call state
  const [inCall, setInCall] = useState(false);
  const [callWith, setCallWith] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // WebRTC refs
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const socketRef = useRef(null);
  
  // Message container ref for auto-scrolling
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchResidentDetails();
  }, []);

  useEffect(() => {
    if (residentDetails && residentDetails._id) {
      fetchResidents();
      setupWebSocket();
    }
  }, [residentDetails]);
  
  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, selectedResident]);

  const fetchResidentDetails = async () => {
    try {
      const token = localStorage.getItem('Resident');
      if (!token) {
        router.push('/Login');
        return;
      }

      const response = await fetch('/api/Resident-Api/get-resident-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resident details');
      }

      const data = await response.json();
      setResidentDetails(data);
    } catch (error) {
      console.error('Error fetching resident details:', error);
      toast.error('Failed to load resident details');
    }
  };

  const fetchResidents = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('Resident');
      
      const response = await fetch(`/api/Resident-Api/get-society-residents?societyId=${residentDetails.societyCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch residents');
      }

      const data = await response.json();
      // Filter out the current resident
      const filteredResidents = data.residents.filter(
        resident => resident._id !== residentDetails._id
      );
      setResidents(filteredResidents);
    } catch (error) {
      console.error('Error fetching residents:', error);
      toast.error('Failed to load residents');
    } finally {
      setIsLoading(false);
    }
  };
  
  const setupWebSocket = () => {
    // Get the token from localStorage
    const token = localStorage.getItem('Resident');
    
    // Use socket.io-client instead of native WebSocket
    const socket = io('', {
      path: '/api/websocket',
      auth: {
        token: token
      },
      transports: ['polling', 'websocket']
    });
    
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });
  
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      toast.error('Failed to connect to chat server');
    });
  
    // Add more detailed error logging
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Chat error occurred');
    });
    
    socketRef.current = socket;
    
    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  };
  
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedResident) return;
    
    // Use socket.io emit instead of WebSocket send
    socketRef.current.emit('chat_message', {
      to: selectedResident._id,
      message: newMessage.trim()
    });
    
    // Add message to local state
    setChatMessages(prevMessages => {
      const conversationId = selectedResident._id;
      const conversation = prevMessages[conversationId] || [];
      
      return {
        ...prevMessages,
        [conversationId]: [
          ...conversation,
          {
            sender: residentDetails._id,
            text: newMessage.trim(),
            timestamp: new Date().toISOString(),
            isIncoming: false
          }
        ]
      };
    });
    
    setNewMessage('');
  };
  
  // Update startCall function to use socket.io
  const startCall = async (resident) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      // Create peer connection
      const configuration = { 
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ] 
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Set up data channel for text chat
      const dataChannel = peerConnection.createDataChannel('chat');
      dataChannelRef.current = dataChannel;
      
      dataChannel.onopen = () => {
        console.log('Data channel opened');
      };
      
      dataChannel.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleIncomingMessage({
          from: resident._id,
          message: message.text,
          timestamp: message.timestamp
        });
      };
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.send(JSON.stringify({
            type: 'ice_candidate',
            to: resident._id,
            candidate: event.candidate
          }));
        }
      };
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        const remoteAudio = document.getElementById('remoteAudio');
        if (remoteAudio) {
          remoteAudio.srcObject = event.streams[0];
        }
      };
      
      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Send offer to remote peer using socket.io
      socketRef.current.emit('call_offer', {
        to: resident._id,
        offer: peerConnection.localDescription
      });
      
      setInCall(true);
      setCallWith(resident);
      
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call. Please check your microphone permissions.');
    }
  };
  
  const handleCallOffer = async (data) => {
    const { from, offer } = data;
    const caller = residents.find(r => r._id === from);
    
    // Show incoming call notification
    toast.custom((t) => (
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto">
        <div className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
              <Phone className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                Incoming call from {caller?.name || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await answerCall(data);
              }}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
            >
              Answer
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                rejectCall(from);
              }}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    ), { duration: 30000 });
  };
  
  const answerCall = async (data) => {
    try {
      const { from, offer } = data;
      const caller = residents.find(r => r._id === from);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      // Create peer connection
      const configuration = { 
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ] 
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.send(JSON.stringify({
            type: 'ice_candidate',
            to: from,
            candidate: event.candidate
          }));
        }
      };
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        const remoteAudio = document.getElementById('remoteAudio');
        if (remoteAudio) {
          remoteAudio.srcObject = event.streams[0];
        }
      };
      
      // Handle data channel
      peerConnection.ondatachannel = (event) => {
        dataChannelRef.current = event.channel;
        
        event.channel.onmessage = (e) => {
          const message = JSON.parse(e.data);
          handleIncomingMessage({
            from: from,
            message: message.text,
            timestamp: message.timestamp
          });
        };
      };
      
      // Set remote description (the offer)
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Send answer to caller
      socketRef.current.send(JSON.stringify({
        type: 'call_answer',
        to: from,
        answer: peerConnection.localDescription
      }));
      
      setInCall(true);
      setCallWith(caller);
      
    } catch (error) {
      console.error('Error answering call:', error);
      toast.error('Failed to answer call. Please check your microphone permissions.');
    }
  };
  
  const handleCallAnswer = async (data) => {
    const { answer } = data;
    
    try {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (error) {
      console.error('Error handling call answer:', error);
    }
  };
  
  const handleIceCandidate = async (data) => {
    try {
      const { candidate } = data;
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };
  
  // Update other WebSocket methods to use socket.io emit
  const endCall = () => {
    if (callWith) {
      socketRef.current.emit('call_end', {
        to: callWith._id
      });
    }
    
    handleCallEnd();
  };
  
  const rejectCall = (callerId) => {
    socketRef.current.emit('call_end', {
      to: callerId
    });
  };
  
  const handleCallEnd = () => {
    // Stop all tracks in the local stream
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
  };
  
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  const filteredResidents = residents.filter(resident => 
    resident.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="p-4 md:p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors"
        >
          <FaArrowLeft size={18} />
          <span className="text-base">Back</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center mb-4 md:mb-0">
            <Users className="mr-3 text-blue-600" size={32} />
            Community
          </h1>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search residents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Residents List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResidents.length > 0 ? (
              filteredResidents.map((resident) => (
                <div key={resident._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{resident.name}</h3>
                        <p className="text-sm text-gray-500">
                          {resident.flatDetails?.flatNumber || 'No flat info'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedResident(resident);
                          setShowChat(true);
                        }}
                        className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </button>
                      <button
                        onClick={() => startCall(resident)}
                        className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">No residents found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChat && selectedResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">{selectedResident.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedResident.flatDetails?.flatNumber || 'No flat info'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              {chatMessages[selectedResident._id]?.length > 0 ? (
                chatMessages[selectedResident._id].map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-4 flex ${msg.isIncoming ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.isIncoming
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.isIncoming ? 'text-gray-500' : 'text-blue-200'}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {inCall && callWith && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="text-xl font-medium text-white mb-2">
              {`Call with ${callWith.name}`}
            </h3>
            <p className="text-gray-300 mb-8">
              {callWith.flatDetails?.flatNumber || 'No flat info'}
            </p>
            
            <div className="h-24 w-24 rounded-full bg-blue-600 mx-auto flex items-center justify-center mb-8">
              <User className="h-12 w-12 text-white" />
            </div>
            
            <audio id="remoteAudio" autoPlay></audio>
            
            <div className="flex justify-center space-x-6">
              <button
                onClick={toggleMute}
                className={`h-14 w-14 rounded-full flex items-center justify-center ${
                  isMuted ? 'bg-red-600' : 'bg-gray-700'
                }`}
              >
                {isMuted ? (
                  <MicOff className="h-6 w-6 text-white" />
                ) : (
                  <Mic className="h-6 w-6 text-white" />
                )}
              </button>
              
              <button
                onClick={endCall}
                className="h-14 w-14 rounded-full bg-red-600 flex items-center justify-center"
              >
                <Phone className="h-6 w-6 text-white transform rotate-135" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}