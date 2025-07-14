import connectToDatabase from "../../../lib/mongodb";
import Ledger from '../../../models/Ledger';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const {
      societyId,
      code,
      name,
      description,
      type,
      category,
      billCategory,
      subCategory,
      openingBalance,
      balanceType,
      bankDetails,
      gstConfig,
      tdsConfig,
      reconciliation,
      isControlled,
      controlLimit
    } = req.body;

    // Validate required fields
    if (!societyId || !code || !name || !type || !category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check for duplicate code
    const existingLedger = await Ledger.findOne({
      societyId,
      code: code.toUpperCase()
    });

    if (existingLedger) {
      return res.status(400).json({ message: 'Ledger code already exists' });
    }

    // Validate bill category and subcategory
    if (category === 'Operating Income' || (category === 'Receivable' && type === 'Asset')) {
      if (!billCategory) {
        return res.status(400).json({ message: 'Bill category is required for income and receivable ledgers' });
      }

      if ((billCategory === 'Utility' || billCategory === 'Maintenance') && !subCategory) {
        return res.status(400).json({ message: 'Subcategory is required for utility and maintenance ledgers' });
      }
    }

    // Validate bank details if provided
    if (category === 'Bank' && (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode)) {
      return res.status(400).json({ message: 'Bank account details are required for bank ledgers' });
    }

    // Validate GST details if applicable
    if (gstConfig?.isGSTApplicable && !gstConfig.gstNumber) {
      return res.status(400).json({ message: 'GST number is required when GST is applicable' });
    }

    // Create ledger object
    const ledgerData = {
      societyId,
      code: code.toUpperCase(),
      name,
      description,
      type,
      category,
      billCategory,
      subCategory,
      openingBalance: openingBalance || 0,
      balanceType: balanceType || 'Debit',
      currentBalance: openingBalance || 0,
      bankDetails,
      gstConfig,
      tdsConfig,
      reconciliation,
      isControlled: isControlled || false,
      controlLimit,
      status: 'Active',
      createdBy: decoded.id
    };

    // Create new ledger
    const ledger = new Ledger(ledgerData);

    // Save to database
    await ledger.save();

    res.status(201).json({
      message: 'Ledger created successfully',
      data: ledger
    });

  } catch (error) {
    console.error('Error creating ledger:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
} 