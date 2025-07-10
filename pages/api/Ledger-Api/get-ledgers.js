import connectToDatabase from "../../../lib/mongodb";
import Ledger from '../../../models/Ledger';
import Society from '../../../models/Society';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Verify authentication token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.societyId) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    await connectToDatabase();

    // First find the society with the given societyId (which is a string)
    const society = await Society.findOne({ societyId: decoded.societyId });
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }

    // Fetch ledgers for the society using society's _id
    const ledgers = await Ledger.find({ societyId: society._id })
      .sort({ code: 1 })
      .select('code name type category balanceType openingBalance');

    res.status(200).json({
      message: 'Ledgers fetched successfully',
      ledgers
    });

  } catch (error) {
    console.error('Error fetching ledgers:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
} 