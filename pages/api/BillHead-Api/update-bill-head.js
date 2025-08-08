import connectToDatabase from "../../../lib/mongodb";
import BillHead from '../../../models/BillHead';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { logSuccess, logFailure } from '../../../services/loggingService';

// Add the createRequiredLedgers function from create-bill-head.js
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
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let session;
  try {
    await connectToDatabase();
    session = await mongoose.startSession();
    session.startTransaction();

    // Get user ID from token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      await logFailure('BILLHEAD_UPDATE', req, 'No authorization token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      await logFailure('BILLHEAD_UPDATE', req, 'Invalid authorization token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { billHeadId } = req.query;
    const updateData = req.body;

    // Validate required fields
    if (!billHeadId) {
      await logFailure('BILLHEAD_UPDATE', req, 'Missing billHeadId parameter', { billHeadId });
      return res.status(400).json({ message: 'Bill head ID is required' });
    }

    // Check if bill head exists
    const existingBillHead = await BillHead.findById(billHeadId).session(session);
    if (!existingBillHead) {
      await logFailure('BILLHEAD_UPDATE', req, 'Bill head not found', { billHeadId });
      return res.status(404).json({ message: 'Bill head not found' });
    }

    // If code is being updated, check for duplicates
    if (updateData.code && updateData.code !== existingBillHead.code) {
      const duplicateCode = await BillHead.findOne({
        societyId: existingBillHead.societyId,
        code: updateData.code.toUpperCase(),
        _id: { $ne: billHeadId }
      }).session(session);

      if (duplicateCode) {
        await logFailure('BILLHEAD_UPDATE', req, 'Duplicate bill head code', {
          billHeadId,
          newCode: updateData.code,
          existingCode: existingBillHead.code,
          duplicateId: duplicateCode._id
        });
        return res.status(400).json({ message: 'Bill head code already exists' });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Track changes for logging
    const changes = {};
    const oldValues = {};
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== existingBillHead[key]) {
        changes[key] = updateData[key];
        oldValues[key] = existingBillHead[key];
      }
    });

    // Check if category or subcategory is being updated
    let newLedgers = null;
    if ((updateData.category && updateData.category !== existingBillHead.category) ||
        (updateData.subCategory && updateData.subCategory !== existingBillHead.subCategory)) {
      
      // Create new ledgers for the updated category/subcategory
      newLedgers = await createRequiredLedgers(
        existingBillHead.societyId,
        updateData.category || existingBillHead.category,
        updateData.subCategory || existingBillHead.subCategory,
        decoded.id
      );

      // Update the accounting config with new ledger IDs
      updateData.accountingConfig = {
        incomeLedgerId: newLedgers.incomeLedger._id,
        receivableLedgerId: newLedgers.receivableLedger._id,
        gstLedgerId: newLedgers.gstLedger._id
      };
    }

    // Update bill head
    const updatedBillHead = await BillHead.findByIdAndUpdate(
      billHeadId,
      { 
        $set: {
          ...updateData,
          updatedBy: decoded.id,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction();

    // Log successful update
    await logSuccess('BILLHEAD_UPDATE', req, {
      billHeadId: updatedBillHead._id,
      code: updatedBillHead.code,
      name: updatedBillHead.name,
      category: updatedBillHead.category,
      subCategory: updatedBillHead.subCategory,
      calculationType: updatedBillHead.calculationType,
      status: updatedBillHead.status,
      changes,
      oldValues,
      newLedgersCreated: newLedgers ? {
        income: newLedgers.incomeLedger.name,
        receivable: newLedgers.receivableLedger.name,
        gst: newLedgers.gstLedger.name
      } : null
    }, updatedBillHead._id, 'BillHead');

    res.status(200).json({
      message: 'Bill head updated successfully',
      data: updatedBillHead
    });

  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    console.error('Error updating bill head:', error);
    
    // Log the failure
    await logFailure('BILLHEAD_UPDATE', req, error.message, {
      billHeadId: req.query?.billHeadId,
      updateData: req.body,
      errorType: error.name,
      hasToken: !!req.headers.authorization
    });
    
    res.status(500).json({ message: 'Internal server error', error: error.message });
  } finally {
    if (session) {
      session.endSession();
    }
  }
} 