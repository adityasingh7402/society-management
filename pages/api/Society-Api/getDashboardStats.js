import connectDB from '../../../lib/mongodb';
import Resident from '../../../models/Resident';
import Security from '../../../models/Security';
import UtilityBill from '../../../models/UtilityBill';
import MaintenanceTicket from '../../../models/MaintenanceTicket';
import Announcement from '../../../models/Announcement';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { societyId, userId } = req.query;

    if (!societyId) {
      return res.status(400).json({ message: 'Society ID is required' });
    }

    // Fetch all data concurrently
    const [residents, securityGuards, utilityBills, tickets, announcements] = await Promise.all([
      Resident.find({ societyCode: societyId }),
      Security.find({ societyId: userId }),
      UtilityBill.find({ societyId: userId }).sort({ createdAt: -1 }),
      MaintenanceTicket.find({ societyId }).sort({ createdAt: -1 }),
      Announcement.find({ societyId: userId }).sort({ createdAt: -1 }).limit(5)
    ]);

    // Process residents data
    const totalFlats = residents.length;
    const occupiedFlats = residents.filter(resident => resident.societyVerification === 'Approved').length;
    const occupancyRate = totalFlats > 0 ? Math.round((occupiedFlats / totalFlats) * 100) : 0;

    // Process wing-wise occupancy
    const wingOccupancy = residents.reduce((acc, resident) => {
      const wing = resident.flatDetails?.blockName || 'Unassigned';
      if (!acc[wing]) {
        acc[wing] = { totalFlats: 0, occupied: 0 };
      }
      acc[wing].totalFlats++;
      if (resident.societyVerification === 'Approved') {
        acc[wing].occupied++;
      }
      return acc;
    }, {});

    // Process utility bills
    const utilityStats = utilityBills.reduce((acc, bill) => {
      const month = new Date(bill.issueDate).toLocaleString('default', { month: 'long' });
      if (!acc[month]) {
        acc[month] = { water: 0, electricity: 0, gas: 0, internet: 0, other: 0 };
      }
      switch (bill.utilityType) {
        case 'Water':
          acc[month].water += bill.unitUsage || 0;
          break;
        case 'Electricity':
          acc[month].electricity += bill.unitUsage || 0;
          break;
        case 'Gas':
          acc[month].gas += bill.unitUsage || 0;
          break;
        case 'Internet':
          acc[month].internet += bill.unitUsage || 0;
          break;
        default:
          acc[month].other += bill.unitUsage || 0;
      }
      return acc;
    }, {});

    // Calculate maintenance collection stats
    const maintenanceStats = utilityBills.reduce((acc, bill) => {
      const totalAmount = bill.calculateTotalAmount();
      acc.totalAmount += totalAmount;
      if (bill.status === 'Paid') {
        acc.paidAmount += totalAmount;
      }
      return acc;
    }, { totalAmount: 0, paidAmount: 0 });

    // Calculate collection rate
    const collectionRate = maintenanceStats.totalAmount > 0 
      ? Math.round((maintenanceStats.paidAmount / maintenanceStats.totalAmount) * 100)
      : 0;

    // Process recent activity
    const recentActivity = [
      ...tickets.slice(0, 5).map(ticket => ({
        id: ticket._id,
        activity: `New maintenance ticket: ${ticket.title}`,
        flatNo: ticket.flatNumber,
        date: ticket.createdAt
      })),
      ...utilityBills.slice(0, 5).map(bill => ({
        id: bill._id,
        activity: `${bill.utilityType} bill generated`,
        flatNo: bill.flatNumber,
        date: bill.issueDate
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    // Update response structure
    res.status(200).json({
      success: true,
      data: {
        societyStats: {
          totalResidents: residents.length,
          totalFlats,
          occupancyRate,
          maintenanceCollection: collectionRate,
          upcomingEvents: announcements.length,
          activeComplaints: tickets.filter(ticket => ticket.status === 'Pending').length,
          totalSecurityGuards: securityGuards.length
        },
        wingOccupancy: Object.entries(wingOccupancy).map(([wing, data]) => ({
          wing,
          ...data
        })),
        utilityData: Object.entries(utilityStats).map(([month, data]) => ({
          month,
          ...data
        })),
        announcements: announcements.map(ann => ({
          id: ann._id,
          title: ann.title,
          description: ann.description,
          images: ann.image || [], // Include the image array from MongoDB
          date: ann.date,
          time: ann.time
        })),
        recentActivity,
        maintenanceStats: {
          totalAmount: maintenanceStats.totalAmount,
          paidAmount: maintenanceStats.paidAmount,
          collectionRate
        }
      }
    });

    // // Debug logs with descriptive names
    // console.log("Sample Resident Data:", {
    //   name: residents[0]?.name,
    //   flatNo: residents[0]?.flatDetails?.flatNumber,
    //   wing: residents[0]?.flatDetails?.blockName,
    //   status: residents[0]?.societyVerification
    // });

    // console.log("Sample Security Guard Data:", {
    //   name: securityGuards[0]?.guardName,
    //   shift: securityGuards[0]?.shiftTimings,
    //   contactNo: securityGuards[0]?.guardPhone
    // });

    // console.log("Sample Utility Bill:", {
    //   flatNo: utilityBills[0]?.flatNumber,
    //   amount: utilityBills[0]?.baseAmount,
    //   status: utilityBills[0]?.status,
    //   unitUsage: utilityBills[0]?.unitUsage,
    //   utilityType: utilityBills[0]?.utilityType
    // });

    // console.log("Sample Maintenance Ticket:", {
    //   title: tickets[0]?.title,
    //   flatNo: tickets[0]?.flatNumber,
    //   status: tickets[0]?.status,
    //   date: tickets[0]?.createdAt,
    //   category: tickets[0]?.category
    // });

    // console.log("Sample Announcement:", {
    //   title: announcements[0]?.title,
    //   content: announcements[0]?.description,
    //   date: announcements[0]?.date,
    //   time: announcements[0]?.time,
    //   images: announcements[0]?.images
    // });

    // console.log("Sample Recent Activity:", recentActivity[0]);

    // console.log("Maintenance Statistics:", maintenanceStats);

    // console.log("Wing-wise Occupancy:", wingOccupancy);

    // console.log("Utility Usage Statistics:", utilityStats);

    // console.log("Overall Statistics:", {
    //   totalFlats,
    //   occupiedFlats,
    //   occupancyRate,
    //   collectionRate
    // });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
}