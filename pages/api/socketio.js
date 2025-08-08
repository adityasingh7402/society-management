import { Server } from 'socket.io';
import { verifyToken } from '../../utils/auth';
import Message from '../../models/Message';
import Resident from '../../models/Resident';
import Society from '../../models/Society';
import connectDB from '../../lib/mongodb';

const ioHandler = async (req, res) => {
  // Always set proper headers to avoid CORS issues
  // Force restart - timestamp: 2025-08-08
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
          
          // Check if user exists in database - check both Resident and Society collections
          // Also check for members within these collections
          let user = null;
          let userType = null;
          let parentId = null;
          
          console.log(`Searching for user with ID: ${id}`);
          
          // First, try to find as main resident
          try {
            user = await Resident.findById(id).select('_id name phone').lean();
            if (user) {
              console.log(`Found as main resident:`, user);
              userType = 'main_resident';
            }
          } catch (residentError) {
            console.log(`Error searching in Resident collection:`, residentError.message);
          }
          
          if (!user) {
            // Try to find as main society
            try {
              console.log(`Searching in Society collection for ID: ${id}`);
              user = await Society.findById(id).select('_id societyId societyName managerName managerPhone').lean();
              if (user) {
                console.log(`Found as main society by _id:`, user);
                userType = 'main_society';
              } else {
                console.log(`No society found with _id: ${id}, trying societyId field...`);
                // Try searching by societyId field in case JWT id refers to that
                user = await Society.findOne({ societyId: id }).select('_id societyId societyName managerName managerPhone').lean();
                if (user) {
                  console.log(`Found as main society by societyId:`, user);
                  userType = 'main_society';
                } else {
                  console.log(`No society found with societyId: ${id}`);
                }
              }
            } catch (societyError) {
              console.log(`Error searching in Society collection:`, societyError.message);
            }
          }
          
          if (!user) {
            // Try to find as resident member
            const residentWithMember = await Resident.findOne({
              'members._id': id
            }, {
              'members.$': 1,
              '_id': 1
            }).lean();
            
            if (residentWithMember && residentWithMember.members.length > 0) {
              user = residentWithMember.members[0];
              userType = 'resident_member';
              parentId = residentWithMember._id;
            } else {
              // Try to find as society member
              const societyWithMember = await Society.findOne({
                'members._id': id
              }, {
                'members.$': 1,
                '_id': 1
              }).lean();
              
              if (societyWithMember && societyWithMember.members.length > 0) {
                user = societyWithMember.members[0];
                userType = 'society_member';
                parentId = societyWithMember._id;
              }
            }
          }
          
          if (!user) {
            console.log(`Socket connection rejected: User ${id} not found in database`);
            socket.emit('auth_error', { message: 'User not found' });
            socket.disconnect();
            return;
          }
          
          console.log(`User found: ${id}, type: ${userType}, parentId: ${parentId}`);
          
          // Store user info in socket for later use
          socket.userInfo = { id, userType, parentId, user };

          // Join a room with the user's ID
          socket.join(id);

          // Update user's online status based on user type
          try {
            if (userType === 'main_resident') {
              await Resident.findByIdAndUpdate(id, { isOnline: true, lastSeen: new Date() });
            } else if (userType === 'main_society') {
              // For societies, we could add an online status field if needed
              // Currently societies don't have isOnline field in the schema
            } else if (userType === 'resident_member') {
              await Resident.findOneAndUpdate(
                { 'members._id': id },
                { 'members.$.lastSeen': new Date() }
              );
            } else if (userType === 'society_member') {
              // Society members don't have lastSeen in schema, but we could add it if needed
            }
          } catch (updateError) {
            console.error('Error updating user online status:', updateError);
          }
          
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

          // Handle society chat room joining
          socket.on('join_society_chat', async (data) => {
            try {
              const { societyCode, userId, userName, isSociety } = data;
              
              if (!societyCode) {
                console.error('Invalid society chat join data:', data);
                return;
              }
              
              const roomName = `society_${societyCode}`;
              socket.join(roomName);
              console.log(`User ${userId} (${userName}) joined society chat room: ${roomName}`);
              
              // Store room info in socket
              socket.societyRoom = roomName;
              socket.societyCode = societyCode;
              
            } catch (error) {
              console.error('Error handling society chat join:', error);
            }
          });

          // Handle society chat messages
          socket.on('society_chat_message', async (data) => {
            try {
              const { societyCode, from, senderName, text, messageId, timestamp, isSociety } = data;
              
              if (!societyCode || !messageId) {
                console.error('Invalid society chat message data:', data);
                socket.emit('error', { message: 'Invalid message data' });
                return;
              }
              
              const roomName = `society_${societyCode}`;
              console.log(`Society message from ${from} (${senderName}) to room ${roomName}, messageId: ${messageId}`);
              
              // Emit to all users in the society chat room (excluding sender)
              socket.to(roomName).emit('chat_message', {
                from: from,
                senderName: senderName,
                text: text || '',
                timestamp: timestamp || new Date().toISOString(),
                id: messageId,
                isSociety: isSociety || false
              });
              
            } catch (error) {
              console.error('Error handling society chat message:', error);
              socket.emit('error', { message: 'Failed to send society message' });
            }
          });

          // Handle society message deletion
          socket.on('society_message_deleted', async (data) => {
            try {
              const { societyCode, messageId, deletedBy } = data;
              
              if (!societyCode || !messageId) {
                console.error('Invalid society message delete data:', data);
                return;
              }
              
              const roomName = `society_${societyCode}`;
              console.log(`Society message ${messageId} deleted by ${deletedBy} in room ${roomName}`);
              
              // Emit to all users in the society chat room
              socket.to(roomName).emit('message_deleted', {
                messageId,
                deletedBy
              });
              
            } catch (error) {
              console.error('Error handling society message deletion:', error);
            }
          });

          // Handle disconnect
          socket.on('disconnect', async (reason) => {
            console.log(`User disconnected: ${id}, reason: ${reason}`);
            if (id && socket.userInfo) {
              try {
                const { userType } = socket.userInfo;
                if (userType === 'main_resident') {
                  await Resident.findByIdAndUpdate(id, { 
                    isOnline: false, 
                    lastSeen: new Date() 
                  });
                } else if (userType === 'resident_member') {
                  await Resident.findOneAndUpdate(
                    { 'members._id': id },
                    { 'members.$.lastSeen': new Date() }
                  );
                }
                // Society users don't have online status tracking currently
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