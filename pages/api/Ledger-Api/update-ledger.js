import connectToDatabase from "../../../lib/mongodb";
import Ledger from '../../../models/Ledger';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token' });
    }

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

    // Validate bill category and subcategory
    if (updateData.category === 'Operating Income' || 
        (updateData.category === 'Receivable' && updateData.type === 'Asset') ||
        (existingLedger.category === 'Operating Income') ||
        (existingLedger.category === 'Receivable' && existingLedger.type === 'Asset')) {
      
      const billCategory = updateData.billCategory || existingLedger.billCategory;
      if (!billCategory) {
        return res.status(400).json({ message: 'Bill category is required for income and receivable ledgers' });
      }

      if ((billCategory === 'Utility' || billCategory === 'Maintenance')) {
        const subCategory = updateData.subCategory || existingLedger.subCategory;
        if (!subCategory) {
          return res.status(400).json({ message: 'Subcategory is required for utility and maintenance ledgers' });
        }
      }
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
          updatedBy: decoded.id,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Ledger updated successfully',
      data: updatedLedger
    });

  } catch (error) {
    console.error('Error updating ledger:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
} 