import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import AmenityBill from '../../../models/AmenityBill';
import BillHead from '../../../models/BillHead';
import JournalVoucher from '../../../models/JournalVoucher';
import Ledger from '../../../models/Ledger';
import { logActionDirect, logSuccess, logFailure } from '../../../services/loggingService';

// Helper function to extract client IP address
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown';
}

// Helper function to generate unique voucher number
async function generateUniqueVoucherNumber(societyId, billHeadCode, date, session, retryCount = 0) {
  const maxRetries = 10;
  const baseDate = date.toISOString().split('T')[0].replace(/-/g, '');
  
  try {
    const voucherPrefix = `JV/${billHeadCode}/${baseDate}/`;
    const lastVoucher = await mongoose.models.JournalVoucher.findOne({
      societyId,
      voucherNumber: new RegExp('^' + voucherPrefix)
    })
    .sort({ voucherNumber: -1 })
    .session(session);

    let nextSequence = 1;
    if (lastVoucher) {
      const lastSequence = parseInt(lastVoucher.voucherNumber.split('/').pop());
      nextSequence = isNaN(lastSequence) ? 1 : lastSequence + 1;
    }

    const sequence = nextSequence + retryCount;
    const voucherNumber = `${voucherPrefix}${sequence.toString().padStart(4, '0')}`;

    const existingVoucher = await mongoose.models.JournalVoucher.findOne({
      societyId,
      voucherNumber
    }).session(session);

    if (!existingVoucher) {
      return voucherNumber;
    }

    if (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
      return generateUniqueVoucherNumber(societyId, billHeadCode, date, session, retryCount + 1);
    }

    const timestamp = Date.now().toString().slice(-4);
    return `${voucherPrefix}${sequence}${timestamp}`;

  } catch (error) {
    console.error('Error generating voucher number:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        throw new Error('Invalid token payload');
      }
    } catch (tokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Extract admin details from token
    const adminId = decoded.id;
    const adminName = decoded.name || 'Admin';

    // Check if MongoDB is connected, if not connect
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { bills } = req.body;

    if (!Array.isArray(bills) || bills.length === 0) {
      return res.status(400).json({ error: 'No bills provided for generation' });
    }

    // Process bills in batches to avoid overwhelming the database
    const results = {
      success: [],
      failed: []
    };

    // Start a session for transaction
    const session = await mongoose.startSession();
    let hasError = false;
    
    try {
      await session.withTransaction(async () => {
        // Process each bill
        for (const billData of bills) {
          try {
            // Validate required fields
            if (!billData.societyId || !billData.billHeadId || !billData.residentId) {
              results.failed.push({
                residentId: billData.residentId,
                error: 'Missing required fields'
              });
              continue;
            }

            // Get bill head details
            const billHead = await BillHead.findById(billData.billHeadId).session(session);
            if (!billHead) {
              results.failed.push({
                residentId: billData.residentId,
                error: 'Bill head not found'
              });
              continue;
            }

            // Get required ledgers
            const incomeLedger = await Ledger.findById(billHead.accountingConfig.incomeLedgerId).session(session);
            if (!incomeLedger) {
              results.failed.push({
                residentId: billData.residentId,
                error: 'Income ledger not found'
              });
              continue;
            }
            const receivableLedger = await Ledger.findById(billHead.accountingConfig.receivableLedgerId).session(session);
            if (!receivableLedger) {
              results.failed.push({
                residentId: billData.residentId,
                error: 'Receivable ledger not found'
              });
              continue;
            }

            // Calculate base amount
            let baseAmount = 0;
            switch (billHead.calculationType) {
              case 'Fixed':
                baseAmount = billHead.fixedAmount;
                break;
              case 'PerUnit':
                baseAmount = billData.unitUsage * billHead.perUnitRate;
                break;
              case 'Formula':
                // Implement formula calculation if needed
                break;
              default:
                results.failed.push({
                  residentId: billData.residentId,
                  error: 'Invalid calculation type'
                });
                continue;
            }

            // Calculate GST
            const gstDetails = {
              isGSTApplicable: billHead.gstConfig.isGSTApplicable,
              cgstPercentage: billHead.gstConfig.cgstPercentage,
              sgstPercentage: billHead.gstConfig.sgstPercentage,
              igstPercentage: billHead.gstConfig.igstPercentage,
              cgstAmount: 0,
              sgstAmount: 0,
              igstAmount: 0
            };

            let gstLedger;
            if (gstDetails.isGSTApplicable) {
              gstDetails.cgstAmount = (baseAmount * gstDetails.cgstPercentage) / 100;
              gstDetails.sgstAmount = (baseAmount * gstDetails.sgstPercentage) / 100;
              gstDetails.igstAmount = (baseAmount * gstDetails.igstPercentage) / 100;

              gstLedger = await Ledger.findById(billHead.accountingConfig.gstLedgerId).session(session);
              if (!gstLedger) {
                results.failed.push({
                  residentId: billData.residentId,
                  error: 'GST ledger not found'
                });
                continue;
              }
            }

            // Additional charges (normalize and validate)
            const additionalCharges = Array.isArray(billData.additionalCharges) ? billData.additionalCharges.map(async (charge) => {
              // Get the bill head for this charge to use its subCategory
              const chargeBillHead = await BillHead.findById(charge.billHeadId).session(session);
              return {
                ...charge,
                chargeType: chargeBillHead?.subCategory || 'Miscellaneous',
                amount: Number(charge.amount) || 0,
                ledgerId: charge.ledgerId
              };
            }) : [];
            
            // Resolve all the async operations
            const resolvedAdditionalCharges = await Promise.all(additionalCharges);

            // Calculate total amount
            const totalAmount = baseAmount + gstDetails.cgstAmount + gstDetails.sgstAmount + gstDetails.igstAmount + resolvedAdditionalCharges.reduce((sum, c) => sum + (c.amount || 0), 0);

            // Create amenity bill
            const amenityBill = new AmenityBill({
              societyId: billData.societyId,
              billHeadId: billData.billHeadId,
              flatNumber: billData.flatNumber,
              blockName: billData.blockName,
              floorNumber: billData.floorNumber,
              residentId: billData.residentId,
              ownerName: billData.ownerName,
              ownerMobile: billData.ownerMobile,
              ownerEmail: billData.ownerEmail,
              baseAmount,
              unitUsage: billData.unitUsage,
              perUnitRate: billHead.perUnitRate,
              formula: billHead.formula,
              gstDetails,
              latePaymentDetails: billHead.latePaymentConfig,
              totalAmount,
              additionalCharges: resolvedAdditionalCharges,
              issueDate: billData.issueDate,
              dueDate: billData.dueDate,
              periodType: billData.periodType || 'Monthly',  // Set default value
              status: 'Pending',
              createdBy: decoded.id,
              approvedBy: {
                adminId: adminId,
                adminName: adminName,
                approvedAt: new Date()
              }
            });

            // Generate bill number with session
            amenityBill.billNumber = await amenityBill.generateBillNumber(session);
            amenityBill.remainingAmount = amenityBill.totalAmount;
            await amenityBill.save({ session });

            // Generate a unique voucher number
            const voucherNumber = await generateUniqueVoucherNumber(
              billData.societyId,
              billHead.code,
              new Date(),
              session
            );

            // Initialize total amount for all charges
            let totalBillAmount = baseAmount;

            // Add GST to total if applicable
            if (gstDetails.isGSTApplicable) {
              totalBillAmount += gstDetails.cgstAmount + gstDetails.sgstAmount + gstDetails.igstAmount;
            }

            // Create journal voucher
            const journalVoucher = new JournalVoucher({
              societyId: billData.societyId,
              voucherType: 'Journal',
              voucherNumber: voucherNumber,
              voucherDate: new Date(),
              referenceType: 'Bill',
              referenceId: amenityBill._id,
              referenceNumber: amenityBill.billNumber,
              category: 'Amenity',
              subCategory: billHead.subCategory,
              narration: `Bill generated for ${billHead.name} - ${amenityBill.billNumber}`,
              entries: [],
              gstDetails: {
                isGSTApplicable: billHead.gstConfig.isGSTApplicable,
                gstType: 'Regular',
                gstMonth: new Date(),
                gstEntries: []
              },
              status: 'Active',
              approvalStatus: 'Approved',
              approvalWorkflow: [{
                action: 'Created',
                userId: decoded.id,
                remarks: 'Auto-approved on bill generation',
                timestamp: new Date()
              }],
              createdBy: decoded.id,
              tags: [`${billHead.category}`, `${billHead.subCategory}`],
              approvedBy: {
                adminId: adminId,
                adminName: adminName,
                approvedAt: new Date()
              }
            });

            // Add credit entries first
            // Base amount credit entry
            journalVoucher.entries.push({
              ledgerId: incomeLedger._id,
              type: 'credit',
              amount: baseAmount,
              description: `Bill for ${billHead.name}`
            });

            // Add GST credit entries if applicable
            if (gstDetails.isGSTApplicable) {
              if (!gstLedger) {
                throw new Error('GST ledger not found');
              }

              // Add CGST entry
              if (gstDetails.cgstAmount > 0) {
                journalVoucher.entries.push({
                  ledgerId: gstLedger._id,
                  type: 'credit',
                  amount: gstDetails.cgstAmount,
                  description: `CGST (${gstDetails.cgstPercentage}%) for ${billHead.name}`
                });
              }

              // Add SGST entry
              if (gstDetails.sgstAmount > 0) {
                journalVoucher.entries.push({
                  ledgerId: gstLedger._id,
                  type: 'credit',
                  amount: gstDetails.sgstAmount,
                  description: `SGST (${gstDetails.sgstPercentage}%) for ${billHead.name}`
                });
              }

              // Add IGST entry
              if (gstDetails.igstAmount > 0) {
                journalVoucher.entries.push({
                  ledgerId: gstLedger._id,
                  type: 'credit',
                  amount: gstDetails.igstAmount,
                  description: `IGST (${gstDetails.igstPercentage}%) for ${billHead.name}`
                });
              }
            }

            // Add additional charges credit entries
            if (resolvedAdditionalCharges.length > 0) {
              for (const charge of resolvedAdditionalCharges) {
                const chargeLedger = await Ledger.findById(charge.ledgerId).session(session);
                if (!chargeLedger) {
                  throw new Error(`Ledger not found for additional charge: ${charge.chargeType}`);
                }

                // Add credit entry for additional charge
                journalVoucher.entries.push({
                  ledgerId: charge.ledgerId,
                  type: 'credit',
                  amount: charge.amount,
                  description: `Additional Charge: ${charge.chargeType}`
                });
              }
            }

            // Calculate total credit (total amount)
            const totalCredit = journalVoucher.entries
              .filter(e => e.type === 'credit')
              .reduce((sum, e) => sum + e.amount, 0);

            // Add single debit entry for total amount
            journalVoucher.entries.unshift({
              ledgerId: receivableLedger._id,
              type: 'debit',
              amount: totalCredit,
              description: `Receivable for ${billHead.name} and additional charges`
            });

            // Update amenity bill total amount
            amenityBill.totalAmount = totalCredit;

            await journalVoucher.save({ session });

            // Post entries to ledgers
            for (const entry of journalVoucher.entries) {
              const ledger = await Ledger.findById(entry.ledgerId).session(session);
              if (!ledger) {
                throw new Error(`Ledger not found: ${entry.ledgerId}`);
              }
              
              await ledger.updateBalance(entry.amount, entry.type, session);
            }

            // Add journal entry reference to the bill
            amenityBill.journalEntries = [{
              voucherId: journalVoucher._id,
              type: 'Bill',
              amount: totalBillAmount,
              date: new Date()
            }];

            // Save the updated bill
            await amenityBill.save({ session });

            // Add to success results with more details
            results.success.push({
              residentId: billData.residentId,
              billId: amenityBill._id,
              billNumber: amenityBill.billNumber,
              flatNumber: billData.flatNumber,
              blockName: billData.blockName,
              ownerName: billData.ownerName,
              totalAmount: amenityBill.totalAmount
            });
          } catch (error) {
            console.error(`Error generating bill for resident ${billData.residentId}:`, error);
            
            // Log the individual bill generation failure
            await logFailure(
              'AMENITY_BILL_CREATE',
              req,
              error.message,
              {
                residentId: billData.residentId,
                societyId: billData.societyId,
                billHeadId: billData.billHeadId,
                errorStack: error.stack
              },
              error.code,
              error.stack
            );
            
            results.failed.push({
              residentId: billData.residentId,
              error: error.message
            });
            hasError = true;
          }
        }

        // Don't abort transaction for individual bill failures - we want to save successful ones
        // Transaction will only abort if there's a critical system error
      });

    } catch (error) {
      console.error('Error in transaction:', error);
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      await session.endSession();
    }

    // Log successful bulk bill generation with detailed resident information
    if (results.success.length > 0) {
      await logSuccess(
        'AMENITY_BULK_BILLS_CREATE',
        req,
        {
          successfulBills: results.success.length,
          failedBills: results.failed.length,
          totalBills: bills.length,
          generatedBills: results.success.map(bill => ({
            residentId: bill.residentId,
            billId: bill.billId,
            billNumber: bill.billNumber,
            // Find the original bill data to get more details
            ...(() => {
              const originalBill = bills.find(b => b.residentId === bill.residentId);
              return {
                flatNumber: originalBill?.flatNumber,
                blockName: originalBill?.blockName,
                ownerName: originalBill?.ownerName,
                totalAmount: originalBill?.totalAmount || 'N/A'
              };
            })()
          })),
          failedBills: results.failed
        }
      );
    }
    
    // Log failures if any occurred
    if (results.failed.length > 0) {
      await logFailure(
        'AMENITY_BULK_BILLS_CREATE',
        req,
        `${results.failed.length} bills failed to generate`,
        {
          successfulBills: results.success.length,
          failedBills: results.failed.length,
          totalBills: bills.length,
          failures: results.failed
        }
      );
    }

    return res.status(200).json({
      message: `Generated ${results.success.length} bills successfully, ${results.failed.length} failed`,
      results
    });

  } catch (error) {
    console.error('Error generating bulk bills:', error);
    
    // Log the bulk bill generation failure
    await logFailure(
      'AMENITY_BULK_BILLS_CREATE',
      req,
      error.message,
      {
        billsCount: req.body?.bills?.length || 0,
        errorStack: error.stack
      },
      error.code,
      error.stack
    );
    
    return res.status(500).json({ error: error.message || 'Failed to generate bills' });
  }
} 