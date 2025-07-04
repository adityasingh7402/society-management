import connectToDatabase from "../../../lib/mongodb";
import JournalVoucher from '../../../models/JournalVoucher';
import Ledger from '../../../models/Ledger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { societyId, ledgerId, startDate, endDate } = req.query;

    // Validate required fields
    if (!societyId || !ledgerId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get ledger details
    const ledger = await Ledger.findById(ledgerId);
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }

    // Calculate opening balance
    const openingBalance = {
      amount: ledger.openingBalance,
      type: ledger.balanceType
    };

    // Get all entries for this ledger in date range
    const entries = await JournalVoucher.aggregate([
      {
        $match: {
          societyId,
          status: 'Posted',
          voucherDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      { $unwind: '$entries' },
      {
        $match: {
          'entries.ledgerId': ledger._id
        }
      },
      {
        $project: {
          voucherNo: 1,
          voucherDate: 1,
          voucherType: 1,
          narration: 1,
          'entries.type': 1,
          'entries.amount': 1,
          referenceNo: 1
        }
      },
      {
        $sort: {
          voucherDate: 1,
          voucherNo: 1
        }
      }
    ]);

    // Calculate running balance
    let runningBalance = openingBalance.amount;
    const entriesWithBalance = entries.map(entry => {
      if (ledger.balanceType === 'Debit') {
        if (entry.entries.type === 'Debit') {
          runningBalance += entry.entries.amount;
        } else {
          runningBalance -= entry.entries.amount;
        }
      } else {
        if (entry.entries.type === 'Credit') {
          runningBalance += entry.entries.amount;
        } else {
          runningBalance -= entry.entries.amount;
        }
      }

      return {
        ...entry,
        balance: {
          amount: Math.abs(runningBalance),
          type: runningBalance >= 0 ? ledger.balanceType : (ledger.balanceType === 'Debit' ? 'Credit' : 'Debit')
        }
      };
    });

    // Calculate totals
    const totals = entries.reduce((acc, entry) => {
      if (entry.entries.type === 'Debit') {
        acc.totalDebit += entry.entries.amount;
      } else {
        acc.totalCredit += entry.entries.amount;
      }
      return acc;
    }, { totalDebit: 0, totalCredit: 0 });

    // Calculate closing balance
    const closingBalance = {
      amount: Math.abs(runningBalance),
      type: runningBalance >= 0 ? ledger.balanceType : (ledger.balanceType === 'Debit' ? 'Credit' : 'Debit')
    };

    res.status(200).json({
      message: 'General ledger entries fetched successfully',
      data: {
        ledger: {
          code: ledger.code,
          name: ledger.name,
          type: ledger.type,
          category: ledger.category
        },
        openingBalance,
        entries: entriesWithBalance,
        closingBalance,
        totals
      }
    });

  } catch (error) {
    console.error('Error fetching general ledger:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 