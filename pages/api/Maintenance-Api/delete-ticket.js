import connectDB from '../../../lib/mongodb';
import MaintenanceTicket from '../../../models/MaintenanceTicket';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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

    // Check if the ticket is in pending status
    if (ticket.status !== 'Pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only tickets with Pending status can be deleted' 
      });
    }

    await MaintenanceTicket.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete ticket',
      error: error.message
    });
  }
}