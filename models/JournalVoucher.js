import mongoose from 'mongoose';

const JournalVoucherSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  voucherNumber: {
    type: String,
    required: true,
    unique: true
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
      rate: Number,
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
  }
}, {
  timestamps: true
});

// Compound index for unique voucher number per society
JournalVoucherSchema.index({ societyId: 1, voucherNumber: 1 }, { unique: true });

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
JournalVoucherSchema.methods.postToLedgers = async function() {
  const Ledger = mongoose.model('Ledger');
  
  for (const entry of this.entries) {
    const ledger = await Ledger.findById(entry.ledgerId);
    if (!ledger) throw new Error(`Ledger not found: ${entry.ledgerId}`);
    
    await ledger.updateBalance(entry.amount, entry.type);
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

export default mongoose.models.JournalVoucher || mongoose.model('JournalVoucher', JournalVoucherSchema); 