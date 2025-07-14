import mongoose from 'mongoose';

// Define the schema for a flat/unit
const FlatSchema = new mongoose.Schema({
  flatNumber: { type: String, required: true }, // Flat number (e.g., A-101)
  residents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resident' }], // Array of residents in the flat
});

// Define the schema for a floor
const FloorSchema = new mongoose.Schema({
  floorNumber: { type: String, required: true }, // Floor number or identifier
  flats: [FlatSchema], // Array of flats on the floor
});

// Define the schema for a block/wing/tower
const BlockSchema = new mongoose.Schema({
  blockName: { type: String, required: true }, // Block name (e.g., A, B, C)
  structureType: { 
    type: String, 
    enum: ['block', 'wing', 'tower', 'custom'],
    default: 'block'
  },
  customStructureName: { 
    type: String,
    default: ''
  },
  floors: [FloorSchema], // Array of floors in the block
});

// Define schema for apartment structure that includes structure type information
const ApartmentStructureSchema = new mongoose.Schema({
  structures: [BlockSchema], // Array of blocks/wings/towers
});

// Update Society Schema with the new apartment structure schema
const SocietySchema = new mongoose.Schema({
  societyId: {
    type: String,
    unique: true,
    required: true,
  },
  societyName: { type: String, required: true },
  societyType: { type: String, required: true },
  societyStructureType: { 
    type: String, 
    required: true,
    enum: ['Block', 'Wing', 'Tower', 'Custom'],
    default: 'Block'
  },
  customStructureTypeName: {
    type: String,
    required: function() {
      return this.societyStructureType === 'Custom';
    }
  },
  managerName: { type: String, required: true },
  managerPhone: { type: String, required: true, unique: true },
  managerEmail: { type: String, required: true },
  
  // New members array to store society members with roles
  members: [{
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    role: { 
      type: String, 
      required: true,
      enum: ['admin', 'manager', 'accountant', 'security_admin', 'maintenance_admin', 'member'],
      default: 'member'
    },
    permissions: [{
      type: String,
      enum: [
        'manage_residents',
        'manage_bills',
        'manage_maintenance',
        'manage_security',
        'manage_notices',
        'manage_amenities',
        'manage_complaints',
        'view_reports',
        'manage_members',
        'full_access'
      ]
    }],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
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

  // Apartment Structure - now using the new schema that includes structure type
  apartmentStructure: ApartmentStructureSchema,
}, { timestamps: true });

export default mongoose.models.Society || mongoose.model('Society', SocietySchema);