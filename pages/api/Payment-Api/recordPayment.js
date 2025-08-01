import mongoose from 'mongoose';
import AmenityBill from '../../../models/AmenityBill';  // Import AmenityBill first
import MaintenanceBill from '../../../models/MaintenanceBill';
import UtilityBill from '../../../models/UtilityBill';
import BillHead from '../../../models/BillHead';  // Add missing BillHead import
import PaymentEntry from '../../../models/PaymentEntry';  // Import PaymentEntry after bill models
import Ledger from '../../../models/Ledger';
import JournalVoucher from '../../../models/JournalVoucher';
import Wallet from '../../../models/Wallet';
import WalletTransaction from '../../../models/WalletTransaction';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Use verifyToken helper instead of direct jwt verification
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Connect to MongoDB if not connected
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Log received data for debugging
    console.log('Received payment data:', req.body);

    const { 
      billId, 
      amount, 
      paymentMethod, 
      transactionId, 
      paymentDate, 
      notes,
      billType // Add billType to determine which bill model to use
    } = req.body;
    console.log('billType', billType);

    // Validate required fields with specific error messages
    const missingFields = [];
    if (!billId) missingFields.push('billId');
    if (!amount) missingFields.push('amount');
    if (!paymentMethod) missingFields.push('paymentMethod');
    if (!billType) missingFields.push('billType');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}`,
        receivedData: req.body 
      });
    }

    // Find the bill based on billType
    let BillModel;
    switch (billType) {
      case 'MaintenanceBill':
        BillModel = MaintenanceBill;
        break;
      case 'AmenityBill':
        BillModel = AmenityBill;
        break;
      case 'UtilityBill':
        BillModel = UtilityBill;
        break;
      default:
        return res.status(400).json({ error: `Invalid bill type: ${billType}` });
    }
    const bill = await BillModel.findById(billId);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Validate amount is positive
    if (amount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0' });
    }

    // Find or create the necessary ledgers - NO SESSION
    const paymentLedger = await getPaymentLedger(bill.societyId, paymentMethod, decoded.id);
    const receivableLedger = await getReceivableLedger(bill, decoded.id, billType);

    if (!paymentLedger || !receivableLedger) {
      throw new Error('Required ledgers not found or could not be created');
    }

    // Generate voucher number with retry
    let voucherNumber;
    try {
      voucherNumber = await JournalVoucher.generateVoucherNumber(
        bill.societyId,
        'RCP',
        new Date(paymentDate || new Date())
      );
    } catch (error) {
      console.error('Error generating voucher number:', error);
      // Fallback to a timestamp-based number if generation fails
      const timestamp = new Date().getTime();
      voucherNumber = `RCP/${timestamp}`;
    }

    // Create journal voucher for the payment
    const journalVoucher = new JournalVoucher({
      societyId: bill.societyId,
      voucherNumber,
      voucherType: 'Receipt',
      voucherDate: new Date(paymentDate || new Date()),
      referenceType: 'Payment',
      category: billType === 'MaintenanceBill' ? 'Maintenance' : billType === 'AmenityBill' ? 'Amenity' : 'Utility',
      narration: `Payment received for bill ${bill.billNumber}`,
      entries: [
        {
          ledgerId: paymentLedger._id,
          type: 'debit',
          amount,
          description: `Payment received via ${paymentMethod}`
        },
        {
          ledgerId: receivableLedger._id,
          type: 'credit',
          amount,
          description: `Payment against bill ${bill.billNumber}`
        }
      ],
      status: 'Active',
      approvalStatus: 'Approved',
      approvalWorkflow: [{
        action: 'Created',
        userId: decoded.id,
        remarks: 'Auto-approved on payment',
        timestamp: new Date()
      }],
      createdBy: decoded.id
    });

    // Save the journal voucher - NO SESSION
    await journalVoucher.save();

    // Create payment entry
    const payment = new PaymentEntry({
      billId,
      amount,
      paymentMode: paymentMethod, // Map paymentMethod to paymentMode
      transactionId,
      paymentDate: paymentDate || new Date(),
      notes,
      societyId: bill.societyId,
      residentId: bill.residentId,
      status: 'Approved', // Set default status
      maker: {
        userId: decoded.id,
        name: decoded.name,
        timestamp: new Date(),
        remarks: notes || 'Payment recorded'
      },
      voucherId: journalVoucher._id, // Link to the journal voucher
      createdBy: decoded.id,
      billType: billType // Must be one of: 'MaintenanceBill', 'AmenityBill', 'UtilityBill'
    });

    // Log payment data before saving
    console.log('Saving payment with data:', {
      billId: payment.billId,
      amount: payment.amount,
      billType: payment.billType,
      societyId: payment.societyId,
      residentId: payment.residentId
    });

    // Save payment entry - NO SESSION
    await payment.save();

    // Handle wallet payment - deduct from wallet and create transaction
    if (paymentMethod === 'Wallet') {
      console.log('Processing wallet payment for resident:', bill.residentId);
      const wallet = await Wallet.findOne({ residentId: bill.residentId });
      
      if (!wallet) {
        throw new Error('Wallet not found for resident');
      }

      console.log('Wallet found. Current balance:', wallet.currentBalance, 'Payment amount:', amount);
      
      // Ensure wallet has sufficient balance
      if (wallet.currentBalance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Store balance before deduction for transaction record
      const balanceBefore = wallet.currentBalance;
      
      // Debit wallet
      wallet.updateBalance(amount, 'debit');
      console.log('Wallet balance after deduction:', wallet.currentBalance);
      
      // Create wallet transaction with correct balance values
      const walletTransaction = new WalletTransaction({
        walletId: wallet._id,
        residentId: bill.residentId,
        societyId: bill.societyId,
        transactionFlow: 'DEBIT',
        amount,
        balanceBefore: balanceBefore,
        balanceAfter: wallet.currentBalance,
        type: billType === 'MaintenanceBill' ? 'MAINTENANCE_PAYMENT' : 
              billType === 'AmenityBill' ? 'AMENITY_PAYMENT' : 'UTILITY_PAYMENT',
        description: `${billType} payment for bill ${bill.billNumber}`,
        billDetails: {
          billId: bill._id,
          billType: billType,
          billNumber: bill.billNumber,
          dueDate: bill.dueDate
        },
        createdBy: decoded.id
      });

      console.log('Saving wallet and wallet transaction...');
      await wallet.save();
      await walletTransaction.save();
      console.log('Wallet and wallet transaction saved successfully');
    }

    // Update bill payment status
    bill.paidAmount = (bill.paidAmount || 0) + amount;
    bill.status = bill.paidAmount >= bill.totalAmount ? 'Paid' : 'Partially Paid';
    bill.paymentHistory.push({
      amount,
      paymentDate: paymentDate || new Date(),
      paymentMethod: paymentMethod,
      transactionId,
      notes,
      recordedBy: decoded.id,
      makerName: decoded.name || 'Admin',
      makerContact: decoded.phone || null,
      makerEmail: decoded.email || null
    });

    // Add journal entry reference
    bill.journalEntries.push({
      voucherId: journalVoucher._id,
      type: 'Payment',
      amount,
      date: new Date(paymentDate || new Date())
    });

    // Save bill - NO SESSION
    await bill.save();

    // Update ledger balances manually - NO SESSION
    await updateLedgerBalance(paymentLedger._id, amount, 'debit');
    await updateLedgerBalance(receivableLedger._id, amount, 'credit');

    return res.status(200).json({ 
      success: true, 
      data: {
        payment,
        journalVoucher,
        bill
      },
      message: 'Payment recorded successfully' 
    });

  } catch (error) {
    console.error('Error in recordPayment:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to record payment' 
    });
  }
}

// Helper function to get the appropriate payment ledger (Cash, Bank, or Wallet)
async function getPaymentLedger(societyId, paymentMethod, userId) {
  const Ledger = mongoose.model('Ledger');
  
  let category = 'Bank';
  let code = 'BANK';
  let name = 'Bank Account';
  
  if (paymentMethod === 'Cash') {
    category = 'Cash';
    code = 'CASH';
    name = 'Cash Account';
  } else if (paymentMethod === 'Wallet') {
    category = 'Bank';  // Wallet is categorized as Bank (online payment)
    code = 'WALLET';
    name = 'Wallet Account';
  }
  
  // Try to find existing ledger
  let ledger = await Ledger.findOne({
    societyId,
    category,
    status: 'Active'
  });
  
  // Create if not exists
  if (!ledger) {
    ledger = new Ledger({
      societyId,
      code,
      name,
      type: 'Asset',
      category,
      description: `Default ${category} Account`,
      openingBalance: 0,
      currentBalance: 0,
      status: 'Active',
      createdBy: userId
    });
    
    await ledger.save();
  }
  
  return ledger;
}

// Helper function to get the receivable ledger for bills
async function getReceivableLedger(bill, userId, billType) {
  const Ledger = mongoose.model('Ledger');
  const BillHead = mongoose.model('BillHead');
  
  // Try to get bill head to find linked receivable ledger
  const billHead = await BillHead.findById(bill.billHeadId);
  
  if (billHead && billHead.accountingConfig && billHead.accountingConfig.receivableLedgerId) {
    const ledger = await Ledger.findById(billHead.accountingConfig.receivableLedgerId);
    if (ledger) return ledger;
  }
  
  // If not found, try to find a generic receivable ledger based on bill type
  let category, code, name;
  switch (billType) {
    case 'MaintenanceBill':
      category = 'Maintenance';
      code = 'MNTREC';
      name = 'Maintenance Receivables';
      break;
    case 'AmenityBill':
      category = 'Amenity';
      code = 'AMNREC';
      name = 'Amenity Receivables';
      break;
    case 'UtilityBill':
      category = 'Utility';
      code = 'UTLREC';
      name = 'Utility Receivables';
      break;
    default:
      throw new Error(`Invalid bill type: ${billType}`);
  }

  let ledger = await Ledger.findOne({
    societyId: bill.societyId,
    category: 'Receivable',
    billCategory: category,
    status: 'Active'
  });
  
  // Create if not exists
  if (!ledger) {
    ledger = new Ledger({
      societyId: bill.societyId,
      code,
      name,
      type: 'Asset',
      category: 'Receivable',
      billCategory: category,
      description: `Default ${category} Receivables Account`,
      openingBalance: 0,
      currentBalance: 0,
      status: 'Active',
      createdBy: userId
    });
    
    await ledger.save();
  }
  
  return ledger;
}

// Helper function to update ledger balance manually
async function updateLedgerBalance(ledgerId, amount, type) {
  const Ledger = mongoose.model('Ledger');
  const ledger = await Ledger.findById(ledgerId);
  
  if (!ledger) {
    throw new Error(`Ledger not found: ${ledgerId}`);
  }
  
  if (type === 'debit') {
    switch(ledger.type) {
      case 'Asset':
      case 'Expense':
        ledger.currentBalance += amount;
        break;
      case 'Liability':
      case 'Income':
      case 'Equity':
        ledger.currentBalance -= amount;
        break;
    }
  } else { // credit
    switch(ledger.type) {
      case 'Asset':
      case 'Expense':
        ledger.currentBalance -= amount;
        break;
      case 'Liability':
      case 'Income':
      case 'Equity':
        ledger.currentBalance += amount;
        break;
    }
  }
  
  await ledger.save();
} 