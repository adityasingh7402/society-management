import connectToDatabase from '../../../lib/mongodb';
import JournalVoucher from '../../../models/JournalVoucher';
import Ledger from '../../../models/Ledger';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    await connectToDatabase();

    const { 
      societyId, 
      reportType, 
      fromDate, 
      toDate,
      includeSubLedgers = true
    } = req.body;

    // Validate required fields
    if (!societyId || !reportType || !fromDate || !toDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate report type
    const validReportTypes = ['TrialBalance', 'BalanceSheet', 'IncomeExpense'];
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({ message: 'Invalid report type' });
    }

    // Get all ledgers for the society
    const ledgers = await Ledger.find({ 
      societyId,
      status: 'Active'
    });

    // Get all voucher entries for the date range
    const vouchers = await JournalVoucher.find({
      societyId,
      voucherDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      status: 'Active'
    });

    // Calculate ledger balances
    const ledgerBalances = await calculateLedgerBalances(ledgers, vouchers, fromDate, toDate);

    // Generate report based on type
    let report;
    switch (reportType) {
      case 'TrialBalance':
        report = generateTrialBalance(ledgerBalances);
        break;
      case 'BalanceSheet':
        report = generateBalanceSheet(ledgerBalances);
        break;
      case 'IncomeExpense':
        report = generateIncomeExpense(ledgerBalances, fromDate, toDate);
        break;
    }

    return res.status(200).json({
      message: 'Report generated successfully',
      report
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({ 
      message: 'Error generating report',
      error: error.message
    });
  }
}

// Helper function to calculate ledger balances
async function calculateLedgerBalances(ledgers, vouchers, fromDate, toDate) {
  const balances = {};
  
  // Initialize balances
  for (const ledger of ledgers) {
    balances[ledger._id] = {
      ledger,
      openingBalance: 0,
      debitTotal: 0,
      creditTotal: 0,
      closingBalance: 0
    };
  }
  
  // Calculate opening balances (from all vouchers before fromDate)
  const openingVouchers = await JournalVoucher.find({
    societyId: ledgers[0].societyId,
    voucherDate: { $lt: new Date(fromDate) },
    status: 'Active'
  });
  
  for (const voucher of openingVouchers) {
    for (const entry of voucher.entries) {
      const balance = balances[entry.ledgerId];
      if (balance) {
        if (entry.type === 'Debit') {
          balance.openingBalance += entry.amount;
        } else {
          balance.openingBalance -= entry.amount;
        }
      }
    }
  }
  
  // Calculate transactions for the period
  for (const voucher of vouchers) {
    for (const entry of voucher.entries) {
      const balance = balances[entry.ledgerId];
      if (balance) {
        if (entry.type === 'Debit') {
          balance.debitTotal += entry.amount;
        } else {
          balance.creditTotal += entry.amount;
        }
      }
    }
  }
  
  // Calculate closing balances
  for (const id in balances) {
    const balance = balances[id];
    balance.closingBalance = balance.openingBalance + balance.debitTotal - balance.creditTotal;
  }
  
  return balances;
}

// Helper function to generate trial balance
function generateTrialBalance(ledgerBalances) {
  const trialBalance = {
    debitTotal: 0,
    creditTotal: 0,
    entries: []
  };
  
  for (const id in ledgerBalances) {
    const balance = ledgerBalances[id];
    const entry = {
      ledgerCode: balance.ledger.code,
      ledgerName: balance.ledger.name,
      openingBalance: balance.openingBalance,
      debitTotal: balance.debitTotal,
      creditTotal: balance.creditTotal,
      closingBalance: balance.closingBalance
    };
    
    trialBalance.entries.push(entry);
    
    if (balance.closingBalance > 0) {
      trialBalance.debitTotal += Math.abs(balance.closingBalance);
    } else {
      trialBalance.creditTotal += Math.abs(balance.closingBalance);
    }
  }
  
  return trialBalance;
}

// Helper function to generate balance sheet
function generateBalanceSheet(ledgerBalances) {
  const balanceSheet = {
    assets: {
      fixed: [],
      current: [],
      total: 0
    },
    liabilities: {
      capital: [],
      longTerm: [],
      current: [],
      total: 0
    }
  };
  
  for (const id in ledgerBalances) {
    const balance = ledgerBalances[id];
    const entry = {
      ledgerCode: balance.ledger.code,
      ledgerName: balance.ledger.name,
      amount: balance.closingBalance
    };
    
    switch (balance.ledger.category) {
      case 'FixedAsset':
        balanceSheet.assets.fixed.push(entry);
        balanceSheet.assets.total += balance.closingBalance;
        break;
      case 'CurrentAsset':
        balanceSheet.assets.current.push(entry);
        balanceSheet.assets.total += balance.closingBalance;
        break;
      case 'Capital':
        balanceSheet.liabilities.capital.push(entry);
        balanceSheet.liabilities.total += Math.abs(balance.closingBalance);
        break;
      case 'LongTermLiability':
        balanceSheet.liabilities.longTerm.push(entry);
        balanceSheet.liabilities.total += Math.abs(balance.closingBalance);
        break;
      case 'CurrentLiability':
        balanceSheet.liabilities.current.push(entry);
        balanceSheet.liabilities.total += Math.abs(balance.closingBalance);
        break;
    }
  }
  
  return balanceSheet;
}

// Helper function to generate income and expense statement
function generateIncomeExpense(ledgerBalances, fromDate, toDate) {
  const statement = {
    income: {
      items: [],
      total: 0
    },
    expense: {
      items: [],
      total: 0
    },
    surplus: 0
  };
  
  for (const id in ledgerBalances) {
    const balance = ledgerBalances[id];
    const entry = {
      ledgerCode: balance.ledger.code,
      ledgerName: balance.ledger.name,
      amount: Math.abs(balance.debitTotal - balance.creditTotal)
    };
    
    if (balance.ledger.category === 'Income') {
      statement.income.items.push(entry);
      statement.income.total += entry.amount;
    } else if (balance.ledger.category === 'Expense') {
      statement.expense.items.push(entry);
      statement.expense.total += entry.amount;
    }
  }
  
  statement.surplus = statement.income.total - statement.expense.total;
  
  return statement;
}