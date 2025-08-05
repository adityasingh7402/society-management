import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import UtilityBill from '../../../models/UtilityBill';
import BillHead from '../../../models/BillHead';
import JournalVoucher from '../../../models/JournalVoucher';
import Ledger from '../../../models/Ledger';

// Helper function to generate unique voucher number
async function generateUniqueVoucherNumber(societyId, billHeadCode, date, session, retryCount = 0) {
  const maxRetries = 10; // Increased from 5 to 10
  const baseDate = date.toISOString().split('T')[0].replace(/-/g, '');
  
  try {
    // Find the last voucher number for this prefix
    const voucherPrefix = `JV/${billHeadCode}/${baseDate}/`;
    const lastVoucher = await mongoose.models.JournalVoucher.findOne({
      societyId,
      voucherNumber: new RegExp('^' + voucherPrefix)
    })
    .sort({ voucherNumber: -1 })
    .session(session);

    // Calculate next sequence number
    let nextSequence = 1;
    if (lastVoucher) {
      const lastSequence = parseInt(lastVoucher.voucherNumber.split('/').pop());
      nextSequence = isNaN(lastSequence) ? 1 : lastSequence + 1;
    }

    // Try current sequence number plus retry offset
    const sequence = nextSequence + retryCount;
    const voucherNumber = `${voucherPrefix}${sequence.toString().padStart(4, '0')}`;

    // Verify the generated number is unique
    const existingVoucher = await mongoose.models.JournalVoucher.findOne({
      societyId,
      voucherNumber
    }).session(session);

    if (!existingVoucher) {
      return voucherNumber;
    }

    if (retryCount < maxRetries) {
      // Add a small delay before retrying to reduce contention
      await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
      return generateUniqueVoucherNumber(societyId, billHeadCode, date, session, retryCount + 1);
    }

    // If we've exhausted retries, try a different approach with timestamp
    const timestamp = Date.now().toString().slice(-4);
    const emergencyVoucherNumber = `${voucherPrefix}${timestamp}`;
    
    const emergencyExists = await mongoose.models.JournalVoucher.findOne({
      societyId,
      voucherNumber: emergencyVoucherNumber
    }).session(session);

    if (!emergencyExists) {
      return emergencyVoucherNumber;
    }

    throw new Error(`Failed to generate unique voucher number after ${maxRetries} retries`);
  } catch (error) {
    if (retryCount < maxRetries) {
      // Add a small delay before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
      return generateUniqueVoucherNumber(societyId, billHeadCode, date, session, retryCount + 1);
    }
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
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
            let unitUsage = billData.unitUsage;
            
            switch (billHead.calculationType) {
              case 'Fixed':
                baseAmount = billHead.fixedAmount;
                unitUsage = 1; // Set default unit usage for fixed amount
                break;
              case 'PerUnit':
                if (!billData.unitUsage || billData.unitUsage <= 0) {
                  results.failed.push({
                    residentId: billData.residentId,
                    error: 'Unit usage is required for per-unit calculation'
                  });
                  continue;
                }
                baseAmount = billData.unitUsage * billHead.perUnitRate;
                unitUsage = billData.unitUsage;
                break;
              case 'Formula':
                if (!billData.unitUsage || billData.unitUsage <= 0) {
                  results.failed.push({
                    residentId: billData.residentId,
                    error: 'Unit usage is required for formula calculation'
                  });
                  continue;
                }
                try {
                  const formula = billHead.formula
                    .replace(/\$\{unitUsage\}/g, billData.unitUsage)
                    .replace(/\$\{rate\}/g, billHead.perUnitRate);
                  baseAmount = eval(formula);
                  unitUsage = billData.unitUsage;
                } catch (error) {
                  results.failed.push({
                    residentId: billData.residentId,
                    error: 'Error calculating formula: ' + error.message
                  });
                  continue;
                }
                break;
              default:
                results.failed.push({
                  residentId: billData.residentId,
                  error: 'Invalid calculation type'
                });
                continue;
            }

            // Calculate GST if applicable
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
            const additionalCharges = Array.isArray(billData.additionalCharges) ? billData.additionalCharges.map(charge => ({
              ...charge,
              chargeType: charge.chargeType && typeof charge.chargeType === 'string' ? charge.chargeType.trim() : '',
              amount: Number(charge.amount) || 0,
              ledgerId: charge.ledgerId
            })) : [];

            // Calculate total amount
            const totalAmount = baseAmount + gstDetails.cgstAmount + gstDetails.sgstAmount + gstDetails.igstAmount + additionalCharges.reduce((sum, c) => sum + (c.amount || 0), 0);

            // Debug log for periodType
            console.log('Creating utility bill with periodType:', billData.periodType);

            // Create utility bill
            const utilityBill = new UtilityBill({
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
              unitUsage: unitUsage, // Use the calculated unitUsage variable
              perUnitRate: billHead.perUnitRate,
              formula: billHead.formula,
              periodType: billData.periodType || 'Monthly', // Explicitly set periodType
              gstDetails,
              latePaymentDetails: billHead.latePaymentConfig,
              totalAmount,
              additionalCharges,
              issueDate: billData.issueDate,
              dueDate: billData.dueDate,
              status: 'Pending',
              createdBy: decoded.id,
              approvedBy: {
                adminId: adminId,
                adminName: adminName,
                approvedAt: new Date()
              }
            });

            // Generate bill number with session
            utilityBill.billNumber = await utilityBill.generateBillNumber(session);
            utilityBill.remainingAmount = utilityBill.totalAmount;
            await utilityBill.save({ session });

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

            // Initialize journal voucher
            let journalVoucher;

            // Create and save journal voucher
            journalVoucher = new JournalVoucher({
              societyId: billData.societyId,
              voucherType: 'Journal',
              voucherNumber: voucherNumber,
              voucherDate: new Date(),
              referenceType: 'Bill',
              referenceId: utilityBill._id,
              referenceNumber: utilityBill.billNumber,
              category: 'Utility',
              subCategory: billHead.subCategory,
              narration: `Bill generated for ${billHead.name} - ${utilityBill.billNumber}`,
              entries: [],  // Initialize empty entries array
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
            if (additionalCharges.length > 0) {
              for (const charge of additionalCharges) {
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

                totalBillAmount += charge.amount;
              }
            }

            // Add single debit entry for total amount
            journalVoucher.entries.push({
              ledgerId: receivableLedger._id,
              type: 'debit',
              amount: totalBillAmount,
              description: `Receivable for ${billHead.name} and additional charges`
            });

            // Update utility bill total amount
            utilityBill.totalAmount = totalBillAmount;

            // Debug log before saving
            console.log('Journal voucher entries:', {
              totalAmount: totalBillAmount,
              entries: journalVoucher.entries.map(e => ({
                type: e.type,
                amount: e.amount,
                ledgerId: e.ledgerId,
                description: e.description
              }))
            });

            await journalVoucher.save({ session });

            // Post entries to ledgers
            for (const entry of journalVoucher.entries) {
              const ledger = await Ledger.findById(entry.ledgerId).session(session);
              if (!ledger) {
                throw new Error(`Ledger not found: ${entry.ledgerId}`);
              }
              
              // Use the updateBalance method instead of directly modifying the balance
              await ledger.updateBalance(entry.amount, entry.type, session);
            }

            // Add journal entry reference to the bill
            utilityBill.journalEntries = [{
              voucherId: journalVoucher._id,
              type: 'Bill',
              amount: totalBillAmount,
              date: new Date()
            }];

            // Save the updated bill
            await utilityBill.save({ session });

            // Add to success results
            results.success.push({
              residentId: billData.residentId,
              billId: utilityBill._id,
              billNumber: utilityBill.billNumber
            });
          } catch (error) {
            console.error(`Error generating bill for resident ${billData.residentId}:`, error);
            results.failed.push({
              residentId: billData.residentId,
              error: error.message
            });
            hasError = true;
          }
        }

        // If any bill failed, abort the transaction
        if (hasError) {
          await session.abortTransaction();
        }
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

      return res.status(200).json({
        message: `Generated ${results.success.length} bills successfully, ${results.failed.length} failed`,
        results
      });

  } catch (error) {
    console.error('Error generating bulk bills:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate bills' });
  }
} 