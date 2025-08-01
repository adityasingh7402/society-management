import jwt from 'jsonwebtoken';
import Wallet from '../../../models/Wallet';
import Resident from '../../../models/Resident';
import dbConnect from '../../../lib/mongodb';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
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

    // Get wallet information or create if doesn't exist
    let wallet = await Wallet.findOne({ residentId: resident._id })
      .populate('residentId', 'name phone email flatDetails');

    if (!wallet) {
      // Create wallet automatically
      wallet = new Wallet({ 
        residentId: resident._id, 
        societyId: resident.societyId, 
        createdBy: resident._id 
      });
      
      await wallet.save();
      
      // Link wallet to resident
      resident.walletId = wallet._id;
      await resident.save();
      
      // Populate the resident data
      wallet = await Wallet.findById(wallet._id)
        .populate('residentId', 'name phone email flatDetails');
    }

    // Reset limits if needed
    wallet.resetDailyLimits();
    wallet.resetMonthlyLimits();
    await wallet.save();

    const balanceInfo = {
      currentBalance: wallet.currentBalance,
      totalCredits: wallet.totalCredits,
      totalDebits: wallet.totalDebits,
      walletId: wallet.walletId,
      isActive: wallet.isActive,
      isFrozen: wallet.isFrozen,
      limits: {
        daily: {
          maxAmount: wallet.limits.daily.maxAmount,
          usedAmount: wallet.limits.daily.usedAmount,
          remainingAmount: wallet.limits.daily.maxAmount - wallet.limits.daily.usedAmount
        },
        monthly: {
          maxAmount: wallet.limits.monthly.maxAmount,
          usedAmount: wallet.limits.monthly.usedAmount,
          remainingAmount: wallet.limits.monthly.maxAmount - wallet.limits.monthly.usedAmount
        },
        perTransaction: {
          maxAmount: wallet.limits.perTransaction.maxAmount
        }
      },
      settings: wallet.settings,
      lastActivity: wallet.lastActivity,
      residentInfo: {
        name: wallet.residentId.name,
        phone: wallet.residentId.phone,
        flatNumber: wallet.residentId.flatDetails?.flatNumber || 'N/A'
      }
    };

    res.status(200).json({ success: true, data: balanceInfo });
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
}
