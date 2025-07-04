import connectToDatabase from '../../../lib/mongodb';
import PaymentEntry from '../../../models/PaymentEntry';
import ResidentBill from '../../../models/ResidentBill';
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
      billId,
      amount,
      paymentMode,
      paymentDate,
      transactionId,
      referenceNumber,
      bankDetails,
      remarks
    } = req.body;

    // Validate required fields
    if (!billId || !amount || !paymentMode) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get bill details
    const bill = await ResidentBill.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Validate payment amount
    const totalDue = bill.amount + (bill.penaltyAmount || 0) - (bill.paidAmount || 0);
    if (amount > totalDue) {
      return res.status(400).json({ message: 'Payment amount cannot exceed pending amount' });
    }

    // Create payment entry
    const payment = await PaymentEntry.create({
      societyId: bill.societyId,
      residentId: bill.residentId,
      billId: bill._id,
      amount,
      paymentMode,
      paymentDate: paymentDate || new Date(),
      transactionId,
      referenceNumber,
      bankDetails,
      
      // Set maker details
      maker: {
        userId: decoded.userId,
        remarks
      },
      
      // Store bill details for quick access
      billDetails: {
        billNumber: bill.billNumber,
        billAmount: bill.amount,
        billHeadCode: bill.billHeadDetails?.code,
        billHeadName: bill.billHeadDetails?.name
      },
      
      // Store resident details for quick access
      residentDetails: {
        name: bill.residentDetails?.name,
        phone: bill.residentDetails?.phone,
        email: bill.residentDetails?.email,
        flatNumber: bill.residentDetails?.flatNumber
      }
    });

    // If auto-approval is enabled for this payment mode, process approval
    if (['UPI', 'Card', 'NetBanking'].includes(paymentMode)) {
      await payment.processApproval(decoded.userId, 'Approved', 'Auto-approved online payment');
    }

    return res.status(200).json({
      message: 'Payment recorded successfully',
      paymentId: payment._id,
      status: payment.status
    });

  } catch (error) {
    console.error('Error recording payment:', error);
    return res.status(500).json({ 
      message: 'Error recording payment',
      error: error.message
    });
  }
} 