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
      residents,
      billType,
      description,
      amount,
      issueDate,
      dueDate,
      finePerDay,
      additionalCharges = []
    } = req.body;

    console.log('societyId', societyId)
    console.log('residents', residents)
    console.log('billType', billType)
    console.log('description', description)
    console.log('amount', amount)
    console.log('issueDate', issueDate)
    console.log('dueDate', dueDate)
    console.log('finePerDay', finePerDay)
    console.log('additionalCharges', additionalCharges)

    if (!societyId || !residents || !Array.isArray(residents) || residents.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Society ID and at least one resident are required' 
      });
    }

    if (!billType || !amount || !dueDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bill type, amount, and due date are required' 
      });
    }

    // Calculate the total additional charges
    const totalAdditionalCharges = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    
    // Create bills for each resident
    const createdBills = [];
    const failedBills = [];

    for (const resident of residents) {
      try {
        const {
          _id: residentId,
          name: ownerName,
          phone: ownerMobile,
          email: ownerEmail,
          flatDetails
        } = resident;

        if (!flatDetails || !flatDetails.flatNumber) {
          failedBills.push({ residentId, reason: 'Missing flat details' });
          continue;
        }

        // Parse flat number to get block and floor
        const flatParts = flatDetails.flatNumber.split('-');
        if (flatParts.length !== 2) {
          failedBills.push({ residentId, reason: 'Invalid flat number format' });
          continue;
        }

        const blockName = flatParts[0];
        const flatNumber = flatDetails.flatNumber;
        const floorNumber = flatParts[1].charAt(0); // First digit of flat number is floor

        const newBill = new MaintenanceBill({
          societyId,
          flatId: flatDetails.flatId || null,
          flatNumber,
          blockName,
          floorNumber,
          residentId,
          ownerName,
          ownerMobile,
          ownerEmail,
          billType,
          description,
          amount: parseFloat(amount),
          additionalCharges,
          issueDate: issueDate || new Date().toISOString().split('T')[0],
          dueDate,
          finePerDay: parseFloat(finePerDay),
          penaltyAmount: 0,
          remainingAmount: parseFloat(amount) + totalAdditionalCharges
        });

        await newBill.save();
        createdBills.push(newBill);
      } catch (error) {
        console.error(`Error creating bill for resident ${resident._id}:`, error);
        failedBills.push({ 
          residentId: resident._id, 
          reason: error.message || 'Unknown error' 
        });
      }
    }

    res.status(201).json({ 
      success: true, 
      message: `Successfully created ${createdBills.length} bills`,
      totalCreated: createdBills.length,
      totalFailed: failedBills.length,
      failedBills
    });
  } catch (error) {
    console.error('Error generating bulk bills:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate bulk bills', 
      error: error.message 
    });
  }
}