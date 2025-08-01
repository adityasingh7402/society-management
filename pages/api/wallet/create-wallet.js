import jwt from 'jsonwebtoken';
import Wallet from '../../../models/Wallet';
import Resident from '../../../models/Resident';
import dbConnect from '../../../lib/mongodb';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
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

    // Check if wallet already exists
    let wallet = await Wallet.findOne({ residentId: resident._id });
    
    if (wallet) {
      return res.status(200).json({ 
        success: true, 
        message: 'Wallet already exists',
        data: wallet 
      });
    }

    // Create wallet
    wallet = new Wallet({ 
      residentId: resident._id, 
      societyId: resident.societyId, 
      createdBy: resident._id 
    });
    
    await wallet.save();

    // Link wallet to resident
    resident.walletId = wallet._id;
    await resident.save();

    res.status(201).json({ 
      success: true, 
      message: 'Wallet created successfully',
      data: wallet 
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
}
