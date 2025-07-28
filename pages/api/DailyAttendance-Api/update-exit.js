import connectToDatabase from '../../../lib/mongodb';
import DailyAttendance from '../../../models/DailyAttendance';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { societyId, visitorId, actualExitTime } = req.body;

    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    const dailyAttendance = await DailyAttendance.findOne({
      societyId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      'visitors._id': visitorId
    });

    if (!dailyAttendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Find the visitor in the array
    const visitor = dailyAttendance.visitors.id(visitorId);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Update exit time and status
    visitor.actualExitTime = actualExitTime || new Date();
    
    // Check if visitor has overstayed
    const expectedExitTime = new Date(visitor.expectedExitTime);
    const exitTime = new Date(visitor.actualExitTime);
    visitor.status = exitTime > expectedExitTime ? 'Overstayed' : 'Left';

    // Save the updated record
    await dailyAttendance.save();

    res.status(200).json(dailyAttendance);
  } catch (error) {
    console.error('Error updating exit time:', error);
    res.status(500).json({ message: 'Error updating exit time', error: error.message });
  }
}