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
  managerPhone: { type: String, required: true, unique: true}, // Ensure the email is unique
  managerEmail: { type: String, required: true },
  societyAddress: { type: String, required: true }, 
  zipCode: { type: String, required: true },
  description: { type: String, required: true },
  societyImages: [String], // Store image URLs

  // Resident Management
  residents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resident' }],
  // Tenants Management
  tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tenants' }],
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
