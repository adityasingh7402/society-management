import Wallet from '../../../models/Wallet';
import Resident from '../../../models/Resident';
import dbConnect from '../../../lib/mongodb';

export default async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'POST':
      return createWallet(req, res);
    case 'GET':
      return getWallet(req, res);
    case 'PUT':
      return updateWallet(req, res);
    case 'DELETE':
      return deleteWallet(req, res);
    default:
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
}

// Create a wallet for a resident
async function createWallet(req, res) {
  try {
    const { residentId } = req.body;

    // Validate resident
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ success: false, error: 'Resident not found' });
    }

    // Check if wallet already exists
    const existingWallet = await Wallet.findOne({ residentId });
    if (existingWallet) {
      return res.status(409).json({ success: false, error: 'Wallet already exists' });
    }

    // Create wallet
    const wallet = new Wallet({ residentId, societyId: resident.societyId, createdBy: residentId });
    await wallet.save();

    // Link wallet to resident
    resident.walletId = wallet._id;
    await resident.save();

    res.status(201).json({ success: true, data: wallet });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
}

// Get wallet information
async function getWallet(req, res) {
  try {
    const { residentId } = req.query;

    const wallet = await Wallet.findOne({ residentId }).populate('residentId', 'name phone email');
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    res.status(200).json({ success: true, data: wallet });
  } catch (error) {
    console.error('Error retrieving wallet:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
}

// Update wallet details
async function updateWallet(req, res) {
  try {
    const { residentId } = req.body;

    const wallet = await Wallet.findOneAndUpdate(
      { residentId },
      { $set: req.body },
      { new: true }
    );

    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    res.status(200).json({ success: true, data: wallet });
  } catch (error) {
    console.error('Error updating wallet:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
}

// Delete wallet
async function deleteWallet(req, res) {
  try {
    const { residentId } = req.body;

    const wallet = await Wallet.findOneAndDelete({ residentId });
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    // Unlink wallet from resident
    await Resident.findByIdAndUpdate(residentId, { $unset: { walletId: '' } });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting wallet:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
}
