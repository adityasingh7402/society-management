import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectToDatabase from '../../lib/mongodb';
import Resident from '../../models/Resident';
import mongoose from 'mongoose';

// Define Chat Message Schema if not already defined in models
let ChatMessage;
try {
  ChatMessage = mongoose.model('ChatMessage');
} catch (e) {
  const ChatMessageSchema = new mongoose.Schema({
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      required: true
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  });
  
  ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
}

// Maps to store connected users
const connectedUsers = new Map();
const societyUsers = new Map(); // Add this line to declare societyUsers

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket server already running');
    res.end();
    return;
  }
  
  console.log('Setting up socket server');
  const io = new Server(res.socket.server);
  res.socket.server.io = io;
  
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      
      await connectToDatabase();
      
      // Get resident details to know their society
      const resident = await Resident.findById(decoded.id);
      if (!resident) {
        return next(new Error('Resident not found'));
      }
      
      // Store society ID in socket for easy access
      socket.societyId = resident.societyId.toString();
      
      // Update resident's online status
      await Resident.findByIdAndUpdate(decoded.id, {
        online: true,
        lastSeen: new Date()
      });
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.userId} (Society: ${socket.societyId})`);
    
    // Store user in both maps
    connectedUsers.set(socket.userId, socket.id);
    
    // Add user to society-specific map
    if (!societyUsers.has(socket.societyId)) {
      societyUsers.set(socket.societyId, new Map());
    }
    societyUsers.get(socket.societyId).set(socket.userId, socket.id);
    
    // Broadcast user online status ONLY to society members
    try {
      // Get all socket IDs for users in the same society
      const societySocketIds = Array.from(societyUsers.get(socket.societyId).values());
      
      // Broadcast to all sockets in the same society except self
      societySocketIds.forEach(socketId => {
        if (socketId !== socket.id) {
          io.to(socketId).emit('user_status', {
            userId: socket.userId,
            online: true,
            societyId: socket.societyId
          });
        }
      });
    } catch (error) {
      console.error('Error broadcasting online status:', error);
    }
    
    // Handle chat messages
    socket.on('chat_message', async (data) => {
      try {
        const { to, message } = data;
        
        // Verify recipient is in the same society
        const recipient = await Resident.findById(to);
        if (!recipient || recipient.societyId.toString() !== socket.societyId) {
          socket.emit('error', { message: 'Cannot send message to resident of different society' });
          return;
        }
        
        // Store message in database
        const newMessage = new ChatMessage({
          senderId: socket.userId,
          receiverId: to,
          societyId: socket.societyId,
          message,
          timestamp: new Date()
        });
        
        await newMessage.save();
        
        // Send to recipient if online
        const recipientSocketId = connectedUsers.get(to);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('chat_message', {
            from: socket.userId,
            message,
            timestamp: newMessage.timestamp,
            messageId: newMessage._id
          });
        }
        
        // Send confirmation back to sender
        socket.emit('message_sent', {
          to,
          messageId: newMessage._id,
          timestamp: newMessage.timestamp
        });
      } catch (error) {
        console.error('Error handling chat message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle WebRTC signaling with society check
    socket.on('call_offer', async (data) => {
      try {
        const { to, offer } = data;
        
        // Verify recipient is in the same society
        const recipient = await Resident.findById(to);
        if (!recipient || recipient.societyId.toString() !== socket.societyId) {
          socket.emit('call_error', { message: 'Cannot call resident of different society' });
          return;
        }
        
        const recipientSocketId = connectedUsers.get(to);
        
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('call_offer', {
            from: socket.userId,
            offer
          });
        } else {
          socket.emit('call_error', { message: 'User is offline' });
        }
      } catch (error) {
        console.error('Error handling call offer:', error);
        socket.emit('call_error', { message: 'Failed to initiate call' });
      }
    });
    
    // Handle call answer with society check
    socket.on('call_answer', async (data) => {
      try {
        const { to, answer } = data;
        
        // Verify recipient is in the same society
        const recipient = await Resident.findById(to);
        if (!recipient || recipient.societyId.toString() !== socket.societyId) {
          return;
        }
        
        const recipientSocketId = connectedUsers.get(to);
        
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('call_answer', {
            from: socket.userId,
            answer
          });
        }
      } catch (error) {
        console.error('Error handling call answer:', error);
      }
    });
    
    // Handle ICE candidates with society check
    socket.on('ice_candidate', async (data) => {
      try {
        const { to, candidate } = data;
        
        // Verify recipient is in the same society
        const recipient = await Resident.findById(to);
        if (!recipient || recipient.societyId.toString() !== socket.societyId) {
          return;
        }
        
        const recipientSocketId = connectedUsers.get(to);
        
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('ice_candidate', {
            from: socket.userId,
            candidate
          });
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });
    
    // Handle call end with society check
    socket.on('call_end', async (data) => {
      try {
        const { to } = data;
        
        // Verify recipient is in the same society
        const recipient = await Resident.findById(to);
        if (!recipient || recipient.societyId.toString() !== socket.societyId) {
          return;
        }
        
        const recipientSocketId = connectedUsers.get(to);
        
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('call_end', {
            from: socket.userId
          });
        }
      } catch (error) {
        console.error('Error handling call end:', error);
      }
    });
    
    // Handle read receipts with society check
    socket.on('mark_read', async (data) => {
      try {
        const { messageIds } = data;
        
        // Get messages and verify they belong to the user's society
        const messages = await ChatMessage.find({ 
          _id: { $in: messageIds },
          societyId: socket.societyId,
          receiverId: socket.userId
        });
        
        if (messages.length === 0) {
          return;
        }
        
        const validMessageIds = messages.map(msg => msg._id);
        
        await ChatMessage.updateMany(
          { _id: { $in: validMessageIds } },
          { $set: { read: true } }
        );
        
        // Get the sender IDs from these messages
        const senderIds = [...new Set(messages.map(msg => msg.senderId.toString()))];
        
        // Notify senders that messages were read
        senderIds.forEach(senderId => {
          const senderSocketId = connectedUsers.get(senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('messages_read', {
              by: socket.userId,
              messageIds: validMessageIds
            });
          }
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });
    
    // Handle typing indicators with society check
    socket.on('typing', async (data) => {
      try {
        const { to, isTyping } = data;
        
        // Verify recipient is in the same society
        const recipient = await Resident.findById(to);
        if (!recipient || recipient.societyId.toString() !== socket.societyId) {
          return;
        }
        
        const recipientSocketId = connectedUsers.get(to);
        
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('typing', {
            from: socket.userId,
            isTyping
          });
        }
      } catch (error) {
        console.error('Error handling typing indicator:', error);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Remove from both maps
      connectedUsers.delete(socket.userId);
      
      if (societyUsers.has(socket.societyId)) {
        societyUsers.get(socket.societyId).delete(socket.userId);
        
        // Clean up empty society maps
        if (societyUsers.get(socket.societyId).size === 0) {
          societyUsers.delete(socket.societyId);
        }
      }
      
      try {
        // Update resident's online status
        await Resident.findByIdAndUpdate(socket.userId, {
          online: false,
          lastSeen: new Date()
        });
        
        // Broadcast user offline status ONLY to society members
        if (societyUsers.has(socket.societyId)) {
          const societySocketIds = Array.from(societyUsers.get(socket.societyId).values());
          
          societySocketIds.forEach(socketId => {
            io.to(socketId).emit('user_status', {
              userId: socket.userId,
              online: false,
              societyId: socket.societyId
            });
          });
        }
      } catch (error) {
        console.error('Error updating offline status:', error);
      }
    });
  });
  
  res.end();
};

export default SocketHandler;