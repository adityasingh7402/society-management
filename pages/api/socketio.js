import { Server } from 'socket.io';
import { verifyToken } from '../../utils/auth';
import Message from '../../models/Message';
import Resident from '../../models/Resident';

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...');
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Socket.IO connection handler
    io.on('connection', async (socket) => {
      try {
        // Authenticate user
        const token = socket.handshake.auth.token;
        if (!token) {
          socket.disconnect();
          return;
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) {
          socket.disconnect();
          return;
        }

        const userId = decoded.userId;
        console.log(`User connected: ${userId}`);

        // Join a room with the user's ID
        socket.join(userId);

        // Update user's online status
        await Resident.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

        // Handle chat messages
        socket.on('chat_message', async (data) => {
          try {
            const { recipientId, message, timestamp } = data;
            
            // Save message to database
            const newMessage = new Message({
              senderId: userId,
              recipientId,
              message,
              timestamp: timestamp || new Date(),
              status: 'sent'
            });
            
            await newMessage.save();
            
            // Emit to recipient if online
            socket.to(recipientId).emit('chat_message', {
              messageId: newMessage._id,
              senderId: userId,
              message,
              timestamp: newMessage.timestamp,
              status: 'delivered'
            });
            
            // Update message status to delivered if recipient is online
            if (io.sockets.adapter.rooms.has(recipientId)) {
              newMessage.status = 'delivered';
              await newMessage.save();
            }
            
            // Send confirmation to sender with message ID
            socket.emit('message_sent', {
              messageId: newMessage._id,
              recipientId,
              status: newMessage.status
            });
          } catch (error) {
            console.error('Error handling chat message:', error);
            socket.emit('error', { message: 'Failed to send message' });
          }
        });

        // Handle message read receipts
        socket.on('message_read', async (data) => {
          try {
            const { messageId } = data;
            
            // Update message status in database
            const message = await Message.findById(messageId);
            if (message && message.recipientId.toString() === userId) {
              message.status = 'read';
              message.readAt = new Date();
              await message.save();
              
              // Notify sender that message was read
              socket.to(message.senderId).emit('message_status', {
                messageId,
                status: 'read',
                readAt: message.readAt
              });
            }
          } catch (error) {
            console.error('Error handling read receipt:', error);
          }
        });

        // Handle typing indicators
        socket.on('typing', (data) => {
          const { recipientId, isTyping } = data;
          socket.to(recipientId).emit('typing', {
            senderId: userId,
            isTyping
          });
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
          console.log(`User disconnected: ${userId}`);
          await Resident.findByIdAndUpdate(userId, { 
            isOnline: false, 
            lastSeen: new Date() 
          });
        });
      } catch (error) {
        console.error('Socket connection error:', error);
        socket.disconnect();
      }
    });

    res.socket.server.io = io;
  }
  
  res.end();
};

export const config = {
  api: {
    bodyParser: false
  }
};

export default ioHandler;