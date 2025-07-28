import mongoose from 'mongoose';

const gatePassSchema = new mongoose.Schema({
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
  flatDetails: {
    block: String,
    floor: String,
    flatNumber: String
  },
  societyName: {
    type: String,
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
    purpose: {
      type: String,
      required: true
    }
  },
  duration: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    days: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    }
  },
  hasVehicle: {
    type: Boolean,
    default: false
  },
  vehicleDetails: {
    vehicleType: {
      type: String,
      enum: ['Car', 'Motor Bike', 'Bike', ''],
      default: ''
    },
    registrationNumber: {
      type: String,
      default: ''
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Expired'],
    default: 'Active'
  },
  qrCode: {
    type: String
  },
  pinCode: {
    type: String
  },
  shareableImage: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
gatePassSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.GatePass || mongoose.model('GatePass', gatePassSchema);