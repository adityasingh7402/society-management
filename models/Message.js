import mongoose from 'mongoose';
const { Schema } = mongoose;

const MessageSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  message: {
    type: String,
    required: false,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readAt: {
    type: Date,
    default: null
  },
  // For media messages - use Mixed type for flexible structure
  media: {
    type: Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

// Create indexes for faster queries
MessageSchema.index({ senderId: 1, recipientId: 1 });
MessageSchema.index({ recipientId: 1, status: 1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);