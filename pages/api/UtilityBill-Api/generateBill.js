import UtilityBill from '../../../models/UtilityBill';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const {
      societyId,
      flatNumber,
      blockName,
      floorNumber,
      residentId,
      ownerName,
      ownerMobile,
      ownerEmail,
      utilityType,
      description,
      unitUsage,
      perUnitRate,
      baseAmount,
      additionalCharges,
      issueDate,
      dueDate,
      finePerDay,
      penaltyAmount,
      status
    } = req.body;

    // Calculate the total amount from additional charges
    const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + parseFloat(charge.amount), 0);
    const totalAmount = baseAmount + additionalChargesTotal + (penaltyAmount || 0);

    const newBill = new UtilityBill({
      societyId,
      flatNumber,
      blockName,
      floorNumber,
      residentId,
      ownerName,
      ownerMobile,
      ownerEmail,
      utilityType,
      description,
      unitUsage,
      perUnitRate,
      baseAmount,
      additionalCharges,
      totalAmount,
      remainingAmount: totalAmount, // Initially, remaining amount equals total amount
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      finePerDay: finePerDay || 50,
      penaltyAmount: penaltyAmount || 0,
      status: status || 'Pending'
    });

    await newBill.save();
    res.status(201).json({ success: true, bill: newBill });
  } catch (error) {
    console.error('Error generating bill:', error);
    res.status(500).json({ message: 'Failed to generate bill', error: error.message });
  }
}