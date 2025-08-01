import jwt from 'jsonwebtoken';
import Wallet from '../../../models/Wallet';
import WalletTransaction from '../../../models/WalletTransaction';
import Resident from '../../../models/Resident';
import dbConnect from '../../../lib/mongodb';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    return addMoney(req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
}

// Add money to wallet (Test Gateway)
async function addMoney(req, res) {
  try {
    const { amount } = req.body;

    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const phone = decoded.phone;

    // First find the resident by phone
    const resident = await Resident.findOne({ phone });
    if (!resident) {
      return res.status(404).json({ success: false, error: 'Resident not found' });
    }

    // Get wallet
    const wallet = await Wallet.findOne({ residentId: resident._id });

    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    if (wallet.isFrozen || !wallet.isActive) {
      return res.status(403).json({ success: false, error: 'Wallet is inactive or frozen' });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be greater than 0' });
    }

    if (amount > 100000) {
      return res.status(400).json({ success: false, error: 'Maximum amount per transaction is ₹1,00,000' });
    }

    // Perform transaction
    const transaction = new WalletTransaction({
      walletId: wallet._id,
      residentId: wallet.residentId,
      societyId: wallet.societyId,
      transactionFlow: 'CREDIT',
      amount,
      balanceBefore: wallet.currentBalance,
      balanceAfter: wallet.currentBalance + amount,
      status: 'SUCCESS', // Set status to SUCCESS for completed transaction
      type: 'ADD_MONEY',
      description: `Added money using Test Gateway: ₹${amount}`,
      paymentDetails: {
        method: 'TEST_GATEWAY',
        gateway: 'TEST_GATEWAY'
      },
      completedAt: new Date(), // Set completion timestamp
      createdBy: resident._id
    });

    // Update wallet balance
    wallet.updateBalance(amount, 'credit');
    await Promise.all([wallet.save(), transaction.save()]);

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error adding money to wallet:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
}
