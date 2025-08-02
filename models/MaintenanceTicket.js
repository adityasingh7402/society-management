import mongoose from 'mongoose';

// Function to generate 10-digit reference number
const generateReferenceNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return (timestamp.slice(-7) + random).slice(-10);
};

const MaintenanceTicketSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
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
    enum: ['Pending', 'Approved', 'Assigned', 'In Progress', 'Completed', 'Resolved', 'Rejected'],
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
    },
    userType: {
      type: String,
      enum: ['resident', 'society'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    // Additional fields for residents
    flatNumber: {
      type: String
    },
    userImage: {
      type: String
    },
    // Additional fields for society members
    role: {
      type: String
    },
    // Optional attachments
    attachments: [{
      type: String // URLs to uploaded files/images
    }],
    // For tracking comment status
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
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

// Pre-save middleware to auto-generate reference number
MaintenanceTicketSchema.pre('save', async function(next) {
  if (!this.referenceNumber) {
    let isUnique = false;
    while (!isUnique) {
      const refNumber = generateReferenceNumber();
      const existingTicket = await mongoose.models.MaintenanceTicket.findOne({ referenceNumber: refNumber });
      if (!existingTicket) {
        this.referenceNumber = refNumber;
        isUnique = true;
      }
    }
  }
  next();
});

export default mongoose.models.MaintenanceTicket || mongoose.model('MaintenanceTicket', MaintenanceTicketSchema);
