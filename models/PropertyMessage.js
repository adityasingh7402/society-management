import mongoose from 'mongoose';

const propertyMessageSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
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
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
propertyMessageSchema.index({ propertyId: 1 });
propertyMessageSchema.index({ senderId: 1 });
propertyMessageSchema.index({ receiverId: 1 });
propertyMessageSchema.index({ createdAt: -1 });

export default mongoose.models.PropertyMessage || mongoose.model('PropertyMessage', propertyMessageSchema); 