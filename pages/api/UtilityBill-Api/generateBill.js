import UtilityBill from '../../../models/UtilityBill';
import BillHead from '../../../models/BillHead';
import JournalVoucher from '../../../models/JournalVoucher';
import connectDB from '../../../lib/mongodb';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    const {
      societyId,
      flatNumber,
      blockName,
      floorNumber,
      residentId,
      ownerName,
      ownerMobile,
      ownerEmail,
      billHeadId,
      unitUsage,
      issueDate,
      dueDate
    } = req.body;

    // Fetch bill head to get configurations
    const billHead = await BillHead.findById(billHeadId)
      .populate('accountingConfig.incomeLedgerId')
      .populate('accountingConfig.receivableLedgerId');
      
    if (!billHead) {
      return res.status(404).json({ message: 'Bill head not found' });
    }

    // Calculate base amount based on calculation type
    let baseAmount = 0;
    switch (billHead.calculationType) {
      case 'Fixed':
        baseAmount = billHead.fixedAmount;
        break;
      case 'PerUnit':
        if (!unitUsage) {
          return res.status(400).json({ message: 'Unit usage is required for per unit calculation' });
        }
        baseAmount = unitUsage * billHead.perUnitRate;
        break;
      case 'Formula':
        try {
          // Replace variables in formula with actual values
          const formulaWithValues = billHead.formula
            .replace(/\$\{unitUsage\}/g, unitUsage || 0)
            .replace(/\$\{rate\}/g, billHead.perUnitRate || 0);
          baseAmount = eval(formulaWithValues);
        } catch (error) {
          console.error('Formula evaluation error:', error);
          return res.status(400).json({ message: 'Invalid formula calculation' });
        }
        break;
    }

    // Calculate GST if applicable
    let gstDetails = {
      isGSTApplicable: billHead.gstConfig.isGSTApplicable,
      cgstPercentage: billHead.gstConfig.cgstPercentage,
      sgstPercentage: billHead.gstConfig.sgstPercentage,
      igstPercentage: billHead.gstConfig.igstPercentage,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0
    };

    if (billHead.gstConfig.isGSTApplicable) {
      gstDetails.cgstAmount = (baseAmount * billHead.gstConfig.cgstPercentage) / 100;
      gstDetails.sgstAmount = (baseAmount * billHead.gstConfig.sgstPercentage) / 100;
      gstDetails.igstAmount = (baseAmount * billHead.gstConfig.igstPercentage) / 100;
    }

    // Create utility bill
    const utilityBill = new UtilityBill({
      societyId,
      billHeadId,
      flatNumber,
      blockName,
      floorNumber,
      residentId,
      ownerName,
      ownerMobile,
      ownerEmail,
      baseAmount,
      unitUsage,
      perUnitRate: billHead.perUnitRate,
      formula: billHead.formula,
      gstDetails,
      latePaymentDetails: billHead.latePaymentConfig,
      totalAmount: baseAmount + gstDetails.cgstAmount + gstDetails.sgstAmount + gstDetails.igstAmount,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      status: 'Pending',
      createdBy: decoded.id
    });

    // Generate bill number
    utilityBill.billNumber = await utilityBill.generateBillNumber();

    // Create journal voucher entries
    const journalVoucher = new JournalVoucher({
      societyId,
      voucherNumber: 'JV/' + utilityBill.billNumber,
      voucherDate: new Date(),
      voucherType: 'Journal',
      referenceType: 'Bill',
      referenceId: utilityBill._id,
      referenceNumber: utilityBill.billNumber,
      narration: `Utility bill generated for ${flatNumber}`,
      entries: [
        // Debit entry (Receivable)
        {
          ledgerId: billHead.accountingConfig.receivableLedgerId,
          type: 'debit',
          amount: utilityBill.totalAmount,
          description: `Bill for ${billHead.name}`
        },
        // Credit entry (Income)
        {
          ledgerId: billHead.accountingConfig.incomeLedgerId,
          type: 'credit',
          amount: baseAmount,
          description: `Bill for ${billHead.name}`
        }
      ],
      status: 'Posted',
      createdBy: decoded.id
    });

    // Add GST entries if applicable
    if (gstDetails.isGSTApplicable) {
      if (gstDetails.cgstAmount > 0) {
        journalVoucher.entries.push({
          ledgerId: billHead.accountingConfig.gstLedgerId,
          type: 'credit',
          amount: gstDetails.cgstAmount,
          description: 'CGST on utility bill'
        });
      }
      if (gstDetails.sgstAmount > 0) {
        journalVoucher.entries.push({
          ledgerId: billHead.accountingConfig.gstLedgerId,
          type: 'credit',
          amount: gstDetails.sgstAmount,
          description: 'SGST on utility bill'
        });
      }
      if (gstDetails.igstAmount > 0) {
        journalVoucher.entries.push({
          ledgerId: billHead.accountingConfig.gstLedgerId,
          type: 'credit',
          amount: gstDetails.igstAmount,
          description: 'IGST on utility bill'
        });
      }
    }

    // Save both documents
    await utilityBill.save();
    await journalVoucher.save();

    // Add journal entry reference to utility bill
    utilityBill.journalEntries.push({
      voucherId: journalVoucher._id,
      type: 'Bill',
      amount: utilityBill.totalAmount,
      date: new Date()
    });
    await utilityBill.save();

    res.status(201).json({
      message: 'Utility bill generated successfully',
      data: {
        bill: utilityBill,
        journalVoucher
      }
    });

  } catch (error) {
    console.error('Error generating utility bill:', error);
    res.status(500).json({ message: 'Failed to generate utility bill', error: error.message });
  }
}