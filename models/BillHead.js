import mongoose from 'mongoose';

// Constants for validation
const CATEGORIES = ['Maintenance', 'Utility', 'Amenity', 'Service', 'Other'];
const SUB_CATEGORIES = {
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
const CALCULATION_TYPES = ['Fixed', 'PerUnit', 'Formula', 'Custom'];
const FREQUENCIES = ['OneTime', 'Monthly', 'Quarterly', 'HalfYearly', 'Yearly'];
const CHARGE_TYPES = ['Fixed', 'Percentage'];
const COMPOUNDING_FREQUENCIES = ['Daily', 'Weekly', 'Monthly'];

const VALID_GST_COMBINATIONS = [
  { cgst: 9, sgst: 9, igst: 0 },  // 18% split
  { cgst: 6, sgst: 6, igst: 0 },  // 12% split
  { cgst: 2.5, sgst: 2.5, igst: 0 },  // 5% split
  { cgst: 0, sgst: 0, igst: 18 },  // 18% IGST
  { cgst: 0, sgst: 0, igst: 12 },  // 12% IGST
  { cgst: 0, sgst: 0, igst: 5 }   // 5% IGST
];

const billHeadSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: [true, 'Society ID is required'],
    index: true
  },
  code: {
    type: String,
    required: [true, 'Bill head code is required'],
    uppercase: true,
    trim: true,
    minlength: [3, 'Code must be at least 3 characters'],
    maxlength: [10, 'Code cannot exceed 10 characters'],
    match: [/^[A-Z0-9-_]+$/, 'Code can only contain uppercase letters, numbers, hyphens, and underscores']
  },
  name: {
    type: String,
    required: [true, 'Bill head name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  billNumberPrefix: {
    type: String,
    default: '',
    trim: true,
    maxlength: [5, 'Bill number prefix cannot exceed 5 characters']
  },
  billNumberSequence: {
    type: Number,
    default: 1,
    min: [1, 'Bill number sequence must start from 1']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: CATEGORIES,
      message: '{VALUE} is not a valid category'
    }
  },
  subCategory: {
    type: String,
    required: [true, 'Subcategory is required'],
    validate: {
      validator: function(value) {
        return SUB_CATEGORIES[this.category]?.includes(value);
      },
      message: props => `${props.value} is not a valid subcategory for ${props.this.category}`
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  calculationType: {
    type: String,
    required: [true, 'Calculation type is required'],
    enum: {
      values: CALCULATION_TYPES,
      message: '{VALUE} is not a valid calculation type'
    }
  },
  fixedAmount: {
    type: Number,
    required: function() {
      return this.calculationType === 'Fixed';
    },
    min: [0, 'Fixed amount cannot be negative'],
    validate: {
      validator: function(value) {
        return this.calculationType !== 'Fixed' || value > 0;
      },
      message: 'Fixed amount must be greater than 0'
    }
  },
  perUnitRate: {
    type: Number,
    required: function() {
      return this.calculationType === 'PerUnit';
    },
    min: [0, 'Per unit rate cannot be negative'],
    validate: {
      validator: function(value) {
        return this.calculationType !== 'PerUnit' || value > 0;
      },
      message: 'Per unit rate must be greater than 0'
    }
  },
  formula: {
    type: String,
    required: function() {
      return this.calculationType === 'Formula';
    },
    validate: {
      validator: function(value) {
        if (this.calculationType !== 'Formula') return true;
        try {
          // Basic formula validation - check if it's a valid JavaScript expression
          new Function('amount', 'units', value);
          return true;
        } catch (e) {
          return false;
        }
      },
      message: 'Invalid formula format'
    }
  },
  frequency: {
    type: String,
    enum: {
      values: FREQUENCIES,
      message: '{VALUE} is not a valid frequency'
    },
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
      validate: {
        validator: function(value) {
          if (!this.gstConfig?.isGSTApplicable) return true;
          return value >= 0 && value <= 14;
        },
        message: 'CGST must be between 0 and 14%'
      }
    },
    sgstPercentage: {
      type: Number,
      default: 0,
      validate: {
        validator: function(value) {
          if (!this.gstConfig?.isGSTApplicable) return true;
          return value >= 0 && value <= 14;
        },
        message: 'SGST must be between 0 and 14%'
      }
    },
    igstPercentage: {
      type: Number,
      default: 0,
      validate: {
        validator: function(value) {
          if (!this.gstConfig?.isGSTApplicable) return true;
          return value >= 0 && value <= 28;
        },
        message: 'IGST must be between 0 and 28%'
      }
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
      min: [0, 'Grace period days cannot be negative'],
      validate: {
        validator: function(value) {
          return !this.latePaymentConfig?.isLatePaymentChargeApplicable || value >= 0;
        },
        message: 'Grace period days must be non-negative'
      }
    },
    chargeType: {
      type: String,
      enum: {
        values: CHARGE_TYPES,
        message: '{VALUE} is not a valid charge type'
      },
      default: 'Fixed'
    },
    chargeValue: {
      type: Number,
      default: 0,
      min: [0, 'Charge value cannot be negative'],
      validate: {
        validator: function(value) {
          if (!this.latePaymentConfig?.isLatePaymentChargeApplicable) return true;
          if (this.latePaymentConfig?.chargeType === 'Percentage') {
            return value >= 0 && value <= 100;
          }
          return value >= 0;
        },
        message: props => 
          props.this.latePaymentConfig?.chargeType === 'Percentage' 
            ? 'Percentage must be between 0 and 100' 
            : 'Charge value must be non-negative'
      }
    },
    compoundingFrequency: {
      type: String,
      enum: {
        values: COMPOUNDING_FREQUENCIES,
        message: '{VALUE} is not a valid compounding frequency'
      },
      default: 'Monthly'
    }
  },
  accountingConfig: {
    incomeLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger'
    },
    receivableLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger'
    },
    gstLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger',
      validate: {
        validator: function(value) {
          return !this.gstConfig?.isGSTApplicable || value;
        },
        message: 'GST ledger is required when GST is applicable'
      }
    },
    lateFeeIncomeLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger',
      validate: {
        validator: function(value) {
          return !this.latePaymentConfig?.isLatePaymentChargeApplicable || value;
        },
        message: 'Late fee income ledger is required when late payment charge is applicable'
      }
    }
  },
  notificationConfig: {
    sendReminders: {
      type: Boolean,
      default: true
    },
    reminderDays: {
      type: [Number],
      default: [-7, -3, -1, 1, 3, 7],
      validate: {
        validator: function(value) {
          return value.every(days => Number.isInteger(days));
        },
        message: 'Reminder days must be integers'
      }
    },
    reminderTemplate: {
      type: String,
      default: 'Your {billTitle} of ₹{amount} is {status}. Due date: {dueDate}',
      validate: {
        validator: function(value) {
          return value.includes('{billTitle}') && 
                 value.includes('{amount}') && 
                 value.includes('{status}') && 
                 value.includes('{dueDate}');
        },
        message: 'Reminder template must include {billTitle}, {amount}, {status}, and {dueDate} placeholders'
      }
    }
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
billHeadSchema.index({ societyId: 1, code: 1 }, { unique: true });
billHeadSchema.index({ societyId: 1, category: 1 });
billHeadSchema.index({ societyId: 1, status: 1 });
billHeadSchema.index({ createdAt: -1 });

// Pre-save middleware
billHeadSchema.pre('save', async function(next) {
  if (this.gstConfig.isGSTApplicable) {
    const { cgstPercentage, sgstPercentage, igstPercentage } = this.gstConfig;
    
    // Check if the combination is valid
    const isValidCombination = VALID_GST_COMBINATIONS.some(combo => 
      combo.cgst === cgstPercentage && 
      combo.sgst === sgstPercentage && 
      combo.igst === igstPercentage
    );

    if (!isValidCombination) {
      throw new Error('Invalid GST combination. Must be one of the standard rates.');
    }
  }

  // Check for unique code within society
  if (this.isNew || this.isModified('code')) {
    const exists = await this.constructor.findOne({
      societyId: this.societyId,
      code: this.code,
      _id: { $ne: this._id }
    });
    
    if (exists) {
      throw new Error('Bill head code must be unique within the society');
    }
  }

  // Update updatedBy when document is modified
  if (this.isModified() && !this.isNew) {
    this.updatedBy = this.createdBy;
  }
  next();
});

// Instance methods
billHeadSchema.methods.generateBillNumber = function() {
  const prefix = this.billNumberPrefix || this.code;
  const sequence = this.billNumberSequence++;
  return `${prefix}${sequence.toString().padStart(6, '0')}`;
};

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

billHeadSchema.methods.calculateLatePaymentCharge = function(amount, daysLate) {
  if (!this.latePaymentConfig.isLatePaymentChargeApplicable || 
      daysLate <= this.latePaymentConfig.gracePeriodDays) {
    return 0;
  }

  const effectiveDaysLate = daysLate - this.latePaymentConfig.gracePeriodDays;
  
  if (this.latePaymentConfig.chargeType === 'Fixed') {
    return this.latePaymentConfig.chargeValue;
  }

  // For percentage type
  const baseCharge = (amount * this.latePaymentConfig.chargeValue) / 100;
  
  // Apply compounding if applicable
  if (effectiveDaysLate <= 0) return 0;
  
  let periods;
  switch (this.latePaymentConfig.compoundingFrequency) {
    case 'Daily':
      periods = effectiveDaysLate;
      break;
    case 'Weekly':
      periods = Math.ceil(effectiveDaysLate / 7);
      break;
    case 'Monthly':
      periods = Math.ceil(effectiveDaysLate / 30);
      break;
    default:
      periods = 1;
  }

  return baseCharge * Math.pow(1 + (this.latePaymentConfig.chargeValue / 100), periods);
};

// Static methods
billHeadSchema.statics.findActiveBillHeads = function(societyId) {
  return this.find({ societyId, status: 'Active' });
};

billHeadSchema.statics.findByCategory = function(societyId, category) {
  return this.find({ societyId, category, status: 'Active' });
};

billHeadSchema.statics.analyzeByCategory = async function(societyId, startDate, endDate) {
  const MaintenanceBill = mongoose.model('MaintenanceBill');
  const UtilityBill = mongoose.model('UtilityBill');
  
  const billHeads = await this.find({ societyId });
  
  const analysis = {
    categories: {},
    totals: {
      billed: 0,
      collected: 0,
      pending: 0
    }
  };
  
  for (const billHead of billHeads) {
    if (!analysis.categories[billHead.category]) {
      analysis.categories[billHead.category] = {
        total: { billed: 0, collected: 0, pending: 0 },
        subCategories: {}
      };
    }
    
    if (!analysis.categories[billHead.category].subCategories[billHead.subCategory]) {
      analysis.categories[billHead.category].subCategories[billHead.subCategory] = {
        billed: 0,
        collected: 0,
        pending: 0
      };
    }
    
    const bills = await Promise.all([
      MaintenanceBill.find({
        billHeadId: billHead._id,
        billDate: { $gte: startDate, $lte: endDate }
      }),
      UtilityBill.find({
        billHeadId: billHead._id,
        billDate: { $gte: startDate, $lte: endDate }
      })
    ]);
    
    const allBills = [...bills[0], ...bills[1]];
    
    for (const bill of allBills) {
      const category = analysis.categories[billHead.category];
      const subCategory = category.subCategories[billHead.subCategory];
      
      const totalAmount = bill.totalAmount;
      const paidAmount = bill.paidAmount || 0;
      const pendingAmount = totalAmount - paidAmount;
      
      category.total.billed += totalAmount;
      category.total.collected += paidAmount;
      category.total.pending += pendingAmount;
      
      subCategory.billed += totalAmount;
      subCategory.collected += paidAmount;
      subCategory.pending += pendingAmount;
      
      analysis.totals.billed += totalAmount;
      analysis.totals.collected += paidAmount;
      analysis.totals.pending += pendingAmount;
    }
  }
  
  return analysis;
};

const BillHead = mongoose.models.BillHead || mongoose.model('BillHead', billHeadSchema);

export default BillHead; 