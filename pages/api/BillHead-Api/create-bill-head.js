import connectToDatabase from "../../../lib/mongodb";
import BillHead from '../../../models/BillHead';
import Society from '../../../models/Society';
import Ledger from '../../../models/Ledger';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
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
      category,
      description,
      calculationType,
      fixedAmount,
      perUnitRate,
      formula,
      gstConfig,
      latePaymentConfig,
      accountingConfig
    } = req.body;

    // Validate required fields
    if (!societyId || !code || !name || !category || !calculationType) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['societyId', 'code', 'name', 'category', 'calculationType']
      });
    }

    // Find society by societyId string
    const society = await Society.findOne({ societyId });
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }

    // Find or create default ledgers if not provided
    let incomeLedger, receivableLedger;

    // Handle income ledger
    if (!accountingConfig?.incomeLedgerId) {
      incomeLedger = await Ledger.findOne({ 
        societyId: society._id,
        code: 'INC001',
        name: 'Income Account'
      });
      
      if (!incomeLedger) {
        incomeLedger = await Ledger.create({
          societyId: society._id,
          code: 'INC001',
          name: 'Income Account',
          type: 'Income',
          category: 'Operating Income', // Updated to use correct enum value
          balanceType: 'Credit',
          openingBalance: 0,
          createdBy: decoded.id
        });
      }
    }

    // Handle receivable ledger
    if (!accountingConfig?.receivableLedgerId) {
      receivableLedger = await Ledger.findOne({
        societyId: society._id,
        code: 'REC001',
        name: 'Receivables Account'
      });

      if (!receivableLedger) {
        receivableLedger = await Ledger.create({
          societyId: society._id,
          code: 'REC001',
          name: 'Receivables Account',
          type: 'Asset',
          category: 'Receivable', // Updated to use correct enum value
          balanceType: 'Debit',
          openingBalance: 0,
          createdBy: decoded.id
        });
      }
    }

    // Validate calculation type specific fields
    switch (calculationType) {
      case 'Fixed':
        if (typeof fixedAmount !== 'number' || fixedAmount <= 0) {
          return res.status(400).json({ 
            message: 'Fixed amount is required and must be greater than 0'
          });
        }
        break;
      case 'PerUnit':
        if (typeof perUnitRate !== 'number' || perUnitRate <= 0) {
          return res.status(400).json({ 
            message: 'Per unit rate is required and must be greater than 0'
          });
        }
        break;
      case 'Formula':
        if (!formula || typeof formula !== 'string') {
          return res.status(400).json({ 
            message: 'Formula is required for formula-based calculation'
          });
        }
        break;
    }

    // Create bill head
    const billHead = await BillHead.create({
      societyId: society._id,
      code: code.toUpperCase(),
      name,
      category,
      description,
      calculationType,
      fixedAmount,
      perUnitRate,
      formula,
      gstConfig: gstConfig || {
        isGSTApplicable: false,
        cgstPercentage: 0,
        sgstPercentage: 0,
        igstPercentage: 0
      },
      latePaymentConfig: latePaymentConfig || {
        isLatePaymentChargeApplicable: false,
        gracePeriodDays: 0,
        chargeType: 'Fixed',
        chargeValue: 0,
        compoundingFrequency: 'Monthly'
      },
      accountingConfig: {
        incomeLedgerId: accountingConfig?.incomeLedgerId || incomeLedger._id,
        receivableLedgerId: accountingConfig?.receivableLedgerId || receivableLedger._id
      },
      status: 'Active',
      createdBy: decoded.id
    });

    return res.status(201).json({
      message: 'Bill head created successfully',
      data: billHead
    });

  } catch (error) {
    console.error('Error creating bill head:', error);
    return res.status(500).json({ 
      message: 'Error creating bill head',
      error: error.message
    });
  }
} 