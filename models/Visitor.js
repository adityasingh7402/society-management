import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  // Society and flat details
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

  guardName: {
    type: String,
  },
  guardImage: {
    type: String,
  },
  guardPhone: {
    type: String,
  },

  // Resident/Owner details
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident'
  },
  securityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Security'
  },
  ownerName: {
    type: String,
    required: true
  },
  ownerMobile: {
    type: String,
    required: true
  },
  ownerEmail: {
    type: String
  },

  // Visitor details
  visitorName: {
    type: String,
    required: true
  },
  visitorImage: {
    type: String
  },
  visitorReason: {
    type: String,
    required: true
  },
  entryTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  exitTime: {
    type: Date
  },

  // Status field
  status: {
    type: String,
    enum: ['approve', 'reject', 'pending'], // Allowed values
    default: 'pending' // Default status
  },

  // Additional metadata
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

// Create compound index for efficient querying
visitorSchema.index({ societyId: 1, blockName: 1, floorNumber: 1, flatNumber: 1 });

export default mongoose.models.Visitor || mongoose.model('Visitor', visitorSchema);