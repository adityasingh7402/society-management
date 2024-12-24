import mongoose from 'mongoose';

const SocietySchema = new mongoose.Schema({
  societyName: { type: String, required: true },
  societyType: { type: String, required: true },
  managerName: { type: String, required: true },
  managerPhone: { type: String, required: true },
  managerEmail: { type: String, required: true },
  societyAddress: { type: String, required: true },
  zipCode: { type: String, required: true },
  description: { type: String, required: true },
  societyImages: [String], // Store image URLs

  // Resident Management
  residents: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
  ],

  // Utility Bills (Bills/Utility Maintenance)
  utilityBills: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'UtilityBill' },
  ],

  // Maintenance Requests (Repair Maintenance)
  maintenanceRequests: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'RepairRequest' },
  ],

  // Polls
  polls: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Poll' },
  ],

  // Discussions
  discussions: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion' },
  ],

  // Security Guard Management
  visitorLogs: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorLog' },
  ],
  deliveryLogs: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryLog' },
  ],

  // Emergency Protocols
  emergencyIncidents: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyIncident' },
  ],
  emergencyNotifications: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyNotification' },
  ],
}, { timestamps: true });

export default mongoose.models.Society || mongoose.model('Society', SocietySchema);
