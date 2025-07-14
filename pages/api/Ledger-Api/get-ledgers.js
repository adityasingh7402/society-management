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

    const { type, category, billCategory, subCategory } = req.query;

    // First find the society with the given societyId (which is a string)
    const society = await Society.findOne({ societyId: decoded.societyId });
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }

    // Build query based on filters
    const query = { societyId: society._id, status: 'Active' };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (billCategory) query.billCategory = billCategory;
    if (subCategory) query.subCategory = subCategory;

    // Fetch ledgers for the society using society's _id
    const ledgers = await Ledger.find(query)
      .sort({ code: 1 })
      .select('code name type category billCategory subCategory currentBalance balanceType openingBalance');

    // Calculate balance type for each ledger
    const ledgersWithBalanceType = ledgers.map(ledger => {
      const balanceType = ledger.getBalanceType();
      return {
        ...ledger.toObject(),
        balanceType,
        currentBalance: Math.abs(ledger.currentBalance || 0), // Ensure positive display value
        openingBalance: Math.abs(ledger.openingBalance || 0)
      };
    });

    // Group ledgers by category if requested
    const groupedLedgers = ledgersWithBalanceType.reduce((acc, ledger) => {
      const key = ledger.billCategory || ledger.category;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(ledger);
      return acc;
    }, {});

    res.status(200).json({
      message: 'Ledgers fetched successfully',
      ledgers: ledgersWithBalanceType.map(ledger => ({
        ...ledger,
        societyId: society._id // Add MongoDB _id
      })),
      groupedLedgers,
      societyId: society._id, // Add MongoDB _id
      societyCode: society.societyId // Add original societyId string
    });

  } catch (error) {
    console.error('Error fetching ledgers:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
} 