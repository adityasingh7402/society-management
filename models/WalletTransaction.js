import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
  walletId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Wallet', 
    required: true 
  },
  residentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Resident', 
    required: true 
  },
  societyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Society', 
    required: true 
  },
  
  // Transaction Identification
  transactionId: {
    type: String,
    unique: true,
    default: function () {
      const timestamp = Date.now().toString();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return `TXN${timestamp}${randomNum}`;
    },
  },
  referenceId: {
    type: String // External payment gateway reference
  },
  
  // Transaction Details
  type: {
    type: String,
    enum: [
      'ADD_MONEY',           // Adding money to wallet
      'BILL_PAYMENT',        // Paying bills
      'MARKETPLACE_PURCHASE', // Marketplace transactions
      'REFUND',              // Refunds
      'TRANSFER',            // P2P transfers
      'PENALTY',             // Penalty charges
      'REWARD',              // Rewards/Cashback
      'ADJUSTMENT',          // Manual adjustments
      'MAINTENANCE_PAYMENT', // Maintenance bill payment
      'UTILITY_PAYMENT',     // Utility bill payment
      'AMENITY_PAYMENT'      // Amenity bill payment
    ],
    required: true
  },
  
  subType: {
    type: String // Additional classification
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Transaction Flow
  transactionFlow: {
    type: String,
    enum: ['CREDIT', 'DEBIT'],
    required: true
  },
  
  // Balance Information
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  },
  
  // Payment Details (for ADD_MONEY transactions)
  paymentDetails: {
    method: {
      type: String,
      enum: ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET', 'CASH', 'TEST_GATEWAY']
    },
    gateway: {
      type: String,
      enum: ['RAZORPAY', 'STRIPE', 'PAYU', 'CASHFREE', 'TEST_GATEWAY']
    },
    gatewayTransactionId: String,
    gatewayOrderId: String,
    bankReference: String,
    cardLast4: String,
    upiId: String
  },
  
  // Bill Payment Details
  billDetails: {
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'billDetails.billType'
    },
    billType: {
      type: String,
      enum: ['MaintenanceBill', 'UtilityBill', 'AmenityBill']
    },
    billNumber: String,
    dueDate: Date,
    penaltyAmount: { type: Number, default: 0 }
  },
  
  // Marketplace Transaction Details
  marketplaceDetails: {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'marketplaceDetails.itemType'
    },
    itemType: {
      type: String,
      enum: ['Product', 'Property']
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident'
    },
    itemName: String,
    quantity: { type: Number, default: 1 }
  },
  
  // Transfer Details (P2P)
  transferDetails: {
    toWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet'
    },
    fromWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet'
    },
    toResidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident'
    },
    fromResidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident'
    }
  },
  
  // Description and Notes
  description: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  
  // Fee Information
  fees: {
    processingFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    gatewayCharges: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    totalFees: { type: Number, default: 0 }
  },
  
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  
  // Error Information
  errorCode: String,
  errorMessage: String,
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceInfo: String,
    location: String
  },
  
  // Fraud Detection
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  riskFlags: [{
    flag: String,
    reason: String,
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH']
    }
  }],
  
  // Reconciliation
  isReconciled: {
    type: Boolean,
    default: false
  },
  reconciledAt: Date,
  reconciledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society'
  },
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident'
  }
}, {
  timestamps: true
});

// Indexes for better performance
walletTransactionSchema.index({ walletId: 1 });
walletTransactionSchema.index({ residentId: 1 });
walletTransactionSchema.index({ transactionId: 1 });
walletTransactionSchema.index({ type: 1 });
walletTransactionSchema.index({ status: 1 });
walletTransactionSchema.index({ createdAt: -1 });
walletTransactionSchema.index({ 'paymentDetails.gatewayTransactionId': 1 });
walletTransactionSchema.index({ 'billDetails.billId': 1 });

// Compound indexes
walletTransactionSchema.index({ residentId: 1, createdAt: -1 });
walletTransactionSchema.index({ walletId: 1, status: 1 });
walletTransactionSchema.index({ societyId: 1, type: 1 });

// Virtual for formatted amount
walletTransactionSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
});

// Method to mark transaction as completed
walletTransactionSchema.methods.markCompleted = function() {
  this.status = 'SUCCESS';
  this.completedAt = new Date();
};

// Method to mark transaction as failed
walletTransactionSchema.methods.markFailed = function(errorCode, errorMessage) {
  this.status = 'FAILED';
  this.errorCode = errorCode;
  this.errorMessage = errorMessage;
  this.completedAt = new Date();
};

// Static method to get transaction summary for a wallet
walletTransactionSchema.statics.getTransactionSummary = async function(walletId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        walletId: mongoose.Types.ObjectId(walletId),
        status: 'SUCCESS',
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        creditAmount: {
          $sum: {
            $cond: [{ $eq: ['$transactionFlow', 'CREDIT'] }, '$amount', 0]
          }
        },
        debitAmount: {
          $sum: {
            $cond: [{ $eq: ['$transactionFlow', 'DEBIT'] }, '$amount', 0]
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

const WalletTransaction = mongoose.models.WalletTransaction || 
  mongoose.model('WalletTransaction', walletTransactionSchema);

export default WalletTransaction;
