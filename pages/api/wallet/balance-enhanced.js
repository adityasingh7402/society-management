import jwt from 'jsonwebtoken';
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

    let balanceInfo = null;

    if (userType === 'main_resident' && role === 'resident') {
      // Handle main resident wallet
      const resident = await Resident.findOne({ phone });
      if (!resident) {
        return res.status(404).json({ success: false, error: 'Resident not found' });
      }

      let wallet = await Wallet.findOne({ residentId: resident._id })
        .populate('residentId', 'name phone email flatDetails');

      if (!wallet) {
        // Create wallet automatically for resident
        wallet = new Wallet({ 
          residentId: resident._id, 
          societyId: resident.societyId, 
          createdBy: resident._id 
        });
        
        await wallet.save();
        
        resident.walletId = wallet._id;
        await resident.save();
        
        wallet = await Wallet.findById(wallet._id)
          .populate('residentId', 'name phone email flatDetails');
      }

      // Reset limits if needed
      wallet.resetDailyLimits();
      wallet.resetMonthlyLimits();
      await wallet.save();

      balanceInfo = {
        walletType: 'RESIDENT',
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
          flatNumber: wallet.residentId.flatDetails?.flatNumber || 'N/A',
          userType: 'Main Resident'
        }
      };

    } else if (userType === 'member' && role === 'tenant') {
      // Handle tenant wallet
      let tenantWallet = await TenantWallet.findOne({ 
        tenantId: id,
        tenantPhone: phone 
      });

      if (!tenantWallet) {
        // Find parent resident
        const parentResident = await Resident.findById(parentResidentId);
        if (!parentResident) {
          return res.status(404).json({ success: false, error: 'Parent resident not found' });
        }

        // Find tenant in parent resident's members
        const tenantMember = parentResident.members.find(
          member => member._id.toString() === id && member.phone === phone
        );

        if (!tenantMember) {
          return res.status(404).json({ success: false, error: 'Tenant member not found' });
        }

        // Create tenant wallet automatically
        tenantWallet = new TenantWallet({
          tenantId: id,
          tenantPhone: phone,
          parentResidentId: parentResidentId,
          societyId: parentResident.societyId,
          createdBy: parentResidentId
        });

        await tenantWallet.save();
      }

      // Reset limits if needed
      tenantWallet.resetDailyLimits();
      tenantWallet.resetMonthlyLimits();
      await tenantWallet.save();

      // Get tenant info from parent resident
      const parentResident = await Resident.findById(tenantWallet.parentResidentId);
      const tenantMember = parentResident.members.find(
        member => member._id.toString() === id
      );

      balanceInfo = {
        walletType: 'TENANT',
        currentBalance: tenantWallet.currentBalance,
        totalCredits: tenantWallet.totalCredits,
        totalDebits: tenantWallet.totalDebits,
        walletId: tenantWallet.walletId,
        isActive: tenantWallet.isActive,
        isFrozen: tenantWallet.isFrozen,
        limits: {
          daily: {
            maxAmount: tenantWallet.limits.daily.maxAmount,
            usedAmount: tenantWallet.limits.daily.usedAmount,
            remainingAmount: tenantWallet.limits.daily.maxAmount - tenantWallet.limits.daily.usedAmount
          },
          monthly: {
            maxAmount: tenantWallet.limits.monthly.maxAmount,
            usedAmount: tenantWallet.limits.monthly.usedAmount,
            remainingAmount: tenantWallet.limits.monthly.maxAmount - tenantWallet.limits.monthly.usedAmount
          },
          perTransaction: {
            maxAmount: tenantWallet.limits.perTransaction.maxAmount
          }
        },
        settings: tenantWallet.settings,
        lastActivity: tenantWallet.lastActivity,
        residentInfo: {
          name: tenantMember?.name || 'Unknown',
          phone: tenantMember?.phone || phone,
          flatNumber: tenantMember?.flatDetails?.flatNumber || parentResident.flatDetails?.flatNumber || 'N/A',
          userType: 'Tenant',
          parentResident: parentResident.name
        },
        restrictions: tenantWallet.settings?.restrictions || {
          canAddMoney: true,
          canTransferMoney: true,
          canPayUtilities: true,
          maxDailyAddMoney: 10000
        }
      };

    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user type or role for wallet access' 
      });
    }

    res.status(200).json({ success: true, data: balanceInfo });

  } catch (error) {
    console.error('Error getting wallet balance:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
}
