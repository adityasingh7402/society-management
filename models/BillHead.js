import mongoose from 'mongoose';

const billHeadSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  billNumberPrefix: {
    type: String,
    default: ''
  },
  billNumberSequence: {
    type: Number,
    default: 1
  },
  category: {
    type: String,
    required: true,
    enum: ['Maintenance', 'Utility', 'Amenity', 'Service', 'Other']
  },
  description: String,
  calculationType: {
    type: String,
    required: true,
    enum: ['Fixed', 'PerUnit', 'Formula', 'Custom']
  },
  fixedAmount: {
    type: Number,
    required: function() {
      return this.calculationType === 'Fixed';
    }
  },
  perUnitRate: {
    type: Number,
    required: function() {
      return this.calculationType === 'PerUnit';
    }
  },
  formula: {
    type: String,
    required: function() {
      return this.calculationType === 'Formula';
    }
  },
  frequency: {
    type: String,
    enum: ['OneTime', 'Monthly', 'Quarterly', 'HalfYearly', 'Yearly'],
    default: 'OneTime'
  },
  gstConfig: {
    isGSTApplicable: {
      type: Boolean,
      default: false
    },
    cgstPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 14
    },
    sgstPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 14
    },
    igstPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 28
    }
  },
  latePaymentConfig: {
    isLatePaymentChargeApplicable: {
      type: Boolean,
      default: false
    },
    gracePeriodDays: {
      type: Number,
      default: 0,
      min: 0
    },
    chargeType: {
      type: String,
      enum: ['Fixed', 'Percentage'],
      default: 'Fixed'
    },
    chargeValue: {
      type: Number,
      default: 0,
      min: 0
    },
    compoundingFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly'],
      default: 'Monthly'
    }
  },
  accountingConfig: {
    incomeLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger',
      required: true
    },
    receivableLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger',
      required: true
    },
    gstLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger'
    },
    lateFeeIncomeLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger'
    }
  },
  notificationConfig: {
    sendReminders: {
      type: Boolean,
      default: true
    },
    reminderDays: {
      type: [Number],
      default: [-7, -3, -1, 1, 3, 7] // Negative for before due date, positive for after
    },
    reminderTemplate: {
      type: String,
      default: 'Your {billTitle} of ₹{amount} is {status}. Due date: {dueDate}'
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add compound index for unique code per society
billHeadSchema.index({ societyId: 1, code: 1 }, { unique: true });

// Method to generate next bill number
billHeadSchema.methods.generateBillNumber = function() {
  const prefix = this.billNumberPrefix || this.code;
  const sequence = this.billNumberSequence++;
  return `${prefix}${sequence.toString().padStart(6, '0')}`;
};

// Method to calculate GST
billHeadSchema.methods.calculateGST = function(amount) {
  if (!this.gstConfig.isGSTApplicable) return { cgst: 0, sgst: 0, igst: 0, total: 0 };
  
  const cgst = (amount * this.gstConfig.cgstPercentage) / 100;
  const sgst = (amount * this.gstConfig.sgstPercentage) / 100;
  const igst = (amount * this.gstConfig.igstPercentage) / 100;
  
  return {
    cgst,
    sgst,
    igst,
    total: cgst + sgst + igst
  };
};

export default mongoose.models.BillHead || mongoose.model('BillHead', billHeadSchema); 