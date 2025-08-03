const mongoose = require('mongoose');

const JournalVoucherSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  voucherNumber: {
    type: String,
    required: true,
    // Remove unique: true from here since we'll define it in the compound index
  },
  voucherDate: {
    type: Date,
    required: true
  },
  voucherType: {
    type: String,
    enum: ['Receipt', 'Payment', 'Journal', 'Contra', 'Sales', 'Purchase', 'Credit Note', 'Debit Note'],
    required: true
  },
  
  // Reference documents
  referenceType: {
    type: String,
    enum: ['Bill', 'Payment', 'Manual', 'Other']
  },
  referenceId: mongoose.Schema.Types.ObjectId,
  referenceNumber: String,
  
  // Category and Subcategory
  category: {
    type: String,
    enum: ['Maintenance', 'Utility', 'Amenity', 'Service', 'Other'],
    required: function() {
      return this.referenceType === 'Bill';
    }
  },
  subCategory: {
    type: String,
    validate: {
      validator: function(value) {
        if (!value || !this.category) return true;
        
        const subCategories = {
          Utility: ['Water', 'Electricity', 'Gas', 'Internet', 'Cable', 'Telephone', 'Other'],
          Maintenance: ['Cleaning', 'Security', 'Gardening', 'Equipment', 'Repairs', 'Staff', 'Other'],
          Amenity: ['Gym', 'Swimming Pool', 'Club House', 'Sports', 'Park', 'Community Hall', 'Other'],
          Service: ['Pest Control', 'Plumbing', 'Electrical', 'Carpentry', 'Housekeeping', 'Other'],
          Other: [
            'Society Charges',
            'Platform Charges',
            'Transfer Charges',
            'NOC Charges',
            'Processing Fees',
            'Late Payment Charges',
            'Legal Charges',
            'Documentation Charges',
            'Administrative Charges',
            'Event Charges',
            'Miscellaneous'
          ]
        };
        
        return subCategories[this.category]?.includes(value);
      },
      message: 'Invalid subcategory for the selected category'
    }
  },
  
  // Entries
  entries: [{
    ledgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger',
      required: true
    },
    type: {
      type: String,
      enum: ['debit', 'credit'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: String
  }],
  
  // Narration and tags
  narration: {
    type: String,
    required: true
  },
  tags: [String],
  
  // GST details
  gstDetails: {
    isGSTApplicable: {
      type: Boolean,
      default: false
    },
    gstType: {
      type: String,
      enum: ['Regular', 'ReverseCharge', 'Composition', 'Exempt', 'NonGST']
    },
    gstMonth: Date,
    gstEntries: [{
      type: {
        type: String,
        enum: ['CGST', 'SGST', 'IGST']
      },
      percentage: Number,
      amount: Number,
      ledgerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ledger'
      }
    }]
  },
  
  // TDS details
  tdsDetails: {
    isTDSApplicable: {
      type: Boolean,
      default: false
    },
    tdsSection: String,
    tdsRate: Number,
    tdsAmount: Number,
    tdsLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger'
    }
  },
  
  // Approval workflow
  approvalStatus: {
    type: String,
    enum: ['Draft', 'Pending', 'Approved', 'Rejected'],
    default: 'Draft'
  },
  approvalWorkflow: [{
    action: {
      type: String,
      enum: ['Created', 'Modified', 'Submitted', 'Approved', 'Rejected']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Attachments
  attachments: [{
    fileName: String,
    fileType: String,
    fileSize: Number,
    fileUrl: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status and audit
  status: {
    type: String,
    enum: ['Active', 'Cancelled', 'Deleted'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Approval details
  approvedBy: {
    adminId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Society' 
    },
    adminName: { type: String },
    approvedAt: { type: Date }
  }
}, {
  timestamps: true
});

// Single compound index for unique voucher number per society
JournalVoucherSchema.index({ societyId: 1, voucherNumber: 1 }, { 
  unique: true,
  background: true
});

// Additional indexes for better query performance
JournalVoucherSchema.index({ societyId: 1, voucherDate: -1 });
JournalVoucherSchema.index({ societyId: 1, status: 1 });
JournalVoucherSchema.index({ referenceType: 1, referenceId: 1 });

// Function to generate next sequence number with retries
async function getNextSequence(societyId, prefix, date, retryCount = 0) {
  const MAX_RETRIES = 3;
  const formattedDate = `${date.getFullYear().toString().substr(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  const voucherPrefix = `JV/${prefix}/${formattedDate}/`;
  
  try {
    const lastVoucher = await mongoose.models.JournalVoucher.findOne({
      societyId: societyId,
      voucherNumber: new RegExp('^' + voucherPrefix)
    }).sort({ voucherNumber: -1 });

    let sequence = 1;
    if (lastVoucher) {
      const lastSequence = parseInt(lastVoucher.voucherNumber.split('/').pop());
      sequence = isNaN(lastSequence) ? 1 : lastSequence + 1;
    }

    const voucherNumber = `${voucherPrefix}${sequence.toString().padStart(4, '0')}`;
    
    // Verify the generated number is unique
    const existingVoucher = await mongoose.models.JournalVoucher.findOne({
      voucherNumber: voucherNumber
    });

    if (existingVoucher && retryCount < MAX_RETRIES) {
      // If number exists, increment sequence and retry
      return getNextSequence(societyId, prefix, date, retryCount + 1);
    } else if (retryCount >= MAX_RETRIES) {
      throw new Error('Failed to generate unique voucher number after maximum retries');
    }

    return voucherNumber;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      // Add a small delay before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
      return getNextSequence(societyId, prefix, date, retryCount + 1);
    }
    console.error('Error generating voucher number:', error);
    throw new Error('Failed to generate voucher number');
  }
}

// Pre-save middleware to generate voucher number if not provided
JournalVoucherSchema.pre('save', async function(next) {
  try {
    if (!this.voucherNumber) {
      const prefix = this.category ? this.category.substring(0, 3).toUpperCase() : 'JV';
      this.voucherNumber = await getNextSequence(
        this.societyId,
        prefix,
        this.voucherDate || new Date()
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Add generateVoucherNumber as an instance method
JournalVoucherSchema.methods.generateVoucherNumber = async function(societyId, prefix, date) {
  return getNextSequence(societyId, prefix, date);
};

// Add generateVoucherNumber as a static method
JournalVoucherSchema.statics.generateVoucherNumber = async function(societyId, prefix, date) {
  return getNextSequence(societyId, prefix, date);
};

// Method to validate entries (total debit = total credit)
JournalVoucherSchema.methods.validateEntries = function() {
  const totalDebit = this.entries
    .filter(entry => entry.type === 'debit')
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  const totalCredit = this.entries
    .filter(entry => entry.type === 'credit')
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  return Math.abs(totalDebit - totalCredit) < 0.01; // Allow for small rounding differences
};

// Method to post entries to ledgers
JournalVoucherSchema.methods.postToLedgers = async function(session) {
  const Ledger = mongoose.model('Ledger');
  
  for (const entry of this.entries) {
    const ledger = await Ledger.findById(entry.ledgerId).session(session);
    if (!ledger) throw new Error(`Ledger not found: ${entry.ledgerId}`);
    
    await ledger.updateBalance(entry.amount, entry.type.toLowerCase());
  }
};

// Method to cancel voucher
JournalVoucherSchema.methods.cancel = async function(userId, remarks) {
  if (this.status !== 'Active') {
    throw new Error('Cannot cancel non-active voucher');
  }
  
  // Reverse all entries
  const Ledger = mongoose.model('Ledger');
  for (const entry of this.entries) {
    const ledger = await Ledger.findById(entry.ledgerId);
    if (!ledger) throw new Error(`Ledger not found: ${entry.ledgerId}`);
    
    // Reverse the entry (debit becomes credit and vice versa)
    await ledger.updateBalance(entry.amount, entry.type === 'debit' ? 'credit' : 'debit');
  }
  
  // Update status and add to workflow
  this.status = 'Cancelled';
  this.approvalWorkflow.push({
    action: 'Cancelled',
    userId,
    remarks,
    timestamp: new Date()
  });
  
  await this.save();
};

// Pre-save middleware
JournalVoucherSchema.pre('save', function(next) {
  // Validate entries if they've been modified
  if (this.isModified('entries')) {
    if (!this.validateEntries()) {
      next(new Error('Total debit must equal total credit'));
      return;
    }
  }
  
  next();
});

// Export the model
const JournalVoucher = mongoose.models.JournalVoucher || mongoose.model('JournalVoucher', JournalVoucherSchema);
module.exports = JournalVoucher;
