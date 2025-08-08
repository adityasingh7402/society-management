import connectDB from '../../../lib/mongodb';
import MaintenanceTicket from '../../../models/MaintenanceTicket';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let ticketData = {};
  let hasAuthToken = false;
  let ticketId = '';

  try {
    await connectDB();

    const authHeader = req.headers.authorization;
    hasAuthToken = !!authHeader;
    
    ticketId = req.query.id;
    if (!ticketId) {
      await logFailure('DELETE_MAINTENANCE_TICKET', req, 'Ticket ID is required', {
        hasAuthToken,
        errorType: 'MISSING_TICKET_ID'
      });
      return res.status(400).json({ success: false, message: 'Please provide ticket ID' });
    }

    const ticket = await MaintenanceTicket.findById(ticketId);
    if (!ticket) {
      await logFailure('DELETE_MAINTENANCE_TICKET', req, 'Ticket not found', {
        ticketId,
        hasAuthToken,
        errorType: 'TICKET_NOT_FOUND'
      });
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Prepare ticket data for logging
    ticketData = {
      ticketId: ticket._id.toString(),
      title: ticket.title,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      flatNumber: ticket.flatNumber,
      societyId: ticket.societyId,
      residentId: ticket.residentId,
      hasImages: !!(ticket.images && ticket.images.length > 0),
      imageCount: ticket.images?.length || 0,
      commentCount: ticket.comments?.length || 0,
      statusHistoryCount: ticket.statusHistory?.length || 0,
      createdAt: ticket.createdAt,
      hasAuthToken
    };

    // Check if the ticket is in pending status
    if (ticket.status !== 'Pending') {
      await logFailure('DELETE_MAINTENANCE_TICKET', req, 'Only pending tickets can be deleted', {
        ...ticketData,
        errorType: 'INVALID_STATUS_FOR_DELETION',
        currentStatus: ticket.status
      });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Only tickets with Pending status can be deleted' 
      });
    }

    await MaintenanceTicket.findByIdAndDelete(ticketId);

    // Log successful deletion
    await logSuccess('DELETE_MAINTENANCE_TICKET', req, {
      ...ticketData,
      deletedAt: new Date(),
      deletionReason: 'Pending status ticket deletion'
    });

    return res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    
    // Log failure with context
    await logFailure('DELETE_MAINTENANCE_TICKET', req, 'Failed to delete maintenance ticket', {
      ...ticketData,
      ticketId: ticketId || 'unknown',
      errorMessage: error.message,
      errorType: error.name || 'UNKNOWN_ERROR'
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to delete ticket',
      error: error.message
    });
  }
}
