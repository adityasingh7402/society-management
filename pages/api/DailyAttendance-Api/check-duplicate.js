import connectToDatabase from '../../../lib/mongodb';
import DailyAttendance from '../../../models/DailyAttendance';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { societyId, identifier } = req.body;

    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Find today's attendance record
    const dailyAttendance = await DailyAttendance.findOne({
      societyId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (!dailyAttendance) {
      return res.status(200).json({ isDuplicate: false });
    }

    // Check for duplicates based on type
    let isDuplicate = false;

    switch (identifier.type) {
      case 'guest':
        isDuplicate = dailyAttendance.visitors.some(visitor => 
          visitor.visitorType === 'GatePass' &&
          visitor.visitorName === identifier.visitorName &&
          visitor.visitorPhone === identifier.visitorPhone &&
          visitor.residentDetails.personId?.toString() === identifier.residentId &&
          visitor.status === 'Inside' // Only check for visitors still inside
        );
        break;

      case 'service':
        isDuplicate = dailyAttendance.visitors.some(visitor => 
          visitor.visitorType === 'ServicePersonnel' &&
          visitor.visitorName === identifier.visitorName &&
          visitor.visitorPhone === identifier.visitorPhone &&
          visitor.residentDetails.personId?.toString() === identifier.residentId &&
          visitor.status === 'Inside' // Only check for visitors still inside
        );
        break;

      case 'vehicle':
        // For vehicles, check by registration number and resident
        isDuplicate = dailyAttendance.visitors.some(visitor => 
          visitor.visitorType === 'VehicleTag' &&
          visitor.residentDetails.personId?.toString() === identifier.residentId &&
          visitor.status === 'Inside' && // Only check for visitors still inside
          // Check if this is the same vehicle (we can add vehicle registration to the record later)
          visitor.visitorName === identifier.visitorName
        );
        break;

      case 'animal':
        // For animals, check by animal name and resident
        isDuplicate = dailyAttendance.visitors.some(visitor => 
          visitor.visitorType === 'AnimalTag' &&
          visitor.residentDetails.personId?.toString() === identifier.residentId &&
          visitor.status === 'Inside' && // Only check for visitors still inside
          visitor.visitorName === identifier.visitorName
        );
        break;

      default:
        return res.status(400).json({ message: 'Invalid identifier type' });
    }

    res.status(200).json({ isDuplicate });

  } catch (error) {
    console.error('Error checking duplicate attendance:', error);
    res.status(500).json({ message: 'Error checking duplicate attendance', error: error.message });
  }
}
