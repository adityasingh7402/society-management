import mongoose from 'mongoose';

const vehicleTagSchema = new mongoose.Schema({
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
    enum: ['Car', 'Bike', 'Bicycle'],
    required: true
  },
  vehicleDetails: {
    brand: String,
    model: String,
    color: String,
    registrationNumber: {
      type: String,
      required: true
    }
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
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society'
  },
  approvedAt: Date,
  remarks: String
}, {
  timestamps: true
});

// Add index for faster queries
vehicleTagSchema.index({ residentId: 1, status: 1 });
vehicleTagSchema.index({ societyId: 1, status: 1 });

const VehicleTag = mongoose.models.VehicleTag || mongoose.model('VehicleTag', vehicleTagSchema);

export default VehicleTag; 