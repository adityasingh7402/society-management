import io from 'socket.io-client';
import { toast } from 'react-hot-toast';

export const fetchResidentDetails = async (router) => {
  try {
    const token = localStorage.getItem('Resident');
    if (!token) {
      router.push('/Login');
      return null;
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
    return data;
  } catch (error) {
    console.error('Error fetching resident details:', error);
    toast.error('Failed to load resident details');
    return null;
  }
};

export const fetchResidents = async (residentDetails) => {
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
    return filteredResidents;
  } catch (error) {
    console.error('Error fetching residents:', error);
    toast.error('Failed to load residents');
    return [];
  }
};

export const fetchUnreadCounts = async (userId, setUnreadCounts) => {
  try {
    const token = localStorage.getItem('Resident');
    const response = await fetch(`/api/chat/unread-count?userId=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch unread counts');
    }

    const data = await response.json();
    
    // Convert array to object with senderId as key
    const countsObj = {};
    data.unreadCounts.forEach(item => {
      countsObj[item._id] = item.count;
    });
    
    setUnreadCounts(countsObj);
  } catch (error) {
    console.error('Error fetching unread counts:', error);
  }
};

export const setupWebSocket = (
  residentDetails,
  handleIncomingMessage,
  updateMessageStatus,
  markMessagesAsReadByRecipient,
  handleIncomingCall,
  handleCallAnswered,
  handleCallRejected,
  handleIceCandidate
) => {
  // Check for token before even trying to connect
  const token = localStorage.getItem('Resident');
  if (!token) {
    console.warn('No authentication token found for socket connection');
    return null; // Return null instead of a socket connection
  }

  // Initialize socket connection
  fetch('/api/socketio').catch(error => {
    console.error('Error fetching socketio endpoint:', error);
  });

  console.log('Setting up WebSocket connection');
  
  // Create socket options with proper auth
  const socketOptions = {
    path: '/api/socketio',
    auth: {
      token
    },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    // Auto connect set to false so we can control connection
    autoConnect: false
  };

  const socket = io('', socketOptions);

  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    if (residentDetails && residentDetails._id) {
      socket.emit('register', { userId: residentDetails._id });
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    // Stop reconnection attempts after 3 failures to prevent infinite loops
    if (socket.io._reconnectionAttempts > 3) {
      console.log('Too many reconnection attempts, stopping auto-reconnect');
      socket.io.reconnection(false);
      socket.disconnect();
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected to socket server after ${attemptNumber} attempts`);
    // Re-register user ID after reconnection
    if (residentDetails && residentDetails._id) {
      socket.emit('register', { userId: residentDetails._id });
    }
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`Reconnection attempt ${attemptNumber}`);
    // Update auth token on each reconnection attempt in case it changed
    const freshToken = localStorage.getItem('Resident');
    if (freshToken) {
      socket.auth = { token: freshToken };
    } else if (attemptNumber > 2) {
      // If no token is found after a couple attempts, stop trying
      console.log('No auth token available, stopping reconnection');
      socket.io.reconnection(false);
      socket.disconnect();
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from WebSocket server:', reason);
    // If the server initiated the disconnect due to auth issues, don't reconnect
    if (reason === 'io server disconnect' || reason === 'io client disconnect') {
      console.log('Server or client initiated disconnect, not reconnecting automatically');
      socket.io.reconnection(false);
    }
  });

  socket.on('chat_message', (message) => {
    handleIncomingMessage(message);
  });

  socket.on('message_status', (data) => {
    updateMessageStatus(data);
  });

  socket.on('messages_read', (data) => {
    markMessagesAsReadByRecipient(data);
  });

  socket.on('call', (data) => {
    handleIncomingCall(data);
  });

  socket.on('call-answered', (data) => {
    handleCallAnswered(data);
  });

  socket.on('call-rejected', (data) => {
    handleCallRejected(data);
  });

  socket.on('ice-candidate', (data) => {
    handleIceCandidate(data);
  });

  // Add auth error and success handlers
  socket.on('auth_error', (data) => {
    console.error('Socket authentication error:', data.message);
    // Stop reconnection on auth error
    socket.io.reconnection(false);
    socket.disconnect();
    
    // If token is invalid, try to clear it from localStorage to force re-login
    if (data.message === 'Invalid authentication token' || data.message === 'Token verification failed') {
      console.log('Authentication token rejected by server, user may need to re-login');
      // Don't clear token here - let the frontend handle this explicitly if needed
    }
  });
  
  socket.on('auth_success', (data) => {
    console.log('Socket authentication successful for user:', data.userId);
  });

  // Manually connect after setting up all handlers
  socket.connect();

  return socket;
}; 