import connectToDatabase from "../../../lib/mongodb.js";
import mongoose from 'mongoose';
import ScheduledBill from '../../../models/ScheduledBill';
import UtilityBill from '../../../models/UtilityBill';
import MaintenanceBill from '../../../models/MaintenanceBill';
import AmenityBill from '../../../models/AmenityBill';
import JournalVoucher from '../../../models/JournalVoucher';
import Ledger from '../../../models/Ledger';
import BillHead from '../../../models/BillHead'; // Added import for BillHead

// Helper function to generate unique voucher number with retries
async function generateUniqueVoucherNumber(societyId, billHeadCode, date, residentId, session, retryCount = 0) {
  const maxRetries = 10;
  const baseDate = date.toISOString().split('T')[0].replace(/-/g, '');
  
  try {
    // Include residentId in the prefix to ensure uniqueness per resident
    const voucherPrefix = `JV/${billHeadCode}/${baseDate}/${residentId.toString().substr(-4)}/`;
    const lastVoucher = await JournalVoucher.findOne({
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

    // Verify the generated number is unique
    const existingVoucher = await JournalVoucher.findOne({
      societyId,
      voucherNumber
    }).session(session);

    if (!existingVoucher) {
      return voucherNumber;
    }

    if (retryCount < maxRetries) {
      // Add a small delay before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
      return generateUniqueVoucherNumber(societyId, billHeadCode, date, residentId, session, retryCount + 1);
    }

    // If we've exhausted retries, try a different approach with timestamp
    const timestamp = Date.now().toString().slice(-4);
    const emergencyVoucherNumber = `${voucherPrefix}${timestamp}`;
    
    const emergencyExists = await JournalVoucher.findOne({
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
      return generateUniqueVoucherNumber(societyId, billHeadCode, date, residentId, session, retryCount + 1);
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
    await connectToDatabase();

    // Get all active scheduled bills that are due for generation
    const now = new Date();
    console.log('Running scheduled bill generation at:', now.toISOString());

    // TEMPORARILY MODIFIED FOR TESTING - ignore dates
    const scheduledBills = await ScheduledBill.find({
      status: 'Active',
      nextGenerationDate: { $lte: now }  // DISABLED FOR TESTING
    });

    console.log(`Found ${scheduledBills.length} bills to process`);

    const results = {
      success: [],
      failed: []
    };

    for (const scheduledBill of scheduledBills) {
      console.log(`Processing scheduled bill: ${scheduledBill._id} (${scheduledBill.title})`);
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Check if bills already generated for current period
          const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          const existingSuccess = scheduledBill.successHistory.find(
            history => history.period === currentPeriod && history.status === 'Success'
          );

          if (existingSuccess) {
            console.log(`Bills already generated for period ${currentPeriod} for scheduled bill: ${scheduledBill.title}`);
            results.success.push({
              id: scheduledBill._id,
              title: scheduledBill.title,
              billsGenerated: 0,
              billsSkipped: scheduledBill.selectedResidents.length,
              billType: scheduledBill.billHeadDetails.category,
              reason: `Already generated for period ${currentPeriod}`,
              nextGenerationDate: scheduledBill.nextGenerationDate
            });
            return; // Skip this scheduled bill
          }

          // Determine bill model based on category
          let BillModel;
          switch (scheduledBill.billHeadDetails.category) {
            case 'Utility':
              BillModel = UtilityBill;
              break;
            case 'Maintenance':
              BillModel = MaintenanceBill;
              break;
            case 'Amenity':
              BillModel = AmenityBill;
              break;
            default:
              throw new Error(`Unsupported bill type: ${scheduledBill.billHeadDetails.category}`);
          }

          console.log(`Generating ${scheduledBill.billHeadDetails.category} bills for ${scheduledBill.selectedResidents.length} residents`);

          // Calculate base amount based on calculation type
          let baseAmount = 0;
          switch (scheduledBill.billHeadDetails.calculationType) {
            case 'Fixed':
              baseAmount = scheduledBill.billHeadDetails.fixedAmount;
              break;
            case 'PerUnit':
              baseAmount = scheduledBill.unitUsage * scheduledBill.billHeadDetails.perUnitRate;
              break;
            case 'Formula':
              try {
                const formula = scheduledBill.billHeadDetails.formula
                  .replace(/\$\{unitUsage\}/g, scheduledBill.unitUsage)
                  .replace(/\$\{rate\}/g, scheduledBill.billHeadDetails.perUnitRate);
                baseAmount = eval(formula);
              } catch (error) {
                throw new Error('Error calculating formula: ' + error.message);
              }
              break;
          }

          // Generate bills for each resident
          const generatedBills = await Promise.all(
            scheduledBill.selectedResidents.map(async (resident) => {
              const dueDate = new Date(now.getTime() + (scheduledBill.dueDays * 24 * 60 * 60 * 1000));
              
              // Get bill head details to access proper ledger IDs
              const billHead = await BillHead.findById(scheduledBill.billHeadDetails._id).session(session);
              if (!billHead) {
                throw new Error('Bill head not found');
              }

              // Get required ledgers from bill head accounting config
              const incomeLedger = await Ledger.findById(billHead.accountingConfig.incomeLedgerId).session(session);
              if (!incomeLedger) {
                throw new Error('Income ledger not found');
              }
              const receivableLedger = await Ledger.findById(billHead.accountingConfig.receivableLedgerId).session(session);
              if (!receivableLedger) {
                throw new Error('Receivable ledger not found');
              }

              // Get GST ledger if applicable
              let gstLedger;
              if (scheduledBill.gstDetails.isGSTApplicable) {
                gstLedger = await Ledger.findById(billHead.accountingConfig.gstLedgerId).session(session);
                if (!gstLedger) {
                  throw new Error('GST ledger not found');
                }
              }
              
              const billData = {
                societyId: scheduledBill.societyId,
                billHeadId: scheduledBill.billHeadDetails._id,
                flatNumber: resident.flatNumber,
                blockName: resident.blockName,
                floorNumber: resident.floorNumber,
                residentId: resident.residentId,
                ownerName: resident.ownerName,
                ownerMobile: resident.ownerMobile,
                ownerEmail: resident.ownerEmail,
                baseAmount: baseAmount,
                unitUsage: scheduledBill.unitUsage,
                perUnitRate: scheduledBill.billHeadDetails.perUnitRate,
                formula: scheduledBill.billHeadDetails.formula,
                periodType: scheduledBill.periodType,
                gstDetails: scheduledBill.gstDetails,
                latePaymentDetails: scheduledBill.latePaymentConfig,
                totalAmount: scheduledBill.totalAmount,
                additionalCharges: scheduledBill.additionalCharges || [],
                issueDate: now,
                dueDate: dueDate,
                status: 'Pending',
                createdBy: scheduledBill.createdBy,
                approvedBy: {
                  adminId: scheduledBill.createdBy,
                  adminName: scheduledBill.approvedBy?.adminName || 'System',
                  approvedAt: now
                },
                // Add reference to scheduled bill
                scheduledBillReference: {
                  scheduledBillId: scheduledBill._id,
                  scheduledBillTitle: scheduledBill.title,
                  generatedAt: now
                }
              };

              const bill = new BillModel(billData);
              bill.billNumber = await bill.generateBillNumber(session);
              bill.remainingAmount = bill.totalAmount;

              // Generate voucher number with retries and resident info
              const voucherNumber = await generateUniqueVoucherNumber(
                scheduledBill.societyId,
                scheduledBill.billHeadDetails.code,
                now,
                resident.residentId,
                session
              );

              console.log(`Generated voucher number for resident ${resident.residentId}: ${voucherNumber}`);

              // Create journal voucher with all required fields
              const journalVoucher = new JournalVoucher({
                societyId: scheduledBill.societyId,
                voucherNumber,
                voucherType: 'Journal',
                voucherDate: now,
                referenceType: 'Bill',
                referenceId: bill._id,
                referenceNumber: bill.billNumber,
                category: scheduledBill.billHeadDetails.category,
                subCategory: scheduledBill.billHeadDetails.subCategory,
                narration: `Auto-generated ${scheduledBill.billHeadDetails.category} bill for ${scheduledBill.title}`,
                entries: [],
                gstDetails: {
                  isGSTApplicable: scheduledBill.gstDetails.isGSTApplicable,
                  gstType: 'Regular',
                  gstMonth: now,
                  gstEntries: []
                },
                status: 'Active',
                approvalStatus: 'Approved',
                approvalWorkflow: [{
                  action: 'Created',
                  userId: scheduledBill.createdBy,
                  remarks: 'Auto-generated by scheduled bill',
                  timestamp: now
                }],
                createdBy: scheduledBill.createdBy,
                tags: [scheduledBill.billHeadDetails.category, scheduledBill.billHeadDetails.subCategory],
                approvedBy: {
                  adminId: scheduledBill.createdBy,
                  adminName: 'System',
                  approvedAt: now
                }
              });

              // Add credit entries first - Base amount
              journalVoucher.entries.push({
                ledgerId: incomeLedger._id,
                type: 'credit',
                amount: baseAmount,
                description: `Bill for ${scheduledBill.title}`
              });

              // Add GST entries if applicable
              if (scheduledBill.gstDetails.isGSTApplicable) {
                if (scheduledBill.gstDetails.cgstAmount > 0) {
                  journalVoucher.entries.push({
                    ledgerId: gstLedger._id,
                    type: 'credit',
                    amount: scheduledBill.gstDetails.cgstAmount,
                    description: `CGST (${scheduledBill.gstDetails.cgstPercentage}%) for ${scheduledBill.title}`
                  });

                  // Add to GST entries
                  journalVoucher.gstDetails.gstEntries.push({
                    type: 'CGST',
                    percentage: scheduledBill.gstDetails.cgstPercentage,
                    amount: scheduledBill.gstDetails.cgstAmount,
                    ledgerId: gstLedger._id
                  });
                }

                if (scheduledBill.gstDetails.sgstAmount > 0) {
                  journalVoucher.entries.push({
                    ledgerId: gstLedger._id,
                    type: 'credit',
                    amount: scheduledBill.gstDetails.sgstAmount,
                    description: `SGST (${scheduledBill.gstDetails.sgstPercentage}%) for ${scheduledBill.title}`
                  });

                  // Add to GST entries
                  journalVoucher.gstDetails.gstEntries.push({
                    type: 'SGST',
                    percentage: scheduledBill.gstDetails.sgstPercentage,
                    amount: scheduledBill.gstDetails.sgstAmount,
                    ledgerId: gstLedger._id
                  });
                }

                if (scheduledBill.gstDetails.igstAmount > 0) {
                  journalVoucher.entries.push({
                    ledgerId: gstLedger._id,
                    type: 'credit',
                    amount: scheduledBill.gstDetails.igstAmount,
                    description: `IGST (${scheduledBill.gstDetails.igstPercentage}%) for ${scheduledBill.title}`
                  });

                  // Add to GST entries
                  journalVoucher.gstDetails.gstEntries.push({
                    type: 'IGST',
                    percentage: scheduledBill.gstDetails.igstPercentage,
                    amount: scheduledBill.gstDetails.igstAmount,
                    ledgerId: gstLedger._id
                  });
                }
              }

              // Add additional charges
              for (const charge of scheduledBill.additionalCharges || []) {
                journalVoucher.entries.push({
                  ledgerId: charge.ledgerId,
                  type: 'credit',
                  amount: charge.amount,
                  description: `${charge.chargeType} for ${scheduledBill.title}`
                });
              }

              // Calculate total credit amount
              const totalCredit = journalVoucher.entries
                .filter(e => e.type === 'credit')
                .reduce((sum, e) => sum + e.amount, 0);

              // Add single debit entry for total
              journalVoucher.entries.push({
                ledgerId: receivableLedger._id,
                type: 'debit',
                amount: totalCredit,
                description: `Total receivable for ${scheduledBill.title}`
              });

              // Save the journal voucher
              await journalVoucher.save({ session });

              // Update ledger balances for all entries
              for (const entry of journalVoucher.entries) {
                const ledger = await Ledger.findById(entry.ledgerId).session(session);
                if (ledger) {
                  await ledger.updateBalance(entry.amount, entry.type, session);
                  console.log(`Updated ledger ${ledger.name} with ${entry.type} amount: ${entry.amount}`);
                } else {
                  console.warn(`Ledger not found for ID: ${entry.ledgerId}`);
                }
              }

              // Add journal entry reference to bill
              bill.journalEntries = [{
                voucherId: journalVoucher._id,
                type: 'Bill',
                amount: scheduledBill.totalAmount,
                date: now
              }];

              await bill.save({ session });
              return bill;
            })
          );

          console.log(`Successfully generated ${generatedBills.length} bills`);

          // Update scheduled bill
          scheduledBill.lastGenerationDate = now;
          scheduledBill.nextGenerationDate = scheduledBill.calculateNextGenerationDate();
          scheduledBill.generationHistory.push({
            generatedAt: now,
            billsGenerated: generatedBills.length,
            status: 'Success'
          });

          // Add to success history for duplicate prevention
          scheduledBill.successHistory.push({
            generationDate: now,
            billIds: generatedBills.map(bill => bill._id),
            period: currentPeriod,
            status: 'Success',
            billsGenerated: generatedBills.length,
            billType: scheduledBill.billHeadDetails.category
          });

          await scheduledBill.save({ session });

          results.success.push({
            id: scheduledBill._id,
            title: scheduledBill.title,
            billsGenerated: generatedBills.length,
            billType: scheduledBill.billHeadDetails.category,
            nextGenerationDate: scheduledBill.nextGenerationDate
          });
        });
      } catch (error) {
        console.error(`Error generating bills for scheduled bill ${scheduledBill._id}:`, error);
        
        // Record failed generation attempt
        scheduledBill.generationHistory.push({
          generatedAt: now,
          status: 'Failed',
          error: error.message
        });
        await scheduledBill.save();

        results.failed.push({
          id: scheduledBill._id,
          title: scheduledBill.title,
          error: error.message
        });
      } finally {
        await session.endSession();
      }
    }

    console.log('Bill generation completed:', {
      successCount: results.success.length,
      failedCount: results.failed.length
    });

    return res.status(200).json({
      message: 'Scheduled bills generation completed',
      results
    });

  } catch (error) {
    console.error('Error in generate-monthly-bills:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 