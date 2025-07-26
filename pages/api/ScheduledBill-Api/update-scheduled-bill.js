import connectToDatabase from "../../../lib/mongodb";
import ScheduledBill from '../../../models/ScheduledBill';
import BillHead from '../../../models/BillHead';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id, societyId } = req.query;
    if (!societyId) {
      return res.status(400).json({ error: 'Society ID is required' });
    }

    const updateData = req.body;

    // Verify bill head exists if it's being updated
    if (updateData.billHeadId) {
      const billHead = await BillHead.findById(updateData.billHeadId);
      if (!billHead) {
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

    return res.status(200).json({
      message: 'Scheduled bill updated successfully',
      data: scheduledBill
    });

  } catch (error) {
    console.error('Error in update-scheduled-bill:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 