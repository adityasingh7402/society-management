import connectToDatabase from '../../../lib/mongodb';
import PaymentEntry from '../../../models/PaymentEntry';
import mongoose from 'mongoose';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    
    // Verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { 
      societyId, 
      status, 
      billType, 
      paymentMode,
      fromDate, 
      toDate, 
      block,
      floor,
      flatNumber,
      residentMobile,
      residentName,
      page = 1, 
      limit = 50 
    } = req.query;

    // Build filter object - use societyId from query params (which is now _id)
    const filterSocietyId = societyId || decoded.societyId;
    if (!filterSocietyId) {
      return res.status(400).json({ message: 'Society ID is required' });
    }
    
    // Convert societyId to ObjectId if it looks like one, otherwise treat as string
    let societyFilter;
    if (mongoose.Types.ObjectId.isValid(filterSocietyId) && filterSocietyId.length === 24) {
      societyFilter = new mongoose.Types.ObjectId(filterSocietyId);
    } else {
      societyFilter = filterSocietyId;
    }
    
    const filter = { societyId: societyFilter };

    // Add optional filters
    if (status && status !== 'all') {
      filter.status = status;
    }

    if (billType && billType !== 'all') {
      filter.billType = billType;
    }

    if (paymentMode && paymentMode !== 'all') {
      filter.paymentMode = paymentMode;
    }

    // Date range filter
    if (fromDate || toDate) {
      filter.paymentDate = {};
      if (fromDate) {
        filter.paymentDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.paymentDate.$lte = new Date(toDate);
      }
    }

    // Block filter
    if (block && block !== 'all') {
      filter['residentDetails.flatNumber'] = new RegExp(`^${block}`, 'i');
    }

    // Floor filter (assuming flat format is Block-Floor-FlatNum like A-1-101)
    if (floor && floor !== 'all') {
      if (block && block !== 'all') {
        filter['residentDetails.flatNumber'] = new RegExp(`^${block}-${floor}`, 'i');
      } else {
        filter['residentDetails.flatNumber'] = new RegExp(`-${floor}-`, 'i');
      }
    }

    // Flat number exact match
    if (flatNumber) {
      filter['residentDetails.flatNumber'] = new RegExp(flatNumber, 'i');
    }

    // Resident mobile filter
    if (residentMobile) {
      filter['residentDetails.phone'] = new RegExp(residentMobile, 'i');
    }

    // Resident name filter
    if (residentName) {
      filter['residentDetails.name'] = new RegExp(residentName, 'i');
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch payment records with population (excluding problematic User model references)
    const payments = await PaymentEntry.find(filter)
      .populate('residentId', 'name phone email flatDetails')
      .populate({
        path: 'billId',
        populate: {
          path: 'billHeadId',
          model: 'BillHead',
          select: 'code name category'
        }
      })
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get society data for member lookup
    const Society = mongoose.model('Society');
    const society = await Society.findById(societyFilter).select('members managerName managerEmail societyName');
    
    // Populate missing residentDetails and billDetails for older records
    const populatedPayments = payments.map(payment => {
      const paymentObj = payment.toObject();
      
      // If residentDetails is missing but residentId is populated, use that data
      if (!paymentObj.residentDetails && paymentObj.residentId) {
        paymentObj.residentDetails = {
          name: paymentObj.residentId.name || 'N/A',
          phone: paymentObj.residentId.phone || 'N/A',
          email: paymentObj.residentId.email || 'N/A',
          flatNumber: paymentObj.residentId.flatDetails?.flatNumber || 'N/A'
        };
      }
      
      // If billDetails is missing but billId is populated, use that data
      if (!paymentObj.billDetails && paymentObj.billId) {
        paymentObj.billDetails = {
          billNumber: paymentObj.billId.billNumber || 'N/A',
          billAmount: paymentObj.billId.amount || paymentObj.billId.totalAmount || 0,
          billHeadCode: paymentObj.billId.billHeadId?.code || 'N/A',
          billHeadName: paymentObj.billId.billHeadId?.name || 'N/A'
        };
      }
      
      // Handle maker details - since User model doesn't exist, use available data
      if (paymentObj.maker && !paymentObj.maker.userId?.name) {
        const makerId = paymentObj.maker.userId?.toString();
        let makerInfo = null;
        
        // 1. Check if maker is the main resident
        if (paymentObj.residentId && makerId === paymentObj.residentId._id?.toString()) {
          makerInfo = {
            _id: paymentObj.residentId._id,
            name: paymentObj.residentId.name,
            email: paymentObj.residentId.email,
            type: 'Resident'
          };
        }
        
        // 2. Check if maker is a resident family member
        if (!makerInfo && paymentObj.residentId?.members) {
          const residentMember = paymentObj.residentId.members.find(member => 
            member._id?.toString() === makerId
          );
          if (residentMember) {
            makerInfo = {
              _id: residentMember._id,
              name: residentMember.name,
              email: residentMember.email,
              type: `Resident ${residentMember.role === 'family_member' ? 'Family Member' : 
                    residentMember.role === 'tenant' ? 'Tenant' : 'Admin'}`
            };
          }
        }
        
        // 3. Check if maker is a society member
        if (!makerInfo && society) {
          // First check if the makerId is the society's main _id
          if (makerId === society._id?.toString()) {
            makerInfo = {
              _id: society._id,
              name: society.managerName || society.societyName,
              email: society.managerEmail,
              type: 'Society Admin'
            };
          }
          // Then check if it's a member within the society's members array
          else if (society.members) {
            const societyMember = society.members.find(member => 
              member._id?.toString() === makerId
            );
            if (societyMember) {
              const roleLabel = {
                'admin': 'Society Admin',
                'manager': 'Society Manager',
                'accountant': 'Society Accountant',
                'security_admin': 'Security Admin',
                'maintenance_admin': 'Maintenance Admin',
                'member': 'Society Member'
              };
              makerInfo = {
                _id: societyMember._id,
                name: societyMember.name,
                email: societyMember.email,
                type: roleLabel[societyMember.role] || 'Society Member'
              };
            }
          }
        }
        
        // 4. Default to system user if no match found
        if (!makerInfo) {
          makerInfo = {
            _id: makerId || 'system',
            name: 'System User',
            email: 'system@society.com',
            type: 'System'
          };
        }
        
        // Structure it the way the frontend expects (with userId object)
        paymentObj.maker.userId = makerInfo;
      }
      
      return paymentObj;
    });

    // Get total count for pagination
    const totalCount = await PaymentEntry.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Calculate summary statistics
    const summaryPipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          avgPaymentAmount: { $avg: '$amount' },
          paymentsByMode: {
            $push: {
              mode: '$paymentMode',
              amount: '$amount'
            }
          },
          paymentsByStatus: {
            $push: {
              status: '$status',
              amount: '$amount'
            }
          }
        }
      },
      {
        $project: {
          totalAmount: 1,
          totalPayments: 1,
          avgPaymentAmount: 1,
          paymentModes: {
            $reduce: {
              input: '$paymentsByMode',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [{ k: '$$this.mode', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.mode', input: '$$value' } }, 0] }, '$$this.amount'] } }]
                    ]
                  }
                ]
              }
            }
          },
          statusBreakdown: {
            $reduce: {
              input: '$paymentsByStatus',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [{ k: '$$this.status', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.status', input: '$$value' } }, 0] }, '$$this.amount'] } }]
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ];

    const summaryResult = await PaymentEntry.aggregate(summaryPipeline);
    const summary = summaryResult[0] || {
      totalAmount: 0,
      totalPayments: 0,
      avgPaymentAmount: 0,
      paymentModes: {},
      statusBreakdown: {}
    };

    // Get unique blocks and floors for filter options
    const uniqueFlats = await PaymentEntry.distinct('residentDetails.flatNumber', { societyId: societyFilter });
    const blocks = [...new Set(uniqueFlats.map(flat => flat ? flat.split('-')[0] : '').filter(Boolean))].sort();
    
    // Extract floors from flats (assuming format like A-1-101)
    const floors = [...new Set(uniqueFlats.map(flat => {
      if (flat && flat.includes('-')) {
        const parts = flat.split('-');
        return parts.length >= 2 ? parts[1] : '';
      }
      return '';
    }).filter(Boolean))].sort((a, b) => parseInt(a) - parseInt(b));

    res.status(200).json({
      success: true,
      data: {
        payments: populatedPayments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        summary,
        filterOptions: {
          blocks,
          floors: floors.length > 0 ? floors : ['Ground', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] // Fallback floor options
        }
      }
    });

  } catch (error) {
    console.error('Error fetching payment records:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment records',
      error: error.message 
    });
  }
}
