import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  // Action Information
  actionType: { 
    type: String, 
    required: true
  },
  
  // User Information
  userId: { type: String, required: true }, // Phone number or user ID from token
  userType: { 
    type: String, 
    required: true
  },
  userName: { type: String }, // Optional user name for better readability
  userRole: { type: String }, // User's role (admin, manager, etc.)
  
  // Action Status
  status: { 
    type: String, 
    required: true 
  },
  
  // Request Information
  ipAddress: { type: String },
  userAgent: { type: String },
  endpoint: { type: String }, // API endpoint called
  httpMethod: { type: String },
  
  // Action Details
  details: { 
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Error Information (for failed actions)
  errorMessage: { type: String },
  errorCode: { type: String },
  stackTrace: { type: String }, // For debugging purposes
  
  // Context Information
  societyId: { type: String }, // Which society this action belongs to
  targetResource: { type: String }, // What resource was affected (resident ID, bill ID, etc.)
  targetResourceType: { type: String }, // Type of resource (resident, bill, member, etc.)
  
  // Request/Response Data
  requestData: { type: mongoose.Schema.Types.Mixed }, // Sanitized request data
  responseData: { type: mongoose.Schema.Types.Mixed }, // Sanitized response data
  
  // Metadata
  timestamp: { type: Date, default: Date.now },
  sessionId: { type: String }, // Optional session tracking
  duration: { type: Number }, // Request duration in milliseconds
  
}, { 
  timestamps: true,
  collection: 'activity_logs'
});

// Indexes for better performance
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ societyId: 1, timestamp: -1 });
ActivityLogSchema.index({ actionType: 1, timestamp: -1 });
ActivityLogSchema.index({ status: 1, timestamp: -1 });
ActivityLogSchema.index({ userType: 1, timestamp: -1 });
ActivityLogSchema.index({ endpoint: 1, timestamp: -1 });

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
