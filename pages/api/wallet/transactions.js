import jwt from 'jsonwebtoken';
import WalletTransaction from '../../../models/WalletTransaction';
import Wallet from '../../../models/Wallet';
import Resident from '../../../models/Resident';
import UtilityBill from '../../../models/UtilityBill';
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

    // Get wallet
    const wallet = await Wallet.findOne({ residentId: resident._id });
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    // Query parameters
    const {
      page = 1,
      limit,
      type,
      status,
      fromDate,
      toDate,
      transactionFlow,
      unlimited = false // Add explicit unlimited flag
    } = req.query;

    // Build filter
    const filter = { walletId: wallet._id };
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (transactionFlow) filter.transactionFlow = transactionFlow;
    
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    // Build query
    let query = WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .populate('billDetails.billId', 'billNumber totalAmount')
      .populate('marketplaceDetails.itemId', 'title price')
      .populate('transferDetails.toResidentId', 'name phone')
      .populate('transferDetails.fromResidentId', 'name phone');

    // Apply pagination logic
    if (limit) {
      // Use provided limit
      const skip = (parseInt(page) - 1) * parseInt(limit);
      query = query.skip(skip).limit(parseInt(limit));
    } else if (unlimited !== 'true') {
      // Safety limit when no explicit limit provided (unless unlimited=true)
      query = query.limit(1000); // Safety limit of 1000 transactions
    }
    // If unlimited=true, no limit is applied

    // Get transactions
    const transactions = await query;

    // Get total count
    const totalCount = await WalletTransaction.countDocuments(filter);

    // Calculate summary for current filter
    const summary = await WalletTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalCredit: {
            $sum: {
              $cond: [{ $eq: ['$transactionFlow', 'CREDIT'] }, '$amount', 0]
            }
          },
          totalDebit: {
            $sum: {
              $cond: [{ $eq: ['$transactionFlow', 'DEBIT'] }, '$amount', 0]
            }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    const transactionSummary = summary[0] || {
      totalCredit: 0,
      totalDebit: 0,
      transactionCount: 0
    };

    const response = {
      transactions,
      pagination: limit ? {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        limit: parseInt(limit)
      } : unlimited === 'true' ? {
        totalCount,
        unlimited: true
      } : {
        totalCount,
        safetyLimit: 1000,
        hasMore: totalCount > 1000
      },
      summary: transactionSummary,
      currentBalance: wallet.currentBalance
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Error getting wallet transactions:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
}
