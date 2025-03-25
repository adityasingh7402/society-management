import connectDB from '../../../lib/mongodb';
import MaintenanceTicket from '../../../models/MaintenanceTicket';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Get societyId from query or body
    const { societyId } = req.query;
    
    // If societyId is provided in the query, use it directly
    if (societyId) {
      const tickets = await MaintenanceTicket.find({ societyId }).sort({ createdAt: -1 });
      
      return res.status(200).json({
        success: true,
        data: tickets
      });
    }
    
    // If no societyId in query, try to get it from the request body
    const societyIdFromBody = req.body?.societyId;
    
    if (societyIdFromBody) {
      const tickets = await MaintenanceTicket.find({ societyId: societyIdFromBody }).sort({ createdAt: -1 });
      
      return res.status(200).json({
        success: true,
        data: tickets
      });
    }
    
    // If no societyId provided, return an error
    return res.status(400).json({
      success: false,
      message: 'Society ID is required'
    });
    
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
}