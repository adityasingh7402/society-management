import connectToDatabase from "../../../lib/mongodb";
import BillHead from '../../../models/BillHead';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Validation functions
const validateBillHead = (data) => {
  const errors = {};

  // Required fields
  const requiredFields = ['societyId', 'code', 'name', 'category', 'subCategory', 'calculationType'];
  requiredFields.forEach(field => {
    if (!data[field]) {
      errors[field] = `${field} is required`;
    }
  });

  // Code format
  if (data.code && !/^[A-Z0-9-_]{3,10}$/.test(data.code)) {
    errors.code = 'Code must be 3-10 characters (A-Z, 0-9, -, _)';
  }

  // Category validation
  const validCategories = ['Maintenance', 'Utility', 'Amenity', 'Service', 'Other'];
  if (data.category && !validCategories.includes(data.category)) {
    errors.category = 'Invalid category';
  }

  // Subcategory validation
  const subCategories = {
    Utility: ['Water', 'Electricity', 'Gas', 'Internet', 'Cable', 'Telephone', 'Other'],
    Maintenance: ['Cleaning', 'Security', 'Gardening', 'Equipment', 'Repairs', 'Staff', 'Other'],
    Amenity: ['Gym', 'Swimming Pool', 'Club House', 'Sports', 'Park', 'Community Hall', 'Other'],
    Service: ['Pest Control', 'Plumbing', 'Electrical', 'Carpentry', 'Housekeeping', 'Other'],
    Other: [
      'Society Charges',
      'Platform Charges',
      'Transfer Charges',
      'NOC Charges',
      'Processing Fees',
      'Late Payment Charges',
      'Legal Charges',
      'Documentation Charges',
      'Administrative Charges',
      'Event Charges',
      'Miscellaneous'
    ]
  };

  if (data.category && data.subCategory && !subCategories[data.category]?.includes(data.subCategory)) {
    errors.subCategory = `Invalid subcategory for ${data.category}`;
  }

  // Calculation type validation
  const validCalculationTypes = ['Fixed', 'PerUnit', 'Formula', 'Custom'];
  if (data.calculationType && !validCalculationTypes.includes(data.calculationType)) {
    errors.calculationType = 'Invalid calculation type';
  }

  // Amount validation based on calculation type
  if (data.calculationType === 'Fixed' && (!data.fixedAmount || data.fixedAmount <= 0)) {
    errors.fixedAmount = 'Fixed amount must be greater than 0';
  }

  if (data.calculationType === 'PerUnit' && (!data.perUnitRate || data.perUnitRate <= 0)) {
    errors.perUnitRate = 'Per unit rate must be greater than 0';
  }

  if (data.calculationType === 'Formula' && !data.formula) {
    errors.formula = 'Formula is required for Formula calculation type';
  }

  // GST validation
  if (data.gstConfig?.isGSTApplicable) {
    const { cgstPercentage, sgstPercentage, igstPercentage } = data.gstConfig;
    
    if (cgstPercentage < 0 || cgstPercentage > 14) {
      errors.cgstPercentage = 'CGST must be between 0 and 14%';
    }
    if (sgstPercentage < 0 || sgstPercentage > 14) {
      errors.sgstPercentage = 'SGST must be between 0 and 14%';
    }
    if (igstPercentage < 0 || igstPercentage > 28) {
      errors.igstPercentage = 'IGST must be between 0 and 28%';
    }
  }

  // Late payment validation
  if (data.latePaymentConfig?.isLatePaymentChargeApplicable) {
    const { gracePeriodDays, chargeValue, chargeType } = data.latePaymentConfig;
    
    if (gracePeriodDays < 0) {
      errors.gracePeriodDays = 'Grace period days cannot be negative';
    }
    if (chargeValue < 0) {
      errors.chargeValue = 'Charge value cannot be negative';
    }
    if (!['Fixed', 'Percentage'].includes(chargeType)) {
      errors.chargeType = 'Invalid charge type';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Add this function after the validation functions
const createRequiredLedgers = async (societyId, category, subCategory, userId) => {
  const Ledger = mongoose.model('Ledger');
  const ledgers = {};

  try {
    // Generate unique codes based on category and subcategory
    const categoryCode = category.substring(0, 3).toUpperCase();
    const subCategoryCode = subCategory.substring(0, 3).toUpperCase();
    const ledgerCode = `${categoryCode}${subCategoryCode}`;

    // First try to find existing ledgers for this category and subcategory
    const existingIncomeLedger = await Ledger.findOne({
      societyId,
      billCategory: category,
      subCategory: subCategory,
      type: 'Income',
      category: 'Operating Income'
    });

    const existingReceivableLedger = await Ledger.findOne({
      societyId,
      billCategory: category,
      subCategory: subCategory,
      type: 'Asset',
      category: 'Receivable'
    });

    // Find or create GST ledger (common for all categories)
    const existingGSTLedger = await Ledger.findOne({
      societyId,
      code: 'GSTPAY',
      type: 'Liability',
      category: 'Current Liability'
    });

    // If income ledger doesn't exist, create it
    if (!existingIncomeLedger) {
      const incomeLedger = await Ledger.create({
        societyId,
        code: `${ledgerCode}INC`,
        name: `${category} - ${subCategory} Income`,
        description: `Income ledger for ${category} - ${subCategory} bills`,
        type: 'Income',
        category: 'Operating Income',
        billCategory: category,
        subCategory: subCategory,
        createdBy: userId,
        currentBalance: 0,
        openingBalance: 0,
        reconciliationStatus: 'Pending',
        status: 'Active',
        gstConfig: { isGSTApplicable: false },
        tdsConfig: { isTDSApplicable: false }
      });
      ledgers.incomeLedger = incomeLedger;
    } else {
      ledgers.incomeLedger = existingIncomeLedger;
    }

    // If receivable ledger doesn't exist, create it
    if (!existingReceivableLedger) {
      const receivableLedger = await Ledger.create({
        societyId,
        code: `${ledgerCode}REC`,
        name: `${category} - ${subCategory} Receivable`,
        description: `Receivable ledger for ${category} - ${subCategory} bills`,
        type: 'Asset',
        category: 'Receivable',
        billCategory: category,
        subCategory: subCategory,
        createdBy: userId,
        currentBalance: 0,
        openingBalance: 0,
        reconciliationStatus: 'Pending',
        status: 'Active',
        gstConfig: { isGSTApplicable: false },
        tdsConfig: { isTDSApplicable: false }
      });
      ledgers.receivableLedger = receivableLedger;
    } else {
      ledgers.receivableLedger = existingReceivableLedger;
    }

    // If GST ledger doesn't exist, create it
    if (!existingGSTLedger) {
      const gstLedger = await Ledger.create({
        societyId,
        code: 'GSTPAY',
        name: 'GST Payable',
        description: 'GST payable to government',
        type: 'Liability',
        category: 'Current Liability',
        createdBy: userId,
        currentBalance: 0,
        openingBalance: 0,
        reconciliationStatus: 'Pending',
        status: 'Active',
        gstConfig: { isGSTApplicable: false },
        tdsConfig: { isTDSApplicable: false }
      });
      ledgers.gstLedger = gstLedger;
    } else {
      ledgers.gstLedger = existingGSTLedger;
    }

    return ledgers;
  } catch (error) {
    console.error('Error creating ledgers:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    
    // Get user ID from token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { societyId, ...billHeadData } = req.body;

    // Create required ledgers first
    const ledgers = await createRequiredLedgers(societyId, billHeadData.category, billHeadData.subCategory, decoded.id);

    // Create the bill head with proper ledger references and createdBy
    const billHead = new BillHead({
      ...billHeadData,
      societyId,
      createdBy: decoded.id,
      accountingConfig: {
        incomeLedgerId: ledgers.incomeLedger._id,
        receivableLedgerId: ledgers.receivableLedger._id,
        gstLedgerId: ledgers.gstLedger._id
      }
    });

    await billHead.save();
    return res.status(201).json({ message: 'Bill head created successfully', data: billHead });
  } catch (error) {
    console.error('Error in create-bill-head:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 