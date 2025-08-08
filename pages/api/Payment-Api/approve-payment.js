import connectToDatabase from '../../../lib/mongodb';
import PaymentEntry from '../../../models/PaymentEntry';
import { verifyToken } from '../../../utils/auth';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      await logFailure('PAYMENT_APPROVE', req, 'No authorization token provided', { paymentId: req.body?.paymentId });
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      await logFailure('PAYMENT_APPROVE', req, 'Invalid authorization token', { paymentId: req.body?.paymentId });
      return res.status(401).json({ message: 'Invalid token' });
    }

    await connectToDatabase();

    const { paymentId, action, remarks } = req.body;

    // Validate required fields
    if (!paymentId || !action || !['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    // Get payment entry
    const payment = await PaymentEntry.findById(paymentId);
    if (!payment) {
      await logFailure('PAYMENT_APPROVE', req, 'Payment not found', { paymentId });
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Validate payment status
    if (payment.status !== 'Pending') {
      return res.status(400).json({ message: 'Payment is not in pending state' });
    }

    // Validate maker-checker rule (maker cannot be checker)
    if (payment.maker.userId.toString() === decoded.Id) {
      return res.status(400).json({ message: 'Maker cannot approve their own payment' });
    }

    try {
      // Process approval/rejection
      await payment.processApproval(decoded.Id, action, remarks);
      
      // Log successful approval/rejection
      await logSuccess('PAYMENT_APPROVE', req, {
        paymentId: payment._id,
        action: action,
        remarks: remarks,
        billId: payment.billId,
        billType: payment.billType,
        amount: payment.amount,
        paymentMode: payment.paymentMode,
        residentId: payment.residentId,
        societyId: payment.societyId,
        voucherId: payment.voucherId,
        approver: decoded.Id
      }, payment._id, 'PaymentEntry');

      return res.status(200).json({
        message: `Payment ${action.toLowerCase()} successfully`,
        paymentId: payment._id,
        status: payment.status,
        voucherId: payment.voucherId
      });

    } catch (error) {
      // Log approval/rejection failure
      await logFailure('PAYMENT_APPROVE', req, error.message, {
        paymentId: paymentId,
        action: action,
        errorType: error.name
      });
      
      return res.status(400).json({ 
        message: `Error ${action.toLowerCase()}ing payment`,
        error: error.message
      });
    }

  } catch (error) {
    console.error('Error processing payment approval:', error);
    
    // Log the general failure
    await logFailure('PAYMENT_APPROVE', req, error.message, {
      paymentId: req.body?.paymentId,
      action: req.body?.action,
      errorType: error.name
    });
    
    return res.status(500).json({ 
      message: 'Error processing payment approval',
      error: error.message
    });
  }
} 