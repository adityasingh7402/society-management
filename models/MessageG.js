import mongoose from 'mongoose';

const messageGSchema = new mongoose.Schema({
  societyId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isSociety: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Use a different model name to avoid conflicts
const MessageG = mongoose.models.MessageG || mongoose.model('MessageG', messageGSchema);
export default MessageG;