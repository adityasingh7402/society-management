import connectDB from '../../../lib/mongodb';
import MaintenanceTicket from '../../../models/MaintenanceTicket';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { ticketId, newStatus, userType, userId, userName, reason } = req.body;

    if (!ticketId || !newStatus || !userType || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide ticketId, newStatus, userType, and userId' 
      });
    }

    const ticket = await MaintenanceTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Define allowed status transitions
    const allowedTransitions = {
      resident: {
        'Pending': ['Pending'], // Resident can only keep it pending or provide more info
        'Approved': ['Pending'], // Resident can reopen if needed
        'Assigned': ['Pending'], // Resident can reopen
        'In Progress': ['Pending'], // Resident can reopen
        'Completed': ['Pending', 'Resolved'], // Resident can reopen if not satisfied or resolve it
        'Rejected': ['Pending'], // Resident can reopen with modifications
        'Resolved': [] // Once resolved, cannot be changed by resident
      },
      society: {
        'Pending': ['Approved', 'Rejected', 'Assigned'],
        'Approved': ['Assigned', 'In Progress', 'Rejected'],
        'Assigned': ['In Progress', 'Completed', 'Rejected'],
        'In Progress': ['Completed', 'Assigned', 'Rejected'],
        'Completed': ['In Progress'], // Society can reopen if issue persists
        'Rejected': ['Pending', 'Approved'], // Society can reconsider
        'Resolved': ['In Progress'] // Society can reopen resolved tickets if needed
      }
    };

    // Check if the status transition is allowed
    const currentStatus = ticket.status;
    const allowedStatuses = allowedTransitions[userType]?.[currentStatus];

    if (!allowedStatuses || !allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status change from ${currentStatus} to ${newStatus} is not allowed for ${userType}`
      });
    }

    // Update ticket status
    ticket.status = newStatus;
    
    // Add to status history
    ticket.statusHistory.push({
      status: newStatus,
      changedBy: userName || userId,
      changedAt: new Date(),
      reason: reason || `Status changed by ${userType}`
    });

    // Add comment if reason provided
    if (reason) {
      ticket.comments.push({
        text: `Status changed to ${newStatus}. Reason: ${reason}`,
        createdBy: userName || `${userType}_user`,
        isAdmin: userType === 'society',
        createdAt: new Date(),
        userType: userType,
        userId: userId
      });
    }

    const updatedTicket = await ticket.save();

    return res.status(200).json({
      success: true,
      message: `Ticket status updated to ${newStatus}`,
      data: updatedTicket
    });

  } catch (error) {
    console.error('Error updating ticket status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket status',
      error: error.message
    });
  }
}
