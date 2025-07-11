import connectToDatabase from '../../../lib/mongodb';
import MaintenanceBill from '../../../models/MaintenanceBill';
import BillHead from '../../../models/BillHead';
import JournalVoucher from '../../../models/JournalVoucher';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify token
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await connectToDatabase();

    const {
      societyId,
      residents,
      billHeadId,
      billHeadDetails,
      description,
      baseAmount,
      additionalCharges,
      gstDetails,
      issueDate,
      dueDate,
      finePerDay
    } = req.body;

    // Validate bill head exists
    const billHead = await BillHead.findById(billHeadId);
    if (!billHead) {
      return res.status(400).json({ message: 'Invalid bill head' });
    }

    // Generate bills for each resident
    const generatedBills = await Promise.all(residents.map(async resident => {
      const totalAmount = baseAmount + 
        (gstDetails?.totalGst || 0) + 
        additionalCharges.reduce((sum, charge) => sum + parseFloat(charge.amount), 0);

      // Create maintenance bill
      const bill = await MaintenanceBill.create({
        societyId,
        flatId: resident.flatDetails?.flatId,
        flatNumber: resident.flatDetails?.flatNumber,
        blockName: resident.flatDetails?.blockName,
        floorNumber: resident.flatDetails?.floorNumber,
        residentId: resident._id,
        ownerName: resident.name,
        ownerMobile: resident.phone,
        ownerEmail: resident.email,
        billHeadId,
        billHeadDetails,
        description,
        baseAmount,
        additionalCharges,
        gstDetails: {
          cgst: gstDetails?.cgst || 0,
          sgst: gstDetails?.sgst || 0,
          igst: gstDetails?.igst || 0,
          totalGst: gstDetails?.totalGst || 0
        },
        issueDate,
        dueDate,
        finePerDay,
        totalAmount,
        status: 'Pending',
        generatedBy: decoded.userId,
        generatedAt: new Date()
      });

      // Create journal voucher entries
      const journalVoucher = await JournalVoucher.create({
        societyId,
        date: new Date(),
        type: 'Bill',
        referenceId: bill._id,
        referenceNumber: bill.billNumber,
        description: `Maintenance bill generated for ${resident.flatDetails?.flatNumber}`,
        entries: [
          // Debit entry for resident's account
          {
            account: 'Resident Receivables',
            description: `Bill for ${billHeadDetails.name}`,
            debit: totalAmount,
            credit: 0
          },
          // Credit entry for income account
          {
            account: billHead.incomeAccount || 'Maintenance Income',
            description: `Bill for ${billHeadDetails.name}`,
            debit: 0,
            credit: baseAmount
          },
          // GST entries if applicable
          ...(gstDetails?.cgst ? [{
            account: 'CGST Payable',
            description: 'CGST on maintenance bill',
            debit: 0,
            credit: gstDetails.cgst
          }] : []),
          ...(gstDetails?.sgst ? [{
            account: 'SGST Payable',
            description: 'SGST on maintenance bill',
            debit: 0,
            credit: gstDetails.sgst
          }] : []),
          ...(gstDetails?.igst ? [{
            account: 'IGST Payable',
            description: 'IGST on maintenance bill',
            debit: 0,
            credit: gstDetails.igst
          }] : []),
          // Additional charges entries
          ...additionalCharges.map(charge => ({
            account: billHead.incomeAccount || 'Other Income',
            description: charge.description,
            debit: 0,
            credit: charge.amount
          }))
        ],
        status: 'Posted',
        postedBy: decoded.userId,
        postedAt: new Date()
      });

      return { bill, journalVoucher };
    }));

    res.status(201).json({
      message: `Successfully generated ${generatedBills.length} bills`,
      bills: generatedBills.map(({ bill }) => bill),
      journalVouchers: generatedBills.map(({ journalVoucher }) => journalVoucher)
    });
  } catch (error) {
    console.error('Error generating bills:', error);
    res.status(500).json({ message: 'Error generating bills', error: error.message });
  }
}