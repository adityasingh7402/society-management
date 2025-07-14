import connectToDatabase from "../../../lib/mongodb";
import JournalVoucher from '../../../models/JournalVoucher';
import Ledger from '../../../models/Ledger';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { societyId, ledgerId, startDate, endDate, billCategory, subCategory } = req.query;

    // Validate required fields
    if (!societyId || !ledgerId || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Missing required fields',
        details: {
          societyId: !societyId ? 'missing' : 'present',
          ledgerId: !ledgerId ? 'missing' : 'present',
          startDate: !startDate ? 'missing' : 'present',
          endDate: !endDate ? 'missing' : 'present'
        }
      });
    }

    // Convert ledgerId to ObjectId
    let ledgerObjectId;
    try {
      ledgerObjectId = mongoose.Types.ObjectId.createFromHexString(ledgerId);
    } catch (error) {
      return res.status(400).json({
        message: 'Invalid ledger ID format',
        error: error.message
      });
    }

    // Get ledger details
    const ledger = await Ledger.findById(ledgerObjectId);
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }

    // Determine balance type based on ledger type and current balance
    function getBalanceType(type, balance) {
      if (balance === 0) return 'Balanced';

      switch (type) {
        case 'Asset':
        case 'Expense':
          return balance > 0 ? 'Debit' : 'Credit';
        case 'Liability':
        case 'Income':
        case 'Equity':
          return balance > 0 ? 'Credit' : 'Debit';
        default:
          return balance > 0 ? 'Debit' : 'Credit';
      }
    }

    // Calculate opening balance
    const openingBalance = {
      amount: Math.abs(ledger.openingBalance),
      type: getBalanceType(ledger.type, ledger.openingBalance)
    };

    // Build match stage for aggregation
    const matchStage = {
      societyId: mongoose.Types.ObjectId.createFromHexString(societyId),
      status: 'Active',
      voucherDate: {
        $gte: startDate ? new Date(startDate + 'T00:00:00.000Z') : new Date('1970-01-01'),
        $lte: endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date()
      }
    };

    // Add category filters if provided
    if (billCategory) matchStage.billCategory = billCategory;
    if (subCategory) matchStage.subCategory = subCategory;

    console.log('Match Stage:', JSON.stringify(matchStage, null, 2));

    // Get all entries for this ledger in date range
    const entries = await JournalVoucher.aggregate([
      {
        $match: matchStage
      },
      {
        $lookup: {
          from: 'journalvouchers',
          let: { voucherId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$voucherId'] }
              }
            },
            {
              $project: {
                baseAmount: {
                  $reduce: {
                    input: '$entries',
                    initialValue: 0,
                    in: {
                      $cond: {
                        if: {
                          $and: [
                            { $eq: ['$$this.type', 'credit'] },
                            { $not: { $regexMatch: { input: { $ifNull: ['$$this.description', ''] }, regex: /GST/ } } }
                          ]
                        },
                        then: { $add: ['$$value', '$$this.amount'] },
                        else: '$$value'
                      }
                    }
                  }
                }
              }
            }
          ],
          as: 'voucherDetails'
        }
      },
      { 
        $unwind: {
          path: '$entries',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $match: {
          'entries.ledgerId': ledgerObjectId
        }
      },
      {
        $project: {
          _id: 1,
          voucherNumber: 1,
          voucherDate: 1,
          voucherType: 1,
          referenceNumber: 1,
          referenceType: 1,
          category: 1,
          subCategory: 1,
          narration: 1,
          'entries.type': 1,
          'entries.amount': 1,
          'entries.description': 1,
          'entries.ledgerId': 1,
          'gstDetails': 1,
          'baseAmount': { $arrayElemAt: ['$voucherDetails.baseAmount', 0] }
        }
      },
      {
        $addFields: {
          voucherDate: { $dateToString: { format: "%Y-%m-%d", date: "$voucherDate" } },
          detailedDescription: {
            $cond: {
              if: {
                $and: [
                  { $eq: ['$referenceType', 'Bill'] },
                  { $eq: ['$gstDetails.isGSTApplicable', true] }
                ]
              },
              then: {
                $concat: [
                  '$narration',
                  '\nBase Amount: ₹',
                  { $toString: { $multiply: [{ $ifNull: ['$baseAmount', 0] }, 1] } },
                  {
                    $reduce: {
                      input: { $ifNull: ['$gstDetails.gstEntries', []] },
                      initialValue: '',
                      in: {
                        $concat: [
                          '$$value',
                          '\n',
                          { $ifNull: ['$$this.type', ''] },
                          ' (',
                          { $toString: { $ifNull: ['$$this.percentage', 0] } },
                          '%): ₹',
                          { $toString: { $multiply: [{ $ifNull: ['$$this.amount', 0] }, 1] } }
                        ]
                      }
                    }
                  }
                ]
              },
              else: {
                $cond: {
                  if: { $eq: ['$referenceType', 'Bill'] },
                  then: {
                    $concat: [
                      '$narration',
                      '\nBase Amount: ₹',
                      { $toString: { $multiply: [{ $ifNull: ['$baseAmount', 0] }, 1] } }
                    ]
                  },
                  else: '$narration'
                }
              }
            }
          }
        }
      },
      {
        $sort: {
          voucherDate: 1,
          voucherNumber: 1
        }
      }
    ]);

    console.log('Entries with GST:', JSON.stringify(entries, null, 2));

    // Calculate running balance
    let runningBalance = ledger.openingBalance;
    const entriesWithBalance = entries.map(entry => {
      // Update running balance based on ledger type and entry type
      if (ledger.type === 'Asset' || ledger.type === 'Expense') {
        runningBalance += entry.entries.type === 'debit' ? entry.entries.amount : -entry.entries.amount;
      } else {
        runningBalance += entry.entries.type === 'credit' ? entry.entries.amount : -entry.entries.amount;
      }

      // Format the entry for display
      return {
        ...entry,
        balance: {
          amount: Math.abs(runningBalance),
          type: getBalanceType(ledger.type, runningBalance)
        },
        // Use detailed description that includes GST breakdown
        description: entry.detailedDescription,
        // Restructure the entry for cleaner response
        amount: entry.entries.amount,
        type: entry.entries.type
      };
    });

    // Calculate totals
    const totals = entries.reduce((acc, entry) => {
      if (entry.entries.type === 'debit') {
        acc.totalDebit += entry.entries.amount;
      } else {
        acc.totalCredit += entry.entries.amount;
      }
      return acc;
    }, { totalDebit: 0, totalCredit: 0 });

    // Use current balance from ledger
    const closingBalance = {
      amount: Math.abs(ledger.currentBalance),
      type: getBalanceType(ledger.type, ledger.currentBalance)
    };

    res.status(200).json({
      message: 'General ledger entries fetched successfully',
      data: {
        ledger: {
          code: ledger.code,
          name: ledger.name,
          type: ledger.type,
          category: ledger.category,
          billCategory: ledger.billCategory,
          subCategory: ledger.subCategory,
          gstConfig: ledger.gstConfig,
          tdsConfig: ledger.tdsConfig,
          bankDetails: ledger.bankDetails,
          reconciliationStatus: ledger.reconciliationStatus
        },
        openingBalance,
        entries: entriesWithBalance,
        closingBalance,
        totals
      }
    });

  } catch (error) {
    console.error('Error fetching general ledger:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}