import jwt from 'jsonwebtoken';
import WalletTransaction from '../../../models/WalletTransaction';
import TenantWalletTransaction from '../../../models/TenantWalletTransaction';
import Wallet from '../../../models/Wallet';
import TenantWallet from '../../../models/TenantWallet';
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
    const { phone, userType, role, id, residentId: parentResidentId } = decoded;

    // Query parameters
    const {
      page = 1,
      limit,
      type,
      status,
      fromDate,
      toDate,
      transactionFlow,
      unlimited = false
    } = req.query;

    let transactions = [];
    let totalCount = 0;
    let transactionSummary = { totalCredit: 0, totalDebit: 0, transactionCount: 0 };
    let currentBalance = 0;
    let walletId = null;

    if (userType === 'main_resident' && role === 'resident') {
      // Handle main resident transactions
      const resident = await Resident.findOne({ phone });
      if (!resident) {
        return res.status(404).json({ success: false, error: 'Resident not found' });
      }

      const wallet = await Wallet.findOne({ residentId: resident._id });
      if (!wallet) {
        return res.status(404).json({ success: false, error: 'Wallet not found' });
      }

      walletId = wallet._id;
      currentBalance = wallet.currentBalance;

      // Build filter for resident transactions
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
        const skip = (parseInt(page) - 1) * parseInt(limit);
        query = query.skip(skip).limit(parseInt(limit));
      } else if (unlimited !== 'true') {
        query = query.limit(1000);
      }

      transactions = await query;
      totalCount = await WalletTransaction.countDocuments(filter);

      // Calculate summary
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

      transactionSummary = summary[0] || transactionSummary;

    } else if (userType === 'member' && role === 'tenant') {
      // Handle tenant transactions
      let tenantWallet = await TenantWallet.findOne({ 
        tenantId: id,
        tenantPhone: phone 
      });

      if (!tenantWallet) {
        return res.status(404).json({ success: false, error: 'Tenant wallet not found' });
      }

      walletId = tenantWallet._id;
      currentBalance = tenantWallet.currentBalance;

      // For tenant transactions, we'll use the same WalletTransaction model
      // but filter by tenantWalletId (you might need to add this field to WalletTransaction model)
      // For now, let's assume we use a tenantWalletId field in WalletTransaction

      const filter = { tenantWalletId: tenantWallet._id };
      
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (transactionFlow) filter.transactionFlow = transactionFlow;
      
      if (fromDate || toDate) {
        filter.createdAt = {};
        if (fromDate) filter.createdAt.$gte = new Date(fromDate);
        if (toDate) filter.createdAt.$lte = new Date(toDate);
      }

      // Build query for tenant transactions
      let query = WalletTransaction.find(filter)
        .sort({ createdAt: -1 })
        .populate('billDetails.billId', 'billNumber totalAmount')
        .populate('marketplaceDetails.itemId', 'title price')
        .populate('transferDetails.toResidentId', 'name phone')
        .populate('transferDetails.fromResidentId', 'name phone');

      // Apply pagination logic
      if (limit) {
        const skip = (parseInt(page) - 1) * parseInt(limit);
        query = query.skip(skip).limit(parseInt(limit));
      } else if (unlimited !== 'true') {
        query = query.limit(1000);
      }

      transactions = await query;
      totalCount = await WalletTransaction.countDocuments(filter);

      // Calculate summary for tenant
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

      transactionSummary = summary[0] || transactionSummary;

    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user type or role for transaction access' 
      });
    }

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
      currentBalance,
      walletType: userType === 'main_resident' ? 'RESIDENT' : 'TENANT'
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
