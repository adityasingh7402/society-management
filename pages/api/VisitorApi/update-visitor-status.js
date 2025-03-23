import connectToDatabase from '../../../lib/mongodb';
import Visitor from '../../../models/Visitor';

export default async function handler(req, res) {
  // Only allow PATCH method for this endpoint
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { visitorId, status, updatedBy } = req.body;

  // Validate required fields
  if (!visitorId || !status) {
    return res.status(400).json({ error: 'Visitor ID and status are required' });
  }

  // Validate status value
  if (!['approve', 'reject', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    await connectToDatabase();

    // Find and update the visitor
    const visitor = await Visitor.findById(visitorId);

    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    // Update visitor status
    visitor.status = status;
    visitor.statusUpdatedAt = new Date();
    
    // Store who updated the status if provided
    if (updatedBy) {
      visitor.statusUpdatedBy = updatedBy;
    }

    // Save the updated visitor
    await visitor.save();

    return res.status(200).json({ 
      success: true, 
      message: `Visitor status updated to ${status}`, 
      data: visitor 
    });

  } catch (error) {
    console.error('Error updating visitor status:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}