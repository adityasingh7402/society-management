import mongoose from 'mongoose';

const guestPassSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  guestDetails: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: String,
    purpose: {
      type: String,
      required: true
    },
    numberOfGuests: {
      type: Number,
      default: 1
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Expired', 'Used'],
    default: 'Pending'
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  qrCode: {
    type: String // URL or base64 of QR code
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society'
  },
  approvedAt: Date,
  usedAt: Date,
  remarks: String,
  vehicleDetails: {
    vehicleNumber: String,
    vehicleType: {
      type: String,
      enum: ['Car', 'Bike', 'Bicycle', 'None'],
      default: 'None'
    }
  }
}, {
  timestamps: true
});

// Add index for faster queries
guestPassSchema.index({ residentId: 1, status: 1 });
guestPassSchema.index({ societyId: 1, status: 1 });
guestPassSchema.index({ validUntil: 1, status: 1 });

const GuestPass = mongoose.models.GuestPass || mongoose.model('GuestPass', guestPassSchema);

export default GuestPass; 