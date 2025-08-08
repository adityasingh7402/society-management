import io from 'socket.io-client';
import { toast } from 'react-hot-toast';

export const fetchResidentDetails = async (router) => {
  try {
    const token = localStorage.getItem('Resident');
    if (!token) {
      router.push('/login');
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

export const fetchConversationContacts = async (userId) => {
  try {
    const token = localStorage.getItem('Resident');
    const response = await fetch(`/api/chat/conversation-contacts?userId=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversation contacts');
    }

    const data = await response.json();
    return data.contactIds || [];
  } catch (error) {
    console.error('Error fetching conversation contacts:', error);
    return [];
  }
};

export const setupWebSocket = (
  residentDetails,
  handleIncomingMessage,
  updateMessageStatus,
  markMessagesAsReadByRecipient
) => {
  // Check for token before even trying to connect
  let token = localStorage.getItem('Resident');
  if (!token) {
    console.warn('No authentication token found for socket connection');
    return null; // Return null instead of a socket connection
  }

  // Clean up token format - remove Bearer prefix if present
  if (token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }
  
  // Debug token (show first few characters)
  console.log('Using token for socket connection: ', token.substring(0, 10) + '...');
  
  console.log('Setting up WebSocket connection');
  
  // Make sure socket.io client is loaded
  if (typeof io === 'undefined') {
    console.error('Socket.io client not found');
    return null;
  }
  
  // Create socket options with proper auth - explicitly send token WITHOUT Bearer prefix
  const socketOptions = {
    path: '/api/socketio',
    auth: {
      token
    },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true
  };

  // Create a new socket instance
  const socket = io('', socketOptions);

  // Connect event handlers
  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    if (residentDetails && residentDetails._id) {
      socket.emit('register', { userId: residentDetails._id });
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    
    // Check if error is related to authentication
    if (error.message && (
      error.message.includes('auth') || 
      error.message.includes('token') || 
      error.message.includes('unauthorized')
    )) {
      console.warn('Socket connection may have auth issues, checking token');
      
      // Try to get a fresh token - ensure it's clean
      let freshToken = localStorage.getItem('Resident');
      if (freshToken) {
        if (freshToken.startsWith('Bearer ')) {
          freshToken = freshToken.slice(7).trim();
        }
        socket.auth.token = freshToken;
      }
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
    let freshToken = localStorage.getItem('Resident');
    if (freshToken) {
      if (freshToken.startsWith('Bearer ')) {
        freshToken = freshToken.slice(7).trim();
      }
      socket.auth.token = freshToken;
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from WebSocket server:', reason);
    
    // If server initiated disconnect due to auth issues, don't reconnect automatically
    if (reason === 'io server disconnect') {
      console.log('Server initiated disconnect, not reconnecting automatically');
      // Try to reconnect once with fresh token
      let freshToken = localStorage.getItem('Resident');
      if (freshToken) {
        if (freshToken.startsWith('Bearer ')) {
          freshToken = freshToken.slice(7).trim();
        }
        socket.auth.token = freshToken;
        setTimeout(() => socket.connect(), 2000);
      }
    }
  });

  socket.on('chat_message', (message) => {
    console.log('Received chat message:', message);
    handleIncomingMessage(message);
  });

  socket.on('message_status', (data) => {
    console.log('Received message status update:', data);
    updateMessageStatus(data);
  });

  socket.on('messages_read', (data) => {
    console.log('Received messages read update:', data);
    markMessagesAsReadByRecipient(data);
  });

  // Auth handlers
  socket.on('auth_error', (data) => {
    console.error('Socket authentication error:', data.message);
    
    // Try to refresh the token from localStorage
    let freshToken = localStorage.getItem('Resident');
    if (freshToken) {
      console.log('Trying with fresh token from localStorage');
      if (freshToken.startsWith('Bearer ')) {
        freshToken = freshToken.slice(7).trim();
      }
      socket.auth.token = freshToken;
      socket.connect();
    }
  });

  return socket;
};

// Society-specific WebSocket setup function
export const setupSocietyWebSocket = (
  societyDetails,
  handleIncomingMessage,
  updateMessageStatus,
  markMessagesAsReadByRecipient
) => {
  // Check for society token before even trying to connect
  let token = localStorage.getItem('Society');
  if (!token) {
    console.warn('No society authentication token found for socket connection');
    return null; // Return null instead of a socket connection
  }

  // Clean up token format - remove Bearer prefix if present
  if (token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }
  
  // Debug token (show first few characters)
  console.log('Using society token for socket connection: ', token.substring(0, 10) + '...');
  
  console.log('Setting up Society WebSocket connection');
  
  // Make sure socket.io client is loaded
  if (typeof io === 'undefined') {
    console.error('Socket.io client not found');
    return null;
  }
  
  // Create socket options with proper auth - explicitly send token WITHOUT Bearer prefix
  const socketOptions = {
    path: '/api/socketio',
    auth: {
      token
    },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true
  };

  // Create a new socket instance
  const socket = io('', socketOptions);

  // Connect event handlers
  socket.on('connect', () => {
    console.log('Society connected to WebSocket server');
    if (societyDetails && societyDetails._id) {
      socket.emit('register', { userId: societyDetails._id });
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Society socket connection error:', error.message);
    
    // Check if error is related to authentication
    if (error.message && (
      error.message.includes('auth') || 
      error.message.includes('token') || 
      error.message.includes('unauthorized')
    )) {
      console.warn('Society socket connection may have auth issues, checking token');
      
      // Try to get a fresh token - ensure it's clean
      let freshToken = localStorage.getItem('Society');
      if (freshToken) {
        if (freshToken.startsWith('Bearer ')) {
          freshToken = freshToken.slice(7).trim();
        }
        socket.auth.token = freshToken;
      }
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`Society reconnected to socket server after ${attemptNumber} attempts`);
    
    // Re-register user ID after reconnection
    if (societyDetails && societyDetails._id) {
      socket.emit('register', { userId: societyDetails._id });
    }
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`Society reconnection attempt ${attemptNumber}`);
    
    // Update auth token on each reconnection attempt in case it changed
    let freshToken = localStorage.getItem('Society');
    if (freshToken) {
      if (freshToken.startsWith('Bearer ')) {
        freshToken = freshToken.slice(7).trim();
      }
      socket.auth.token = freshToken;
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Society disconnected from WebSocket server:', reason);
    
    // If server initiated disconnect due to auth issues, don't reconnect automatically
    if (reason === 'io server disconnect') {
      console.log('Server initiated disconnect, not reconnecting automatically');
      // Try to reconnect once with fresh token
      let freshToken = localStorage.getItem('Society');
      if (freshToken) {
        if (freshToken.startsWith('Bearer ')) {
          freshToken = freshToken.slice(7).trim();
        }
        socket.auth.token = freshToken;
        setTimeout(() => socket.connect(), 2000);
      }
    }
  });

  // Society chat message handler
  socket.on('chat_message', (message) => {
    console.log('Society received chat message:', message);
    handleIncomingMessage(message);
  });

  socket.on('message_status', (data) => {
    console.log('Society received message status update:', data);
    updateMessageStatus(data);
  });

  socket.on('messages_read', (data) => {
    console.log('Society received messages read update:', data);
    markMessagesAsReadByRecipient(data);
  });

  socket.on('message_deleted', (data) => {
    console.log('Society received message deleted update:', data);
    // Handle message deletion updates from other users
    // You can add this handler if needed
  });

  // Auth handlers
  socket.on('auth_error', (data) => {
    console.error('Society socket authentication error:', data.message);
    
    // Try to refresh the token from localStorage
    let freshToken = localStorage.getItem('Society');
    if (freshToken) {
      console.log('Society trying with fresh token from localStorage');
      if (freshToken.startsWith('Bearer ')) {
        freshToken = freshToken.slice(7).trim();
      }
      socket.auth.token = freshToken;
      socket.connect();
    }
  });

  return socket;
};
