import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  // Society and apartment details
  societyId: {
    type: String,
    required: true
  },
  blockName: {
    type: String,
    required: true
  },
  floorNumber: {
    type: Number,
    required: true
  },
  flatNumber: {
    type: String,
    required: true
  },

  // Security guard details
  securityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Security'
  },
  guardName: {
    type: String,
  },
  guardImage: {
    type: String,
  },
  guardPhone: {
    type: String,
  },

  // Recipient/Resident details
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident'
  },
  recipientName: {
    type: String,
    required: true
  },
  recipientPhone: {
    type: String,
    required: true
  },
  recipientEmail: {
    type: String
  },

  // Delivery person details
  deliveryPersonName: {
    type: String,
    required: true
  },
  deliveryPersonPhone: {
    type: String
  },
  deliveryPersonImage: {
    type: String
  },

  // Delivery details
  deliveryCompany: {
    type: String,
    required: true,
    enum: [
      'Amazon', 'Flipkart', 'Zomato', 'Swiggy', 'BigBasket', 'Zepto', 
      'Blinkit', 'Dunzo', 'Dominos', 'McDonald\'s', 'KFC', 'BlueDart', 
      'DTDC', 'FedEx', 'Delhivery', 'Ekart', 'Other'
    ]
  },
  deliveryType: {
    type: String,
    required: true,
    enum: [
      'Food Delivery', 'Package', 'Grocery', 'Medical', 'Electronics', 
      'Clothing', 'Books', 'Furniture', 'Courier', 'Document', 'Other'
    ]
  },
  deliveryItems: {
    type: String,
    required: true
  },
  trackingNumber: {
    type: String
  },
  specialInstructions: {
    type: String
  },

  // Timing details
  deliveryTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  receivedTime: {
    type: Date,
    default: Date.now
  },
  collectedTime: {
    type: Date
  },

  // Status management
  status: {
    type: String,
    enum: ['Pending', 'Delivered', 'Collected', 'Returned', 'Lost'],
    default: 'Delivered'
  },

  // Notification status
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationSentAt: {
    type: Date
  },

  // Additional metadata
  deliveryValue: {
    type: Number // Estimated value of delivery
  },
  requiresSignature: {
    type: Boolean,
    default: false
  },
  isFragile: {
    type: Boolean,
    default: false
  },
  
  // Audit fields
  createdBy: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
}, { timestamps: true });

// Create compound indexes for efficient querying
deliverySchema.index({ societyId: 1, blockName: 1, floorNumber: 1, flatNumber: 1 });
deliverySchema.index({ societyId: 1, deliveryTime: -1 });
deliverySchema.index({ societyId: 1, status: 1 });
deliverySchema.index({ recipientId: 1, deliveryTime: -1 });
deliverySchema.index({ deliveryCompany: 1, deliveryTime: -1 });

export default mongoose.models.Delivery || mongoose.model('Delivery', deliverySchema);
