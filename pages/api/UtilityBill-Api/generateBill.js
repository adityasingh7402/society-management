import connectToDatabase from "../../../lib/mongodb";
import UtilityBill from '../../../models/UtilityBill';
import BillHead from '../../../models/BillHead';
import Ledger from '../../../models/Ledger';
import JournalVoucher from '../../../models/JournalVoucher';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let session;
  let retryCount = 0;
  const MAX_RETRIES = 3;

  async function attemptBillGeneration() {
    try {
      // Start a new session for each attempt
      if (session) {
        await session.endSession();
      }
      session = await mongoose.startSession();
      session.startTransaction();

      await connectToDatabase();
    
      // Verify token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('Request Body:', req.body);  // Debug log
    console.log('Additional:', req.body.additionalCharges);
    // Extract admin details from token
    const adminId = decoded.id;
    const adminName = decoded.name || 'Admin'; // Fallback if name is not in token

    const {
      societyId,
        billHeadId,
      residentId,
      flatNumber,
      blockName,
      floorNumber,
      ownerName,
      ownerMobile,
      ownerEmail,
      unitUsage,
      periodType,
      baseAmount: requestedBaseAmount,
      gstDetails: requestedGstDetails,
      additionalCharges,
      totalAmount: requestedTotalAmount,
      issueDate,
      dueDate
    } = req.body;

      // Validate required fields
      if (!societyId || !billHeadId || !flatNumber || !blockName || !floorNumber || !residentId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get bill head details
      const billHead = await BillHead.findById(billHeadId).session(session);
    if (!billHead) {
        return res.status(404).json({ error: 'Bill head not found' });
    }

      // Get required ledgers
      const incomeLedger = await Ledger.findById(billHead.accountingConfig.incomeLedgerId).session(session);
      if (!incomeLedger) {
        return res.status(400).json({ message: 'Income ledger not found' });
      }

      const receivableLedger = await Ledger.findById(billHead.accountingConfig.receivableLedgerId).session(session);
      if (!receivableLedger) {
        return res.status(400).json({ message: 'Receivable ledger not found' });
    }

      // Calculate or use provided base amount
      const calculatedBaseAmount = requestedBaseAmount ?? (() => {
    switch (billHead.calculationType) {
      case 'Fixed':
            return billHead.fixedAmount;
      case 'PerUnit':
            return unitUsage * billHead.perUnitRate;
      case 'Formula':
        // Implement formula calculation if needed
            return 0;
      default:
            throw new Error('Invalid calculation type');
    }
      })();

      // Calculate or use provided GST details
      const calculatedGstDetails = requestedGstDetails ?? (() => {
        const details = {
      isGSTApplicable: billHead.gstConfig.isGSTApplicable,
      cgstPercentage: billHead.gstConfig.cgstPercentage,
      sgstPercentage: billHead.gstConfig.sgstPercentage,
      igstPercentage: billHead.gstConfig.igstPercentage,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0
    };

        if (details.isGSTApplicable) {
          details.cgstAmount = (calculatedBaseAmount * details.cgstPercentage) / 100;
          details.sgstAmount = (calculatedBaseAmount * details.sgstPercentage) / 100;
          details.igstAmount = (calculatedBaseAmount * details.igstPercentage) / 100;
        }

        return details;
      })();

      // Get GST ledger if needed
    let gstLedger;
      if (calculatedGstDetails.isGSTApplicable && !requestedGstDetails) {
      gstLedger = await Ledger.findById(billHead.accountingConfig.gstLedgerId).session(session);
      if (!gstLedger) {
        return res.status(400).json({ message: 'GST ledger not found. Please configure it in bill head settings.' });
      }
    }

      // Calculate final total amount
      const calculatedTotalAmount = requestedTotalAmount ?? (
        calculatedBaseAmount +
        calculatedGstDetails.cgstAmount +
        calculatedGstDetails.sgstAmount +
        calculatedGstDetails.igstAmount
      );

    // Create utility bill
    console.log('Creating utility bill with data:', {
      societyId,
      billHeadId,
      residentId,
      flatNumber,
      blockName,
      floorNumber,
      ownerName,
      ownerMobile,
      ownerEmail,
      unitUsage,
      periodType,
      baseAmount: calculatedBaseAmount,
      gstDetails: calculatedGstDetails,
      additionalCharges,
      totalAmount: calculatedTotalAmount,
    });

    const utilityBill = new UtilityBill({
      societyId,
      billHeadId,
      residentId,
      flatNumber,
      blockName,
      floorNumber,
      ownerName,
      ownerMobile,
      ownerEmail,
      unitUsage,
      periodType: periodType || 'Monthly',  // Ensure periodType is set with default
      baseAmount: calculatedBaseAmount,
      gstDetails: calculatedGstDetails,
      additionalCharges,
      totalAmount: calculatedTotalAmount,
        issueDate,
        dueDate,
      createdBy: decoded.id,
      approvedBy: {
          adminId: decoded.id,
          adminName: decoded.name || 'Admin',
        approvedAt: new Date()
      }
    });

    // Generate bill number
    utilityBill.billNumber = await utilityBill.generateBillNumber();

      // Create journal voucher
    const journalVoucher = new JournalVoucher({
      societyId,
        voucherType: 'Journal',
      voucherDate: new Date(),
      referenceType: 'Bill',
      referenceId: utilityBill._id, 
      referenceNumber: utilityBill.billNumber,
        category: 'Utility',
      subCategory: billHead.subCategory,
      narration: `Bill generated for ${billHead.name} - ${utilityBill.billNumber}`,
        entries: [],  // Initialize empty entries array
      gstDetails: {
        isGSTApplicable: billHead.gstConfig.isGSTApplicable,
          gstType: 'Regular',
          gstMonth: new Date(),
        gstEntries: []
      },
      status: 'Active',
      approvalStatus: 'Approved',
      approvalWorkflow: [{
        action: 'Created',
        userId: decoded.id,
        remarks: 'Auto-approved on bill generation',
        timestamp: new Date()
      }],
      createdBy: decoded.id,
      tags: [`${billHead.category}`, `${billHead.subCategory}`],
      approvedBy: {
        adminId: adminId,
        adminName: adminName,
        approvedAt: new Date()
      }
    });

      // Calculate total amount including all charges
      let totalBillAmount = calculatedBaseAmount;
      
      // Add main bill entries
      journalVoucher.entries.push({
        ledgerId: receivableLedger._id,
        type: 'debit',
        amount: calculatedTotalAmount, // This will be updated after all calculations
        description: `Bill for ${billHead.name}`
      });

      journalVoucher.entries.push({
        ledgerId: incomeLedger._id,
        type: 'credit',
        amount: calculatedBaseAmount,
        description: `Bill for ${billHead.name}`
      });

    // Add GST entries if applicable
    if (billHead.gstConfig.isGSTApplicable && calculatedGstDetails.isGSTApplicable) {
      // Only try to get GST ledger if we actually have GST amounts
      const hasGstAmounts = calculatedGstDetails.cgstAmount > 0 || 
                           calculatedGstDetails.sgstAmount > 0 || 
                           calculatedGstDetails.igstAmount > 0;
      
      if (hasGstAmounts) {
        if (!gstLedger) {
          gstLedger = await Ledger.findById(billHead.accountingConfig.gstLedgerId).session(session);
      if (!gstLedger) {
            return res.status(400).json({ 
              error: 'GST ledger not found. Please configure GST ledger in bill head settings or disable GST for this bill.' 
            });
          }
        }
      }

      // Add CGST entry
      if (calculatedGstDetails.cgstAmount > 0) {
          journalVoucher.entries.push({
          ledgerId: gstLedger._id,
          type: 'credit',
          amount: calculatedGstDetails.cgstAmount,
          description: `CGST (${calculatedGstDetails.cgstPercentage}%) for ${billHead.name}`
          });
          totalBillAmount += calculatedGstDetails.cgstAmount;
      }

      // Add SGST entry
      if (calculatedGstDetails.sgstAmount > 0) {
          journalVoucher.entries.push({
          ledgerId: gstLedger._id,
          type: 'credit',
          amount: calculatedGstDetails.sgstAmount,
          description: `SGST (${calculatedGstDetails.sgstPercentage}%) for ${billHead.name}`
          });
          totalBillAmount += calculatedGstDetails.sgstAmount;
      }

      // Add IGST entry
      if (calculatedGstDetails.igstAmount > 0) {
          journalVoucher.entries.push({
          ledgerId: gstLedger._id,
          type: 'credit',
          amount: calculatedGstDetails.igstAmount,
          description: `IGST (${calculatedGstDetails.igstPercentage}%) for ${billHead.name}`
          });
          totalBillAmount += calculatedGstDetails.igstAmount;
        }
      }

      // Add additional charges entries and update total amount
      if (utilityBill.additionalCharges && utilityBill.additionalCharges.length > 0) {
        for (const charge of utilityBill.additionalCharges) {
          // Verify income ledger exists
          const chargeLedger = await Ledger.findById(charge.ledgerId).session(session);
          if (!chargeLedger) {
            throw new Error(`Ledger not found for additional charge: ${charge.chargeType}`);
          }
          // Try to find a receivable ledger for this additional charge (optional, if you have it in your BillHead/accountingConfig)
          let receivableLedger = null;
          if (charge.billHeadId) {
            const chargeBillHead = await BillHead.findById(charge.billHeadId).session(session);
            if (chargeBillHead && chargeBillHead.accountingConfig && chargeBillHead.accountingConfig.receivableLedgerId) {
              receivableLedger = await Ledger.findById(chargeBillHead.accountingConfig.receivableLedgerId).session(session);
            }
          }
          // Add debit entry to receivable ledger if available
          if (receivableLedger) {
            journalVoucher.entries.push({
              ledgerId: receivableLedger._id,
              type: 'debit',
              amount: charge.amount,
              description: `Receivable for Additional Charge: ${charge.chargeType}`
            });
          }
          // Add credit entry for additional charge (income ledger)
          journalVoucher.entries.push({
            ledgerId: charge.ledgerId,
            type: 'credit',
            amount: charge.amount,
            description: `Additional Charge: ${charge.chargeType}`
        });
      }
    }

      // Calculate total credit (total amount)
      const totalCredit = journalVoucher.entries
        .filter(e => e.type === 'credit')
        .reduce((sum, e) => sum + e.amount, 0);

      journalVoucher.entries[0].amount = totalCredit;
      utilityBill.totalAmount = totalCredit;

      console.log('Final utilityBill.totalAmount:', utilityBill.totalAmount);

      // Generate voucher number BEFORE saving
      journalVoucher.voucherNumber = await JournalVoucher.generateVoucherNumber(
        societyId,
        billHead.code,
        new Date()
      );

      // Now save the journal voucher
      await journalVoucher.save({ session });

      // Post entries to ledgers
      for (const entry of journalVoucher.entries) {
        const ledger = await Ledger.findById(entry.ledgerId).session(session);
        if (!ledger) {
          throw new Error(`Ledger not found: ${entry.ledgerId}`);
        }
        
        // Use the updateBalance method instead of directly modifying the balance
        await ledger.updateBalance(entry.amount, entry.type, session);
      }

      // Add journal entry reference to utility bill
      utilityBill.journalVoucherId = journalVoucher._id;
      await utilityBill.save({ session });

      await session.commitTransaction();
      return { success: true, data: utilityBill };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }

  try {
    const result = await attemptBillGeneration();
    res.status(201).json({
      message: 'Utility bill generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in generateBill:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
    } finally {
    if (session) {
      session.endSession();
    }
  }
}