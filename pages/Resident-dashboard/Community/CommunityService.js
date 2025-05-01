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
  // Initialize socket connection
  fetch('/api/socketio').catch(console.error);

  const socket = io('', {
    path: '/api/socketio',
    auth: {
      token: localStorage.getItem('Resident')
    },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    socket.emit('register', { userId: residentDetails._id });
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
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

  return socket;
}; 