import mongoose from 'mongoose';

const MaintenanceTicketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the ticket'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description of the issue'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Plumbing', 'Electrical', 'Structural', 'Appliance', 'Heating/Cooling', 'Pest Control', 'Other'],
  },
  priority: {
    type: String,
    required: [true, 'Please select a priority level'],
    enum: ['Low', 'Medium', 'High', 'Emergency'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Assigned', 'In Progress', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  images: [{
    type: String
  }],
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  societyId: {
    type: String,
    required: true
  },
  flatNumber: {
    type: String,
    required: true
  },
  assignedTo: {
    type: String,
    default: null
  },
  comments: [{
    text: {
      type: String,
      required: true
    },
    createdBy: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isAdmin: {
      type: Boolean,
      default: false
    }
  }],
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: String,
      required: true
    }
  }]
}, { timestamps: true });

export default mongoose.models.MaintenanceTicket || mongoose.model('MaintenanceTicket', MaintenanceTicketSchema);