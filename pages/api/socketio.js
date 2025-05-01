import { Server } from 'socket.io';
import { verifyToken } from '../../utils/auth';
import Message from '../../models/Message';
import Resident from '../../models/Resident';
import connectDB from '../../lib/mongodb';

const ioHandler = async (req, res) => {
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
          methods: ['GET', 'POST']
        },
        connectTimeout: 10000,
        pingTimeout: 5000,
        pingInterval: 10000
      });

      // Socket.IO connection handler
      io.on('connection', async (socket) => {
        let userId = null;
        
        try {
          // Authenticate user
          const token = socket.handshake.auth.token;
          if (!token) {
            console.log('Socket connection rejected: No token provided');
            socket.emit('auth_error', { message: 'No authentication token provided' });
            socket.disconnect();
            return;
          }

          try {
            const decoded = verifyToken(token);
            if (!decoded || !decoded.userId) {
              console.log('Socket connection rejected: Invalid token');
              socket.emit('auth_error', { message: 'Invalid authentication token' });
              socket.disconnect();
              return;
            }
            
            userId = decoded.userId;
          } catch (authError) {
            console.log('Socket connection rejected: Token verification failed', authError.message);
            socket.emit('auth_error', { message: 'Token verification failed' });
            socket.disconnect();
            return;
          }

          console.log(`User connected: ${userId}`);
          
          // Check if user exists in database
          const user = await Resident.findById(userId).select('_id').lean();
          if (!user) {
            console.log(`Socket connection rejected: User ${userId} not found in database`);
            socket.emit('auth_error', { message: 'User not found' });
            socket.disconnect();
            return;
          }

          // Join a room with the user's ID
          socket.join(userId);

          // Update user's online status
          await Resident.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
          
          // Send success acknowledgment
          socket.emit('auth_success', { userId });
          
          // Handle user registration (when frontend explicitly registers)
          socket.on('register', (data) => {
            if (data.userId) {
              console.log(`User registered: ${data.userId}`);
              socket.join(data.userId);
            }
          });

          // Handle chat messages
          socket.on('chat_message', async (data) => {
            try {
              const { to, message, messageId, media } = data;
              
              // Emit to recipient if online
              socket.to(to).emit('chat_message', {
                from: userId,
                text: message,
                timestamp: new Date(),
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

          // Handle read receipts
          socket.on('messages_read', async (data) => {
            try {
              const { to, from } = data;
              
              // Notify sender that messages were read
              socket.to(to).emit('messages_read', {
                from
              });
            } catch (error) {
              console.error('Error handling read receipt:', error);
            }
          });

          // Handle disconnect
          socket.on('disconnect', async (reason) => {
            console.log(`User disconnected: ${userId}, reason: ${reason}`);
            if (userId) {
              try {
                await Resident.findByIdAndUpdate(userId, { 
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