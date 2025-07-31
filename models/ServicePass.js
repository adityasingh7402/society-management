import mongoose from 'mongoose';

const ServicePassSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Resident'
  },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Society'
  },
  societyName: {
    type: String,
    required: true
  },
  flatDetails: {
    flatNumber: {
      type: String,
      required: true
    }
  },
  personnelDetails: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    serviceType: {
      type: String,
      required: true,
      enum: ['Cook', 'Maid', 'Electrician', 'Plumber', 'Driver', 'Gardener', 'Security', 'Painter', 'Carpenter', 'Babysitter', 'Other']
    },
    otherServiceType: {
      type: String,
      required: function() {
        return this.personnelDetails.serviceType === 'Other';
      }
    },
    personnelImage: {
      type: String // URL to the uploaded image
    }
  },
  passType: {
    type: String,
    required: true,
    enum: ['Daily', 'DateRange']
  },
  duration: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  workingHours: {
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Expired']
  },
  pinCode: {
    type: String,
    required: true
  },
  qrCode: {
    type: String
  },
  shareableImage: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries
ServicePassSchema.index({ residentId: 1, status: 1 });
ServicePassSchema.index({ societyId: 1, status: 1 });
ServicePassSchema.index({ pinCode: 1 });

export default mongoose.models.ServicePass || mongoose.model('ServicePass', ServicePassSchema); 