const mongoose = require('mongoose');

const scheduledBillSchema = new mongoose.Schema({
  societyId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  billHeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillHead',
    required: true
  },
  // Add bill head details for quick reference
  billHeadDetails: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Maintenance', 'Utility', 'Amenity', 'Other'],
      required: true
    },
    subCategory: String,
    calculationType: {
      type: String,
      enum: ['Fixed', 'PerUnit', 'Formula'],
      required: true
    },
    perUnitRate: Number,
    fixedAmount: Number,
    formula: String
  },
  frequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'HalfYearly', 'Yearly', 'Custom'],
    required: true
  },
  customFrequencyDays: {
    type: Number,
    required: function() {
      return this.frequency === 'Custom';
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  dueDays: {
    type: Number,
    required: true,
    default: 15
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  // Bill generation details
  unitUsage: {
    type: Number,
    required: function() {
      return this.billHeadId && this.billHeadId.calculationType !== 'Fixed';
    }
  },
  periodType: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'HalfYearly', 'Yearly'],
    required: true,
    default: 'Monthly'
  },
  baseAmount: {
    type: Number,
    required: true
  },
  gstDetails: {
    isGSTApplicable: {
      type: Boolean,
      default: false
    },
    cgstPercentage: {
      type: Number,
      default: 0
    },
    sgstPercentage: {
      type: Number,
      default: 0
    },
    igstPercentage: {
      type: Number,
      default: 0
    },
    cgstAmount: {
      type: Number,
      default: 0
    },
    sgstAmount: {
      type: Number,
      default: 0
    },
    igstAmount: {
      type: Number,
      default: 0
    }
  },
  // Add late payment configuration
  latePaymentConfig: {
    isLatePaymentChargeApplicable: {
      type: Boolean,
      default: false
    },
    gracePeriodDays: {
      type: Number,
      default: 0
    },
    chargeType: {
      type: String,
      enum: ['Fixed', 'Percentage'],
      default: 'Fixed'
    },
    chargeValue: {
      type: Number,
      default: 0
    },
    compoundingFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly'],
      default: 'Monthly'
    }
  },
  additionalCharges: [{
    billHeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillHead'
    },
    chargeType: String,
    amount: Number,
    ledgerId: String,
    unitUsage: Number,
    calculationType: {
      type: String,
      enum: ['Fixed', 'PerUnit', 'Formula']
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  // Resident selection
  selectedResidents: [{
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      required: true
    },
    flatNumber: String,
    blockName: String,
    floorNumber: String,
    ownerName: String,
    ownerMobile: String,
    ownerEmail: String
  }],
  // Generation tracking
  lastGenerationDate: Date,
  nextGenerationDate: Date,
  generationHistory: [{
    generatedAt: {
      type: Date,
      required: true
    },
    billsGenerated: Number,
    status: {
      type: String,
      enum: ['Success', 'Failed'],
      required: true
    },
    error: String
  }],
  // Success history for duplicate prevention
  successHistory: [{
    generationDate: {
      type: Date,
      required: true
    },
    billIds: [{
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'billModel'
    }],
    period: {
      type: String,
      required: true
    }, // Format: "2025-01", "2025-02", etc.
    status: {
      type: String,
      enum: ['Success', 'Failed'],
      default: 'Success'
    },
    billsGenerated: Number,
    billType: String // Utility, Maintenance, Amenity
  }],
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
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
});

// Method to calculate next generation date
scheduledBillSchema.methods.calculateNextGenerationDate = function() {
  const lastDate = this.lastGenerationDate || this.startDate;
  const now = new Date();
  let nextDate = new Date(lastDate);

  // If the last generation date is in the future, use it as is
  // Otherwise, start from today
  if (lastDate < now) {
    nextDate = now;
  }

  // Calculate next date based on frequency
  switch (this.frequency) {
    case 'Daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'Weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'Monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'Quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'HalfYearly':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'Yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'Custom':
      nextDate.setDate(nextDate.getDate() + this.customFrequencyDays);
      break;
  }

  // If end date is set and next date would be after end date, return null
  if (this.endDate && nextDate > this.endDate) {
    return null;
  }

  // Ensure next date is not in the past
  if (nextDate < now) {
    nextDate = now;
  }

  return nextDate;
};

// Pre-save middleware to update timestamps
scheduledBillSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.ScheduledBill || mongoose.model('ScheduledBill', scheduledBillSchema); 