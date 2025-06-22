import mongoose from 'mongoose';

const VehicleTagSchema = new mongoose.Schema({
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
  vehicleType: {
    type: String,
    enum: ['Car', 'Motor Bike', 'Bike'],
    required: true
  },
  vehicleDetails: {
    brand: {
      type: String,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    registrationNumber: {
      type: String,
      required: true
    }
  },
  pinCode: {
    type: String,
    required: true,
    unique: true,
    length: 6
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Expired'],
    default: 'Pending'
  },
  validFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  qrCode: {
    type: String // URL or base64 of QR code
  },
  shareableImage: {
    type: String
  },
  qrData: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society'
  },
  approvedAt: Date,
  remarks: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add index for faster queries
VehicleTagSchema.index({ residentId: 1, status: 1 });
VehicleTagSchema.index({ societyId: 1, status: 1 });

const VehicleTag = mongoose.models.VehicleTag || mongoose.model('VehicleTag', VehicleTagSchema);

export default VehicleTag; 