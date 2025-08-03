import mongoose from 'mongoose';

const ResidentBillSchema = new mongoose.Schema({
  societyId: {
    type: String,
    required: true
  },
  billNumber: {
    type: String,
    required: true
  },
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  billHeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillHead',
    required: true
  },
  scheduledBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduledBill'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  gstDetails: {
    isGSTApplicable: Boolean,
    gstType: {
      type: String,
      enum: ['CGST_SGST', 'IGST', 'None']
    },
    gstPercentage: Number,
    gstAmount: Number
  },
  issueDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Partially_Paid', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Pending'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  penaltyAmount: {
    type: Number,
    default: 0
  },
  lastPenaltyCalculationDate: Date,
  remarks: String,
  
  // Resident Details (for quick access)
  residentDetails: {
    name: String,
    phone: String,
    email: String,
    flatNumber: String,
    blockName: String,
    floorNumber: String
  },

  // Bill Head Details (for quick access)
  billHeadDetails: {
    code: String,
    name: String,
    category: String,
    calculationType: String
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
ResidentBillSchema.index({ societyId: 1, status: 1 });
ResidentBillSchema.index({ societyId: 1, residentId: 1 });
ResidentBillSchema.index({ societyId: 1, dueDate: 1, status: 1 });
ResidentBillSchema.index({ billNumber: 1 }, { unique: true });

// Pre-save middleware to update status based on due date
ResidentBillSchema.pre('save', function(next) {
  const now = new Date();
  
  // Update status to Overdue if past due date and not fully paid
  if (this.dueDate < now && this.status === 'Pending') {
    this.status = 'Overdue';
  }
  
  // Update status based on payment
  if (this.paidAmount >= (this.amount + (this.penaltyAmount || 0))) {
    this.status = 'Paid';
  } else if (this.paidAmount > 0) {
    this.status = 'Partially_Paid';
  }
  
  next();
});

// Instance method to calculate penalty
ResidentBillSchema.methods.calculatePenalty = async function() {
  if (this.status === 'Paid') return 0;
  
  const now = new Date();
  if (now <= this.dueDate) return 0;
  
  try {
    // Get bill head configuration
    const BillHead = mongoose.model('BillHead');
    const billHead = await BillHead.findById(this.billHeadId);
    if (!billHead) return 0;
    
    const daysLate = Math.floor((now - this.dueDate) / (1000 * 60 * 60 * 24));
    let penalty = 0;
    
    if (billHead.latePaymentConfig?.isLatePaymentChargeApplicable) {
      const config = billHead.latePaymentConfig;
      
      // Skip penalty if within grace period
      if (daysLate <= config.gracePeriodDays) return 0;
      
      if (config.chargeType === 'Fixed') {
        penalty = config.chargeValue * Math.floor(daysLate / 30); // Monthly fixed charge
      } else if (config.chargeType === 'Percentage') {
        penalty = (this.amount * (config.chargeValue / 100)) * 
          (config.compoundingFrequency === 'Monthly' ? Math.floor(daysLate / 30) : daysLate);
      }
    }
    
    this.penaltyAmount = penalty;
    this.lastPenaltyCalculationDate = now;
    await this.save();
    
    return penalty;
  } catch (error) {
    console.error('Error calculating penalty:', error);
    return 0;
  }
};

// Static method to get bills by date range
ResidentBillSchema.statics.getBillsByDateRange = function(societyId, startDate, endDate, status) {
  const query = {
    societyId,
    issueDate: { $gte: startDate, $lte: endDate }
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .sort({ issueDate: -1 })
    .populate('residentId', 'name phone email flatDetails')
    .populate('billHeadId', 'name code category');
};

export default mongoose.models.ResidentBill || mongoose.model('ResidentBill', ResidentBillSchema); 