import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  fileName: String,
  fileUrl: String,
  fileType: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const emergencyAlertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  alertType: {
    type: String,
    enum: [
      'Fire Emergency',
      'Medical Emergency', 
      'Security Alert',
      'Natural Disaster',
      'Power Outage',
      'Water Emergency',
      'Gas Leak',
      'Evacuation',
      'Maintenance Alert',
      'Other'
    ],
    required: [true, 'Please provide alert type']
  },
  category: {
    type: String,
    enum: [
      'Emergency',
      'Warning',
      'Information',
      'Maintenance',
      'Security'
    ],
    required: [true, 'Please provide category']
  },
  priorityLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: [true, 'Please provide priority level']
  },
  societyId: {
    type: String,
    required: [true, 'Please provide society ID']
  },
  createdBy: {
    userId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['resident', 'security', 'management', 'admin'],
      required: true
    }
  },
  attachments: [attachmentSchema],
  notificationSettings: {
    sendEmail: {
      type: Boolean,
      default: false
    },
    sendPush: {
      type: Boolean,
      default: true
    },
    sendSMS: {
      type: Boolean,
      default: false
    }
  },
  targetAudience: {
    type: String,
    enum: ['all', 'residents', 'security', 'management', 'specific'],
    default: 'all'
  },
  specificTargets: [{
    type: String // User IDs for specific targeting
  }],
  status: {
    type: String,
    enum: ['active', 'resolved', 'cancelled', 'deleted'],
    default: 'active'
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    userId: String,
    name: String,
    role: String
  },
  isUrgent: {
    type: Boolean,
    default: function() {
      return this.priorityLevel === 'Critical' || this.priorityLevel === 'High';
    }
  },
  expiresAt: {
    type: Date
  },
  viewedBy: [{
    userId: String,
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  acknowledgedBy: [{
    userId: String,
    acknowledgedAt: {
      type: Date,
      default: Date.now
    }
  }],
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
emergencyAlertSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
emergencyAlertSchema.index({ societyId: 1, status: 1, createdAt: -1 });
emergencyAlertSchema.index({ priorityLevel: 1, status: 1 });
emergencyAlertSchema.index({ alertType: 1, status: 1 });

export default mongoose.models.EmergencyAlert || mongoose.model('EmergencyAlert', emergencyAlertSchema);
