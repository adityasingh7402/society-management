import mongoose from 'mongoose';

const SocietySchema = new mongoose.Schema({
  societyId: {
    type: String,
    unique: true,
    required: true,
  },
  societyName: { type: String, required: true },
  societyType: { type: String, required: true },
  managerName: { type: String, required: true },
  managerPhone: { type: String, required: true, unique: true },
  managerEmail: { type: String, required: true },
  
  // Address Fields
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pinCode: { type: String, required: true },
  
  description: { type: String, required: true },
  societyImages: [String],

  // Resident Management
  residents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resident' }],
  // Tenants Management
  tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tenants' }],
  // Security Management
  security: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Security' }],
  // Utility Bills (Bills/Utility Maintenance)
  utilityBills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UtilityBill' }],
  // Maintenance Requests (Repair Maintenance)
  maintenanceRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RepairRequest' }],
  // Announcement
  announcement: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Announcement' }],
  // Polls
  polls: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Poll' }],
  // Discussions
  discussions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Discussion' }],
  // Security Guard Management
  visitorLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VisitorLog' }],
  deliveryLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryLog' }],
  // Emergency Protocols
  emergencyNotifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyNotification' }],
  emergencyIncidents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyIncident' }],
}, { timestamps: true });

export default mongoose.models.Society || mongoose.model('Society', SocietySchema);
