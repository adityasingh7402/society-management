import connectToDatabase from '../../../lib/mongodb';
import DailyAttendance from '../../../models/DailyAttendance';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { societyId, visitorId, actualExitTime } = req.body;
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const isGuard = decodedToken.guardName && decodedToken.guardPhone;

    const exitMarker = {
      personId: decodedToken.id,
      personType: isGuard ? 'Security' : decodedToken.role || 'Unknown',
      personName: isGuard ? decodedToken.guardName : decodedToken.name,
      personPhone: isGuard ? decodedToken.guardPhone : decodedToken.phone
    };

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

    // Record who marked the exit
    visitor.exitMarkedBy = {
      ...exitMarker,
      exitTime: visitor.actualExitTime
    };

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