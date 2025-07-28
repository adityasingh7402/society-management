import connectToDatabase from '../../../lib/mongodb';
import DailyAttendance from '../../../models/DailyAttendance';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { societyId, visitorData } = req.body;

    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's attendance record
    let dailyAttendance = await DailyAttendance.findOne({
      societyId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!dailyAttendance) {
      dailyAttendance = new DailyAttendance({
        societyId,
        date: today,
        visitors: []
      });
    }

    // Add new visitor to the attendance record
    dailyAttendance.visitors.push(visitorData);

    // Save the updated record
    await dailyAttendance.save();

    res.status(200).json(dailyAttendance);
  } catch (error) {
    console.error('Error creating attendance record:', error);
    res.status(500).json({ message: 'Error creating attendance record', error: error.message });
  }
}