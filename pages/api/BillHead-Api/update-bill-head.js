import connectToDatabase from "../../../lib/mongodb";
import BillHead from '../../../models/BillHead';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { billHeadId } = req.query;
    const updateData = req.body;

    // Validate required fields
    if (!billHeadId) {
      return res.status(400).json({ message: 'Bill head ID is required' });
    }

    // Check if bill head exists
    const existingBillHead = await BillHead.findById(billHeadId);
    if (!existingBillHead) {
      return res.status(404).json({ message: 'Bill head not found' });
    }

    // If code is being updated, check for duplicates
    if (updateData.code && updateData.code !== existingBillHead.code) {
      const duplicateCode = await BillHead.findOne({
        societyId: existingBillHead.societyId,
        code: updateData.code.toUpperCase(),
        _id: { $ne: billHeadId }
      });

      if (duplicateCode) {
        return res.status(400).json({ message: 'Bill head code already exists' });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Validate tax-related fields
    if (updateData.isTaxable && (!updateData.sacHsnCode || !updateData.gstType)) {
      return res.status(400).json({ message: 'SAC/HSN code and GST type are required for taxable items' });
    }

    // Validate meter config if applicable
    if (updateData.calculationType === 'MeterBased' && 
        (!updateData.meterConfig || !updateData.meterConfig.unitName || !updateData.meterConfig.ratePerUnit)) {
      return res.status(400).json({ message: 'Meter configuration is incomplete' });
    }

    // Validate category if being updated
    if (updateData.category && !['Maintenance', 'Utility', 'Amenity', 'Sinking', 'Repair', 'Other'].includes(updateData.category)) {
      return res.status(400).json({ message: 'Invalid category value' });
    }

    // Update bill head
    const updatedBillHead = await BillHead.findByIdAndUpdate(
      billHeadId,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({
      message: 'Bill head updated successfully',
      data: updatedBillHead
    });

  } catch (error) {
    console.error('Error updating bill head:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 