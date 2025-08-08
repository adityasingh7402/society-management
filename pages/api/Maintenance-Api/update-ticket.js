import connectDB from '../../../lib/mongodb';
import MaintenanceTicket from '../../../models/MaintenanceTicket';
import Resident from '../../../models/Resident';
import Society from '../../../models/Society';
import jwt from 'jsonwebtoken';
import { logSuccess, logFailure } from '../../../services/loggingService';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let ticketData = {};
  let hasAuthToken = false;
  let ticketId = '';

  try {
    await connectDB();

    ticketId = req.query.id;
    hasAuthToken = !!req.headers.authorization;

    if (!ticketId) {
      await logFailure('UPDATE_MAINTENANCE_TICKET', req, 'Ticket ID is required', {
        hasAuthToken,
        errorType: 'MISSING_TICKET_ID'
      });
      return res.status(400).json({ success: false, message: 'Please provide ticket ID' });
    }

    // Verify token and get user info
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      await logFailure('UPDATE_MAINTENANCE_TICKET', req, 'Authentication failed - no token provided', {
        ticketId,
        hasAuthToken,
        errorType: 'AUTHENTICATION_ERROR'
      });
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let userInfo = {};
    let isAdmin = false;

    // Check if it's a resident or society member
    if (decoded.phone) {
      const resident = await Resident.findOne({ phone: decoded.phone });
      if (resident) {
        userInfo = {
          id: resident._id,
          name: resident.name,
          type: 'resident'
        };
      } else {
        // Check if it's a society member
        const society = await Society.findOne({
          $or: [
            { managerPhone: decoded.phone },
            { "members.phone": decoded.phone }
          ]
        });
        if (society) {
          const member = society.members.find(m => m.phone === decoded.phone);
          userInfo = {
            id: society._id,
            name: member ? member.name : society.managerName,
            type: 'society'
          };
          isAdmin = true;
        }
      }
    }

    const ticket = await MaintenanceTicket.findById(ticketId);
    if (!ticket) {
      await logFailure('UPDATE_MAINTENANCE_TICKET', req, 'Ticket not found', {
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
      previousStatus: ticket.status,
      flatNumber: ticket.flatNumber,
      societyId: ticket.societyId,
      residentId: ticket.residentId,
      updatedByName: userInfo.name || 'Unknown',
      updatedByType: userInfo.type || 'unknown',
      isAdmin,
      hasAuthToken
    };

    // Handle comment addition
    if (req.body.comment) {
      if (!userInfo.name) {
        return res.status(400).json({ success: false, message: 'Unable to identify user' });
      }

      ticket.comments.push({
        text: req.body.comment,
        createdBy: userInfo.name,
        isAdmin: isAdmin,
        createdAt: new Date()
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

    if (req.body.referenceNumber) {
      ticket.referenceNumber = req.body.referenceNumber;
    }

    const updatedTicket = await ticket.save();

    // Determine update type for logging
    const updateTypes = [];
    if (req.body.comment) updateTypes.push('comment');
    if (req.body.status) updateTypes.push('status');
    if (req.body.referenceNumber) updateTypes.push('reference');

    // Log successful update
    await logSuccess('UPDATE_MAINTENANCE_TICKET', req, {
      ...ticketData,
      newStatus: updatedTicket.status,
      newReferenceNumber: updatedTicket.referenceNumber,
      commentAdded: !!req.body.comment,
      statusChanged: req.body.status !== undefined,
      referenceNumberUpdated: req.body.referenceNumber !== undefined,
      updateTypes: updateTypes.join(', '),
      commentCount: updatedTicket.comments?.length || 0,
      statusHistoryCount: updatedTicket.statusHistory?.length || 0
    }, updatedTicket._id, 'MaintenanceTicket');

    return res.status(200).json({
      success: true,
      data: updatedTicket
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    
    // Log failure with context
    await logFailure('UPDATE_MAINTENANCE_TICKET', req, error.message, {
      ...ticketData,
      updateAttempt: {
        comment: !!req.body.comment,
        status: req.body.status || null,
        referenceNumber: req.body.referenceNumber || null
      },
      errorType: error.name || 'UNKNOWN_ERROR'
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
      error: error.message
    });
  }
}
