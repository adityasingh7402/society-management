import mongoose from 'mongoose';

const UtilityBillSchema = new mongoose.Schema({
  societyId: { type: String, required: true },
  flatNumber: { type: String, required: true },
  blockName: { type: String, required: true },
  floorNumber: { type: Number, required: true },
  residentId: { type: String, required: true },
  ownerName: { type: String, required: true },
  ownerMobile: { type: String, required: true },
  ownerEmail: { type: String, required: false },
  utilityType: { type: String, required: true },
  description: { type: String },
  unitUsage: { type: Number, required: true },
  perUnitRate: { type: Number, required: true },
  baseAmount: { type: Number, required: true },
  additionalCharges: [{
    description: { type: String },
    amount: { type: Number }
  }],
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  finePerDay: { type: Number, default: 50 },
  penaltyAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Paid', 'Overdue'], default: 'Pending' },
  remainingAmount: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
}, { timestamps: true });

// Calculate penalty based on days overdue and fine per day
UtilityBillSchema.methods.calculatePenalty = function() {
  // If bill is already paid, no penalty
  if (this.status === 'Paid') {
    return 0;
  }
  
  // Calculate days overdue
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  
  // If not yet due, no penalty
  if (today <= dueDate) {
    return 0;
  }
  
  // Calculate days difference
  const diffTime = Math.abs(today - dueDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate penalty amount
  const finePerDay = this.finePerDay || 50; // Default to 50 if not specified
  const penalty = diffDays * finePerDay;
  
  return penalty;
};

// Calculate total amount including base amount, additional charges, and penalty
UtilityBillSchema.methods.calculateTotalAmount = function() {
  const baseAmount = this.baseAmount || 0;
  
  // Sum additional charges
  const additionalChargesTotal = this.additionalCharges.reduce((sum, charge) => {
    return sum + (charge.amount || 0);
  }, 0);
  
  // Add penalty if any
  const penalty = this.penaltyAmount || 0;
  
  return baseAmount + additionalChargesTotal + penalty;
};

// Calculate remaining amount
UtilityBillSchema.methods.calculateRemainingAmount = function() {
  if (this.status === 'Paid') {
    return 0;
  }
  
  return this.calculateTotalAmount();
};

// Pre-save hook to update remaining amount and penalty
UtilityBillSchema.pre('save', function(next) {
  // Update penalty amount
  if (this.status !== 'Paid') {
    this.penaltyAmount = this.calculatePenalty();
    
    // Update status to Overdue if past due date
    if (new Date() > new Date(this.dueDate)) {
      this.status = 'Overdue';
    }
  }
  
  // Update remaining amount
  this.remainingAmount = this.calculateRemainingAmount();
  
  next();
});

export default mongoose.models.UtilityBill || mongoose.model('UtilityBill', UtilityBillSchema);