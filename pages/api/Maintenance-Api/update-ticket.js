import connectDB from '../../../lib/mongodb';
import MaintenanceTicket from '../../../models/MaintenanceTicket';
import Resident from '../../../models/Resident';
import Society from '../../../models/Society';
import jwt from 'jsonwebtoken';

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

    // Verify token and get user info
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
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

    const ticket = await MaintenanceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

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