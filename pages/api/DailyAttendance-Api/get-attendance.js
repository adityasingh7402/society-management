import connectToDatabase from '../../../lib/mongodb';
import DailyAttendance from '../../../models/DailyAttendance';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const {
      societyId,
      date,
      status,
      visitorType,
      searchTerm,
      page = 1,
      limit = 10
    } = req.query;

    // Build query object
    const query = { societyId };

    // Date filter
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      query.date = {
        $gte: queryDate,
        $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
      };
    }

    // Status filter
    if (status) {
      query['visitors.status'] = status;
    }

    // Visitor type filter
    if (visitorType) {
      query['visitors.visitorType'] = visitorType;
    }

    // Search filter
    if (searchTerm) {
      query.$or = [
        { 'visitors.visitorName': { $regex: searchTerm, $options: 'i' } },
        { 'visitors.visitorPhone': { $regex: searchTerm, $options: 'i' } },
        { 'visitors.residentDetails.flatNumber': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch records with pagination
    const records = await DailyAttendance.find(query)
      .sort({ date: -1, 'visitors.entryTime': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await DailyAttendance.countDocuments(query);

    // Calculate summary for current visitors
    const summary = {
      totalRecords: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      dailySummary: records.length > 0 ? records[0].dailySummary : {
        totalVisitors: 0,
        currentVisitors: 0,
        totalExited: 0,
        overstayedVisitors: 0
      }
    };

    res.status(200).json({
      records,
      summary
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ message: 'Error fetching attendance records', error: error.message });
  }
}