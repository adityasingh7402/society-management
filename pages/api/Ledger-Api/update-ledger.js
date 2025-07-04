import connectToDatabase from "../../../lib/mongodb";
import Ledger from '../../../models/Ledger';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { ledgerId } = req.query;
    const updateData = req.body;

    // Validate required fields
    if (!ledgerId) {
      return res.status(400).json({ message: 'Ledger ID is required' });
    }

    // Check if ledger exists
    const existingLedger = await Ledger.findById(ledgerId);
    if (!existingLedger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }

    // If code is being updated, check for duplicates
    if (updateData.code && updateData.code !== existingLedger.code) {
      const duplicateCode = await Ledger.findOne({
        societyId: existingLedger.societyId,
        code: updateData.code.toUpperCase(),
        _id: { $ne: ledgerId }
      });

      if (duplicateCode) {
        return res.status(400).json({ message: 'Ledger code already exists' });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Validate bank details if category is Bank
    if (updateData.category === 'Bank') {
      const bankDetails = updateData.bankDetails || existingLedger.bankDetails;
      if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode) {
        return res.status(400).json({ message: 'Bank account details are required for bank ledgers' });
      }
    }

    // Validate GST details if applicable
    if (updateData.gstConfig?.isGSTApplicable && !updateData.gstConfig.gstNumber && !existingLedger.gstConfig?.gstNumber) {
      return res.status(400).json({ message: 'GST number is required when GST is applicable' });
    }

    // Update ledger
    const updatedLedger = await Ledger.findByIdAndUpdate(
      ledgerId,
      {
        $set: {
          ...updateData,
          modifiedAt: new Date()
        }
      },
      { new: true }
    );

    res.status(200).json({
      message: 'Ledger updated successfully',
      data: updatedLedger
    });

  } catch (error) {
    console.error('Error updating ledger:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 