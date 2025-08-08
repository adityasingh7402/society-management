import connectToDatabase from "../../../lib/mongodb";
import ScheduledBill from '../../../models/ScheduledBill';
import BillHead from '../../../models/BillHead';
import jwt from 'jsonwebtoken';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      await logFailure('SCHEDULED_BILL_CREATE', req, 'No authorization token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      await logFailure('SCHEDULED_BILL_CREATE', req, 'Invalid authorization token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { societyId, ...scheduledBillData } = req.body;

    // Verify bill head exists and get its details
    const billHead = await BillHead.findById(scheduledBillData.billHeadId);
    if (!billHead) {
      await logFailure('SCHEDULED_BILL_CREATE', req, 'Bill head not found', {
        billHeadId: scheduledBillData.billHeadId,
        title: scheduledBillData.title
      });
      return res.status(404).json({ error: 'Bill head not found' });
    }

    // Set initial next generation date
    const startDate = new Date(scheduledBillData.startDate);
    let nextGenerationDate = startDate;
    if (startDate < new Date()) {
      // If start date is in the past, calculate next generation date from today
      const tempBill = new ScheduledBill({
        ...scheduledBillData,
        nextGenerationDate: startDate
      });
      nextGenerationDate = tempBill.calculateNextGenerationDate();
    }

    // Get late payment config from bill head if not provided
    const latePaymentConfig = scheduledBillData.latePaymentConfig || {
      isLatePaymentChargeApplicable: billHead.latePaymentConfig?.isLatePaymentChargeApplicable || false,
      gracePeriodDays: billHead.latePaymentConfig?.gracePeriodDays || 0,
      chargeType: billHead.latePaymentConfig?.chargeType || 'Fixed',
      chargeValue: billHead.latePaymentConfig?.chargeValue || 0,
      compoundingFrequency: billHead.latePaymentConfig?.compoundingFrequency || 'Monthly'
    };

    // Store bill head details
    const billHeadDetails = {
      _id: billHead._id,  // Store the original billHead _id
      code: billHead.code,
      name: billHead.name,
      category: billHead.category,
      subCategory: billHead.subCategory,
      calculationType: billHead.calculationType,
      perUnitRate: billHead.perUnitRate,
      fixedAmount: billHead.fixedAmount,
      formula: billHead.formula
    };

    // Create the scheduled bill
    const scheduledBill = new ScheduledBill({
      ...scheduledBillData,
      societyId,
      nextGenerationDate,
      latePaymentConfig,
      billHeadDetails,
      createdBy: decoded.id,
      approvedBy: {
        adminId: decoded.id,
        adminName: decoded.name || 'Admin',
        approvedAt: new Date()
      }
    });

    await scheduledBill.save();

    // Log successful creation
    await logSuccess('SCHEDULED_BILL_CREATE', req, {
      scheduledBillId: scheduledBill._id,
      title: scheduledBill.title,
      billHeadName: billHead.name,
      billHeadCode: billHead.code,
      frequency: scheduledBill.frequency,
      totalAmount: scheduledBill.totalAmount,
      residentCount: scheduledBill.selectedResidents?.length || 0,
      additionalChargesCount: scheduledBill.additionalCharges?.length || 0,
      startDate: scheduledBill.startDate,
      endDate: scheduledBill.endDate
    }, scheduledBill._id, 'ScheduledBill');

    return res.status(201).json({
      message: 'Scheduled bill created successfully',
      data: scheduledBill
    });

  } catch (error) {
    console.error('Error in create-scheduled-bill:', error);
    
    // Log the failure
    await logFailure('SCHEDULED_BILL_CREATE', req, error.message, {
      title: req.body?.title,
      billHeadId: req.body?.billHeadId,
      frequency: req.body?.frequency,
      errorType: error.name
    });
    
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 