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

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  noticeType: {
    type: String,
    enum: ['Warning', 'Emergency'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'Rule Violation',
      'Noise Complaint',
      'Parking Issue',
      'Fire Hazard',
      'Power Outage',
      'Security Threat',
      'Other'
    ],
    required: true
  },
  priorityLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true
  },
  societyId: {
    type: String,
    required: true
  },
  createdBy: {
    userId: String,
    name: String,
    role: {
      type: String,
      enum: ['resident', 'security', 'management']
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    userId: String,
    name: String,
    approvedAt: Date
  },
  attachments: [attachmentSchema],
  active: {
    type: Boolean,
    default: true
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
noticeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Notice || mongoose.model('Notice', noticeSchema);