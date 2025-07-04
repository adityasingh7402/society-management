import connectToDatabase from '../../../lib/mongodb';
import ScheduledBill from '../../../models/ScheduledBill';
import ResidentBill from '../../../models/ResidentBill';
import BillHead from '../../../models/BillHead';
import Resident from '../../../models/Resident';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify cron secret to ensure only authorized calls
  const cronSecret = req.headers['x-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await connectToDatabase();
    
    const today = new Date();
    const currentDay = today.getDate();
    
    // Fetch active scheduled bills that should be generated today
    const scheduledBills = await ScheduledBill.find({
      status: 'Active',
      generateOn: currentDay,
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gt: today } }
      ]
    }).populate('billHeadId');

    const results = {
      total: scheduledBills.length,
      processed: 0,
      success: 0,
      failed: 0,
      errors: []
    };

    for (const schedule of scheduledBills) {
      try {
        results.processed++;
        
        // Get applicable residents based on targeting rules
        const residents = await getApplicableResidents(schedule);
        
        // Generate bills for each resident
        for (const resident of residents) {
          try {
            const billAmount = await calculateBillAmount(schedule, resident);
            
            // Generate bill number
            const billNumber = await generateBillNumber(schedule.societyId);
            
            // Create the bill
            const bill = await ResidentBill.create({
              societyId: schedule.societyId,
              billNumber,
              residentId: resident._id,
              billHeadId: schedule.billHeadId._id,
              scheduledBillId: schedule._id,
              amount: billAmount.baseAmount,
              gstDetails: billAmount.gstDetails,
              issueDate: today,
              dueDate: calculateDueDate(today, schedule.dueAfterDays),
              
              // Store resident details for quick access
              residentDetails: {
                name: resident.name,
                phone: resident.phone,
                email: resident.email,
                flatNumber: resident.flatDetails?.flatNumber,
                blockName: resident.flatDetails?.blockName,
                floorNumber: resident.flatDetails?.floorNumber
              },
              
              // Store bill head details for quick access
              billHeadDetails: {
                code: schedule.billHeadId.code,
                name: schedule.billHeadId.name,
                category: schedule.billHeadId.category,
                calculationType: schedule.billHeadId.calculationType
              }
            });
            
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              residentId: resident._id,
              error: error.message
            });
          }
        }
        
        // Update last generated date
        schedule.lastGeneratedDate = today;
        schedule.nextGenerationDate = calculateNextGenerationDate(schedule);
        schedule.totalGeneratedCount++;
        await schedule.save();
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          scheduleId: schedule._id,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: 'Bill generation completed',
      results
    });
  } catch (error) {
    console.error('Error in bill generation:', error);
    return res.status(500).json({ 
      message: 'Error generating bills',
      error: error.message
    });
  }
}

// Helper function to get applicable residents
async function getApplicableResidents(schedule) {
  let query = {
    societyId: schedule.societyId,
    status: 'Active'
  };

  if (schedule.applicableTo === 'Specific') {
    if (schedule.targetResidents?.length > 0) {
      query._id = { $in: schedule.targetResidents };
    }
    
    if (schedule.targetBlocks?.length > 0) {
      query['flatDetails.blockName'] = { $in: schedule.targetBlocks };
    }
    
    if (schedule.targetFloors?.length > 0) {
      query['flatDetails.floorNumber'] = { $in: schedule.targetFloors };
    }
    
    if (schedule.targetFlatTypes?.length > 0) {
      query['flatDetails.type'] = { $in: schedule.targetFlatTypes };
    }
  }

  return await Resident.find(query);
}

// Helper function to calculate bill amount
async function calculateBillAmount(schedule, resident) {
  const billHead = schedule.billHeadId;
  let baseAmount = 0;
  
  switch (schedule.calculationType) {
    case 'Fixed':
      baseAmount = schedule.fixedAmount;
      break;
      
    case 'PerUnit':
      const area = resident.flatDetails?.area || 0;
      baseAmount = area * schedule.perUnitRate;
      break;
      
    case 'Formula':
      // Evaluate formula with resident data
      const formula = schedule.formula
        .replace('{area}', resident.flatDetails?.area || 0)
        .replace('{members}', resident.familyMembers?.length || 1);
      baseAmount = eval(formula);
      break;
      
    case 'Custom':
      // Use bill head's calculation method
      baseAmount = billHead.calculateCharge(
        resident.flatDetails?.area || 0,
        !resident.isRented
      );
      break;
  }
  
  // Calculate GST if applicable
  const gstDetails = {
    isGSTApplicable: schedule.gstConfig?.isGSTApplicable || false,
    gstType: schedule.gstConfig?.gstType || 'None',
    gstPercentage: schedule.gstConfig?.gstPercentage || 0,
    gstAmount: 0
  };
  
  if (gstDetails.isGSTApplicable) {
    gstDetails.gstAmount = (baseAmount * gstDetails.gstPercentage) / 100;
    baseAmount += gstDetails.gstAmount;
  }
  
  return { baseAmount, gstDetails };
}

// Helper function to generate bill number
async function generateBillNumber(societyId) {
  const date = new Date();
  const prefix = 'BILL/' + 
    date.getFullYear().toString().substr(-2) + 
    ('0' + (date.getMonth() + 1)).slice(-2) + '/';
  
  const lastBill = await ResidentBill.findOne({
    societyId,
    billNumber: new RegExp('^' + prefix)
  }).sort({ billNumber: -1 });
  
  let nextNumber = 1;
  if (lastBill) {
    const lastNumber = parseInt(lastBill.billNumber.split('/').pop());
    nextNumber = lastNumber + 1;
  }
  
  return prefix + ('000' + nextNumber).slice(-4);
}

// Helper function to calculate due date
function calculateDueDate(issueDate, dueAfterDays) {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + dueAfterDays);
  return dueDate;
}

// Helper function to calculate next generation date
function calculateNextGenerationDate(schedule) {
  const today = new Date();
  const nextDate = new Date(today);
  
  switch (schedule.frequency) {
    case 'Monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'Quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'Half-Yearly':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'Yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'Custom':
      nextDate.setDate(nextDate.getDate() + (schedule.customFrequencyDays || 30));
      break;
  }
  
  nextDate.setDate(schedule.generateOn);
  return nextDate;
} 