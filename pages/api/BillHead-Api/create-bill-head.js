import connectToDatabase from "../../../lib/mongodb";
import BillHead from '../../../models/BillHead';
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
    if (!decoded) {
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
      gstApplicable,
      cgstPercentage,
      sgstPercentage,
      igstPercentage,
      latePaymentConfig,
      ledgerId
    } = req.body;

    // Validate required fields
    if (!societyId || !code || !name || !category || !calculationType) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['societyId', 'code', 'name', 'category', 'calculationType']
      });
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

    // Validate GST percentages if applicable
    if (gstApplicable) {
      const totalGST = (cgstPercentage || 0) + (sgstPercentage || 0) + (igstPercentage || 0);
      if (totalGST <= 0 || totalGST > 28) {
        return res.status(400).json({ 
          message: 'Invalid GST percentages. Total GST must be between 0 and 28%'
        });
      }
    }

    // Create bill head
    const billHead = await BillHead.create({
      societyId,
      code: code.toUpperCase(),
      name,
      category,
      description,
      calculationType,
      fixedAmount,
      perUnitRate,
      formula,
      gstConfig: {
        isGSTApplicable: gstApplicable || false,
        cgstPercentage: cgstPercentage || 0,
        sgstPercentage: sgstPercentage || 0,
        igstPercentage: igstPercentage || 0
      },
      latePaymentConfig: latePaymentConfig || {
        isLatePaymentChargeApplicable: false,
        gracePeriodDays: 0,
        chargeType: 'Fixed',
        chargeValue: 0,
        compoundingFrequency: 'Monthly'
      },
      ledgerId,
      status: 'Active',
      createdBy: decoded.userId
    });

    return res.status(200).json({
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