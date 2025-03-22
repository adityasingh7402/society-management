import MaintenanceBill from '../../../models/MaintenanceBill';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const {
      societyId,
      flatId,
      flatNumber,
      blockName,
      floorNumber,
      residentId,
      ownerName,
      ownerMobile,
      ownerEmail,
      billType,
      description,
      amount,
      additionalCharges,
      issueDate,
      dueDate,
      finePerDay,
      penaltyAmount
    } = req.body;

    // Calculate the remaining amount
    const totalAdditionalCharges = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const remainingAmount = amount + totalAdditionalCharges + penaltyAmount;

    const newBill = new MaintenanceBill({
      societyId,
      flatId,
      flatNumber,
      blockName,
      floorNumber,
      residentId,
      ownerName,
      ownerMobile,
      ownerEmail,
      billType,
      description,
      amount,
      additionalCharges,
      issueDate,
      dueDate,
      finePerDay,
      penaltyAmount,
      remainingAmount
    });

    await newBill.save();
    res.status(201).json({ success: true, bill: newBill });
  } catch (error) {
    console.error('Error generating bill:', error);
    res.status(500).json({ message: 'Failed to generate bill', error: error.message });
  }
}