import { Server } from 'socket.io';
import { verifyToken } from '../../lib/auth';
import Message from '../../models/Message';
import Resident from '../../models/Resident';
import connectDB from '../../lib/mongodb';

const ioHandler = async (req, res) => {
  // Always set proper headers to avoid CORS issues
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check for JWT_SECRET
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  // Connect to the database first
  try {
    await connectDB();
    console.log('Connected to MongoDB for Socket.IO');
  } catch (dbError) {
    console.error('Failed to connect to MongoDB:', dbError);
    res.status(500).end();
    return;
  }
  
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...');
    try {
      const io = new Server(res.socket.server, {
        path: '/api/socketio',
        addTrailingSlash: false,
        cors: {
          origin: '*',
          methods: ['GET', 'POST', 'OPTIONS'],
          credentials: true
        },
        connectTimeout: 10000,
        pingTimeout: 5000,
        pingInterval: 10000
      });

      // Socket.IO connection handler
      io.on('connection', async (socket) => {
        let id = null;
        
        try {
          // Authenticate user
          const token = socket.handshake.auth.token;
          if (!token) {
            console.log('Socket connection rejected: No token provided');
            socket.emit('auth_error', { message: 'No authentication token provided' });
            socket.disconnect();
            return;
          }

          // Log token format for debugging (without showing the full token)
          const tokenPreview = typeof token === 'string' 
            ? `${token.substring(0, 10)}...` 
            : 'Invalid token format';
          console.log(`Token received: ${tokenPreview}, type: ${typeof token}`);
          
          // Handle token with or without Bearer prefix
          let cleanToken = token;
          if (typeof token === 'string' && token.startsWith('Bearer ')) {
            cleanToken = token.slice(7).trim();
            console.log('Removed Bearer prefix from token');
          }

          try {
            // Verify the token
            const decoded = verifyToken(cleanToken);
            if (!decoded || !decoded.id) {
              console.log('Socket connection rejected: Invalid token');
              socket.emit('auth_error', { message: 'Invalid authentication token' });
              socket.disconnect();
              return;
            }
            
            id = decoded.id;
          } catch (authError) {
            console.log('Socket connection rejected: Token verification failed', authError.message);
            socket.emit('auth_error', { message: 'Token verification failed' });
            socket.disconnect();
            return;
          }

          console.log(`User connected: ${id}`);
          
          // Check if user exists in database
          const user = await Resident.findById(id).select('_id').lean();
          if (!user) {
            console.log(`Socket connection rejected: User ${id} not found in database`);
            socket.emit('auth_error', { message: 'User not found' });
            socket.disconnect();
            return;
          }

          // Join a room with the user's ID
          socket.join(id);

          // Update user's online status
          await Resident.findByIdAndUpdate(id, { isOnline: true, lastSeen: new Date() });
          
          // Send success acknowledgment
          socket.emit('auth_success', { id });
          
          // Handle user registration (when frontend explicitly registers)
          socket.on('register', (data) => {
            if (data.id) {
              console.log(`User registered: ${data.id}`);
              socket.join(data.id);
            }
          });

          // Handle chat messages
          socket.on('chat_message', async (data) => {
            try {
              const { to, from, text, messageId, media, timestamp } = data;
              
              if (!to || !messageId) {
                console.error('Invalid chat message data:', data);
                socket.emit('error', { message: 'Invalid message data' });
                return;
              }
              
              console.log(`Message from ${id} to ${to}, messageId: ${messageId}`);
              
              // Emit to recipient if online
              socket.to(to).emit('chat_message', {
                from: id,
                text: text || '',
                timestamp: timestamp || new Date().toISOString(),
                id: messageId,
                media
              });
              
              // Send message status update
              socket.to(to).emit('message_status', {
                messageId,
                status: 'delivered'
              });
            } catch (error) {
              console.error('Error handling chat message:', error);
              socket.emit('error', { message: 'Failed to send message' });
            }
          });

          // Handle message status updates
          socket.on('message_status', async (data) => {
            try {
              const { to, messageId, status } = data;
              
              if (!to || !messageId || !status) {
                console.error('Invalid message status data:', data);
                return;
              }
              
              console.log(`Message status update: ${messageId}, status: ${status}`);
              
              // Emit status update to the message sender
              socket.to(to).emit('message_status', {
                messageId,
                status
              });
            } catch (error) {
              console.error('Error handling message status update:', error);
            }
          });

          // Handle read receipts
          socket.on('messages_read', async (data) => {
            try {
              const { to, from } = data;
              
              if (!to || !from) {
                console.error('Invalid read receipt data:', data);
                return;
              }
              
              console.log(`Read receipt from ${from} to ${to}`);
              
              // Notify sender that messages were read
              socket.to(to).emit('messages_read', {
                from
              });
              
              // Also update the message status in the database
              try {
                await Message.updateMany(
                  { senderId: to, recipientId: from, status: { $ne: 'read' } },
                  { $set: { status: 'read' } }
                );
              } catch (dbError) {
                console.error('Error updating message status in database:', dbError);
              }
            } catch (error) {
              console.error('Error handling read receipt:', error);
            }
          });

          // Handle disconnect
          socket.on('disconnect', async (reason) => {
            console.log(`User disconnected: ${id}, reason: ${reason}`);
            if (id) {
              try {
                await Resident.findByIdAndUpdate(id, { 
                  isOnline: false, 
                  lastSeen: new Date() 
                });
              } catch (error) {
                console.error('Error updating user status on disconnect:', error);
              }
            }
          });
        } catch (error) {
          console.error('Socket connection error:', error);
          socket.disconnect();
        }
      });

      io.on('connect_error', (err) => {
        console.error('Socket.IO server connection error:', err);
      });

      res.socket.server.io = io;
      console.log('Socket.IO server initialized successfully');
    } catch (socketError) {
      console.error('Failed to initialize Socket.IO server:', socketError);
    }
  } else {
    console.log('Socket.IO server already running');
  }
  
  res.end();
};

export const config = {
  api: {
    bodyParser: false
  }
};

export default ioHandler;