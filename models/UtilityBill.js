import mongoose from 'mongoose';

const UtilityBillSchema = new mongoose.Schema({
  // References
  societyId: { type: String, required: true }, // Society ID
  flatNumber: { type: String, required: true }, // Flat number for easier querying/display
  blockName: { type: String, required: true }, // Block name
  floorNumber: { type: Number, required: true }, // Floor number
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' }, // Resident reference

  // Owner details
  ownerName: { type: String, required: true }, // Owner's name
  ownerMobile: { type: String, required: true }, // Owner's mobile number
  ownerEmail: { type: String, required: true }, // Owner's email address

  // Utility Type
  utilityType: {
    type: String,
    required: true,
    enum: ['Electricity', 'Water', 'Gas', 'Internet', 'Other'], // Types of utilities
  },

  // Bill details
  description: { type: String }, // Description of the bill
  unitUsage: { type: Number, required: true }, // Units consumed (e.g., kWh for electricity, liters for water)
  perUnitRate: { type: Number, required: true }, // Rate per unit
  baseAmount: { type: Number, required: true }, // Calculated as unitUsage * perUnitRate
  additionalCharges: [
    {
      description: String,
      amount: Number,
    },
  ], // Extra charges if any (e.g., taxes, surcharges)

  // Dates
  issueDate: { type: Date, default: Date.now }, // Date when the bill was issued
  dueDate: { type: Date, required: true }, // Due date for payment

  // Late payment and penalty
  finePerDay: { type: Number, default: 0 }, // Fine per day after the due date
  penaltyAmount: { type: Number, default: 0 }, // Fixed additional penalty if any
  currentPenalty: { type: Number, default: 0 }, // Accumulated late payment penalty

  // Payment details
  amountPaid: { type: Number, default: 0 }, // Amount paid so far
  remainingAmount: { type: Number }, // Remaining amount to be paid
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Paid', 'Overdue', 'Partially Paid'], // Bill status
    default: 'Pending',
  },
  paymentHistory: [
    {
      amount: Number,
      paymentDate: Date,
      paymentMethod: String,
      transactionId: String,
    },
  ],

}, { timestamps: true });

// Virtual field to calculate total due amount (base amount + additional charges + penalties - paid amount)
UtilityBillSchema.virtual('totalDue').get(function () {
  const extraCharges = this.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  return this.baseAmount + extraCharges + this.penaltyAmount + this.currentPenalty - this.amountPaid;
});

const UtilityBill = mongoose.models.UtilityBill || mongoose.model('UtilityBill', UtilityBillSchema);
export default UtilityBill;