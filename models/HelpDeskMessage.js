import mongoose from 'mongoose';

// Define the schema
const HelpDeskMessageSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  societyId: {
    type: String,
    required: true
  },
  isFromResident: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  media: {
    type: Object,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create model
const HelpDeskMessage = mongoose.models.HelpDeskMessage || mongoose.model('HelpDeskMessage', HelpDeskMessageSchema);

export default HelpDeskMessage; 