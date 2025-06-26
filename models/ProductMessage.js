import mongoose from 'mongoose';

const productMessageSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
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
productMessageSchema.index({ productId: 1 });
productMessageSchema.index({ senderId: 1 });
productMessageSchema.index({ receiverId: 1 });
productMessageSchema.index({ createdAt: -1 });

export default mongoose.models.ProductMessage || mongoose.model('ProductMessage', productMessageSchema); 