import jwt from 'jsonwebtoken';
import Wallet from '../../../models/Wallet';
import TenantWallet from '../../../models/TenantWallet';
import WalletTransaction from '../../../models/WalletTransaction';
import TenantWalletTransaction from '../../../models/TenantWalletTransaction';
import Resident from '../../../models/Resident';
const connectToDatabase = require('../../../lib/mongodb');

export default async function handler(req, res) {
  await connectToDatabase();

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
    const userType = decoded.userType;
    const role = decoded.role;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be greater than 0' });
    }

    // Handle main residents
    if (userType === 'main_resident' || role === 'resident') {
      const residentId = decoded.id;
      
      if (!residentId) {
        return res.status(401).json({ success: false, error: 'Invalid token: no resident ID' });
      }

      // Find the resident by ID
      const resident = await Resident.findById(residentId);
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
        status: 'SUCCESS',
        type: 'ADD_MONEY',
        description: `Added money using Test Gateway: ₹${amount}`,
        paymentDetails: {
          method: 'TEST_GATEWAY',
          gateway: 'TEST_GATEWAY'
        },
        completedAt: new Date(),
        createdBy: resident._id
      });

      // Update wallet balance
      wallet.updateBalance(amount, 'credit');
      await Promise.all([wallet.save(), transaction.save()]);

      return res.status(200).json({ success: true, data: transaction });
    }

    // Handle tenants/members
    else if (userType === 'member' && (role === 'tenant' || role === 'family_member')) {
      const tenantId = decoded.id;
      const parentResidentId = decoded.residentId;
      const tenantPhone = decoded.phone;
      
      if (!tenantId || !parentResidentId) {
        return res.status(401).json({ success: false, error: 'Invalid token: missing tenant or parent resident ID' });
      }

      // Find parent resident for society info
      const parentResident = await Resident.findById(parentResidentId);
      if (!parentResident) {
        return res.status(404).json({ success: false, error: 'Parent resident not found' });
      }

      // Get or create tenant wallet
      let tenantWallet = await TenantWallet.findOne({ tenantId: tenantId });

      if (!tenantWallet) {
        // Create tenant wallet automatically if it doesn't exist
        tenantWallet = new TenantWallet({ 
          tenantId: tenantId,
          tenantPhone: tenantPhone,
          parentResidentId: parentResidentId,
          societyId: parentResident.societyId,
          createdBy: parentResidentId
        });
        
        await tenantWallet.save();
      }

      if (tenantWallet.isFrozen || !tenantWallet.isActive) {
        return res.status(403).json({ success: false, error: 'Tenant wallet is inactive or frozen' });
      }

      // Check tenant restrictions
      const maxDailyAddMoney = tenantWallet.settings?.restrictions?.maxDailyAddMoney || 10000;
      if (amount > maxDailyAddMoney) {
        return res.status(400).json({ success: false, error: `Maximum amount per transaction for tenants is ₹${maxDailyAddMoney.toLocaleString()}` });
      }

      // Perform transaction for tenant
      const transaction = new TenantWalletTransaction({
        walletId: tenantWallet._id,
        tenantId: tenantId,
        tenantPhone: tenantPhone,
        parentResidentId: parentResidentId,
        societyId: parentResident.societyId,
        transactionFlow: 'CREDIT',
        amount,
        balanceBefore: tenantWallet.currentBalance,
        balanceAfter: tenantWallet.currentBalance + amount,
        status: 'SUCCESS',
        type: 'ADD_MONEY',
        description: `Added money using Test Gateway: ₹${amount} (Tenant)`,
        paymentDetails: {
          method: 'TEST_GATEWAY',
          gateway: 'TEST_GATEWAY'
        },
        completedAt: new Date(),
        createdBy: tenantId
      });

      // Update tenant wallet balance
      tenantWallet.updateBalance(amount, 'credit');
      await Promise.all([tenantWallet.save(), transaction.save()]);

      return res.status(200).json({ success: true, data: transaction });
    }

    else {
      return res.status(401).json({ success: false, error: 'Invalid user type or role' });
    }
  } catch (error) {
    console.error('Error adding money to wallet:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
}
