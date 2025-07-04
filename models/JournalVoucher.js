import mongoose from 'mongoose';

const JournalEntrySchema = new mongoose.Schema({
  ledgerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ledger',
    required: true
  },
  type: {
    type: String,
    enum: ['Debit', 'Credit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: String
});

const JournalVoucherSchema = new mongoose.Schema({
  societyId: {
    type: String,
    required: true,
    index: true
  },

  // Voucher Details
  voucherNo: {
    type: String,
    required: true,
    unique: true
  },
  voucherDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  voucherType: {
    type: String,
    enum: [
      'Payment',
      'Receipt',
      'Contra',
      'Journal',
      'Sales',
      'Purchase',
      'Debit Note',
      'Credit Note'
    ],
    required: true
  },
  referenceNo: String,
  referenceDate: Date,

  // Transaction Details
  entries: {
    type: [JournalEntrySchema],
    validate: {
      validator: function(entries) {
        if (entries.length < 2) return false;
        
        // Calculate total debits and credits
        const totals = entries.reduce((acc, entry) => {
          if (entry.type === 'Debit') {
            acc.totalDebit += entry.amount;
          } else {
            acc.totalCredit += entry.amount;
          }
          return acc;
        }, { totalDebit: 0, totalCredit: 0 });

        // Check if debits equal credits
        return Math.abs(totals.totalDebit - totals.totalCredit) < 0.01; // Allow for minor rounding differences
      },
      message: 'Total debits must equal total credits'
    },
    required: true
  },

  // Narration and Tags
  narration: {
    type: String,
    required: true
  },
  tags: [String],

  // Document References
  attachments: [{
    fileName: String,
    fileType: String,
    fileUrl: String,
    uploadedAt: Date
  }],

  // GST Details
  gstDetails: {
    isGSTApplicable: {
      type: Boolean,
      default: false
    },
    gstType: {
      type: String,
      enum: ['CGST_SGST', 'IGST', 'None'],
      default: 'None'
    },
    gstAmount: {
      type: Number,
      default: 0
    },
    gstPercentage: {
      type: Number,
      default: 0
    },
    placeOfSupply: String,
    reverseCharge: {
      type: Boolean,
      default: false
    }
  },

  // TDS Details
  tdsDetails: {
    isTDSApplicable: {
      type: Boolean,
      default: false
    },
    tdsSection: String,
    tdsPercentage: {
      type: Number,
      default: 0
    },
    tdsAmount: {
      type: Number,
      default: 0
    }
  },

  // Status and Workflow
  status: {
    type: String,
    enum: ['Draft', 'Posted', 'Cancelled'],
    default: 'Draft'
  },
  postingDate: Date,
  cancellationReason: String,
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modifiedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
JournalVoucherSchema.index({ societyId: 1, voucherDate: -1 });
JournalVoucherSchema.index({ societyId: 1, voucherType: 1 });
JournalVoucherSchema.index({ societyId: 1, status: 1 });

// Pre-save middleware
JournalVoucherSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.modifiedAt = new Date();
  }
  if (this.status === 'Posted' && !this.postingDate) {
    this.postingDate = new Date();
  }
  next();
});

// Instance method to calculate totals
JournalVoucherSchema.methods.calculateTotals = function() {
  return this.entries.reduce((acc, entry) => {
    if (entry.type === 'Debit') {
      acc.totalDebit += entry.amount;
    } else {
      acc.totalCredit += entry.amount;
    }
    return acc;
  }, { totalDebit: 0, totalCredit: 0 });
};

// Static method to get vouchers by date range
JournalVoucherSchema.statics.getVouchersByDateRange = function(societyId, startDate, endDate) {
  return this.find({
    societyId,
    voucherDate: {
      $gte: startDate,
      $lte: endDate
    },
    status: 'Posted'
  })
  .sort({ voucherDate: 1, voucherNo: 1 })
  .populate('entries.ledgerId', 'code name');
};

// Static method to get ledger entries
JournalVoucherSchema.statics.getLedgerEntries = function(societyId, ledgerId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        societyId,
        status: 'Posted',
        voucherDate: { $gte: startDate, $lte: endDate }
      }
    },
    { $unwind: '$entries' },
    {
      $match: {
        'entries.ledgerId': mongoose.Types.ObjectId(ledgerId)
      }
    },
    {
      $sort: {
        voucherDate: 1,
        voucherNo: 1
      }
    }
  ]);
};

const JournalVoucher = mongoose.models.JournalVoucher || mongoose.model('JournalVoucher', JournalVoucherSchema);
export default JournalVoucher; 