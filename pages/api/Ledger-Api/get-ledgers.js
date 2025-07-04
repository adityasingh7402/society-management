import connectToDatabase from "../../../lib/mongodb";
import Ledger from '../../../models/Ledger';
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

    // Fetch ledgers for the society
    const ledgers = await Ledger.find({ societyId: decoded.societyId })
      .sort({ code: 1 })
      .select('code name type category balanceType openingBalance');

    console.log(ledgers);
    res.status(200).json({
      message: 'Ledgers fetched successfully',
      ledgers
    });

  } catch (error) {
    console.error('Error fetching ledgers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 