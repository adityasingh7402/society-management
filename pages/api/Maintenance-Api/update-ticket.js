import connectDB from '../../../lib/mongodb';
import MaintenanceTicket from '../../../models/MaintenanceTicket';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Please provide ticket ID' });
    }

    const ticket = await MaintenanceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Handle comment addition
    if (req.body.comment) {
      ticket.comments.push({
        text: req.body.comment,
        createdBy: req.body.userId || 'resident',
        isAdmin: req.body.isAdmin || false
      });
    }

    // Handle status update
    if (req.body.status) {
      ticket.status = req.body.status;
      ticket.statusHistory.push({
        status: req.body.status,
        changedBy: req.body.userId || 'resident'
      });
    }

    const updatedTicket = await ticket.save();

    return res.status(200).json({
      success: true,
      data: updatedTicket
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
      error: error.message
    });
  }
}