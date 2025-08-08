import connectToDatabase from "../../../lib/mongodb";
import ScheduledBill from '../../../models/ScheduledBill';
import BillHead from '../../../models/BillHead';
import jwt from 'jsonwebtoken';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      await logFailure('SCHEDULED_BILL_UPDATE', req, 'No authorization token provided', { scheduledBillId: req.query?.id });
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      await logFailure('SCHEDULED_BILL_UPDATE', req, 'Invalid authorization token', { scheduledBillId: req.query?.id });
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id, societyId } = req.query;
    if (!societyId) {
      await logFailure('SCHEDULED_BILL_UPDATE', req, 'Society ID is required', { scheduledBillId: id });
      return res.status(400).json({ error: 'Society ID is required' });
    }

    const updateData = req.body;

    // Verify bill head exists if it's being updated
    if (updateData.billHeadId) {
      const billHead = await BillHead.findById(updateData.billHeadId);
      if (!billHead) {
        await logFailure('SCHEDULED_BILL_UPDATE', req, 'Bill head not found', {
          scheduledBillId: id,
          billHeadId: updateData.billHeadId
        });
        return res.status(404).json({ error: 'Bill head not found' });
      }

      // Update bill head details
      updateData.billHeadDetails = {
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

      // Update late payment config from bill head if not provided
      if (!updateData.latePaymentConfig) {
        updateData.latePaymentConfig = {
          isLatePaymentChargeApplicable: billHead.latePaymentConfig?.isLatePaymentChargeApplicable || false,
          gracePeriodDays: billHead.latePaymentConfig?.gracePeriodDays || 0,
          chargeType: billHead.latePaymentConfig?.chargeType || 'Fixed',
          chargeValue: billHead.latePaymentConfig?.chargeValue || 0,
          compoundingFrequency: billHead.latePaymentConfig?.compoundingFrequency || 'Monthly'
        };
      }
    }

    // Find and update the scheduled bill
    const scheduledBill = await ScheduledBill.findOneAndUpdate(
      { _id: id, societyId },
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!scheduledBill) {
      await logFailure('SCHEDULED_BILL_UPDATE', req, 'Scheduled bill not found or permission denied', {
        scheduledBillId: id,
        societyId: societyId
      });
      return res.status(404).json({ error: 'Scheduled bill not found' });
    }

    // Recalculate next generation date if frequency or dates changed
    if (
      updateData.frequency ||
      updateData.customFrequencyDays ||
      updateData.startDate ||
      updateData.status
    ) {
      scheduledBill.nextGenerationDate = scheduledBill.calculateNextGenerationDate();
      await scheduledBill.save();
    }

    // Log successful update
    await logSuccess('SCHEDULED_BILL_UPDATE', req, {
      scheduledBillId: scheduledBill._id,
      title: scheduledBill.title,
      frequency: scheduledBill.frequency,
      totalAmount: scheduledBill.totalAmount,
      residentCount: scheduledBill.selectedResidents?.length || 0,
      additionalChargesCount: scheduledBill.additionalCharges?.length || 0,
      hasFrequencyChange: !!(updateData.frequency || updateData.customFrequencyDays),
      hasDateChange: !!(updateData.startDate || updateData.endDate),
      hasStatusChange: !!updateData.status
    }, scheduledBill._id, 'ScheduledBill');

    return res.status(200).json({
      message: 'Scheduled bill updated successfully',
      data: scheduledBill
    });

  } catch (error) {
    console.error('Error in update-scheduled-bill:', error);
    
    // Log the failure
    await logFailure('SCHEDULED_BILL_UPDATE', req, error.message, {
      scheduledBillId: req.query?.id,
      societyId: req.query?.societyId,
      title: req.body?.title,
      errorType: error.name
    });
    
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 