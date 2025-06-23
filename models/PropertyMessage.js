import mongoose from 'mongoose';

const propertyMessageSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
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
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create indexes for efficient querying
propertyMessageSchema.index({ propertyId: 1 });
propertyMessageSchema.index({ societyId: 1 });
propertyMessageSchema.index({ senderId: 1 });
propertyMessageSchema.index({ receiverId: 1 });
propertyMessageSchema.index({ createdAt: -1 });

export default mongoose.models.PropertyMessage || mongoose.model('PropertyMessage', propertyMessageSchema); 