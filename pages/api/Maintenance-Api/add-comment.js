import connectDB from '../../../lib/mongodb';
import MaintenanceTicket from '../../../models/MaintenanceTicket';
import Resident from '../../../models/Resident';
import Society from '../../../models/Society';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { ticketId, comment, attachments } = req.body;

    // Validate required fields
    if (!ticketId || !comment || !comment.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ticket ID and comment text are required' 
      });
    }

    // Verify token and get user info
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let userInfo = {};
    let isAdmin = false;

    // Check if token contains society info (has societyId property)
    if (decoded.societyId || decoded.societyPin) {
      // This is a society member/manager token
      userInfo = {
        id: decoded.id,
        name: decoded.name,
        type: 'society',
        role: decoded.role || 'member'
      };
      isAdmin = true;
    } else if (decoded.phone) {
      // This might be a resident token, check residents first
      const resident = await Resident.findOne({ phone: decoded.phone });
      if (resident) {
        userInfo = {
          id: resident._id,
          name: resident.name,
          image: resident.userImage,
          type: 'resident',
          flatNumber: resident.flatDetails?.flatNumber
        };
      } else {
        // Fallback: Check if it's a society member by phone (for older tokens)
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
            type: 'society',
            role: member ? member.role : 'manager'
          };
          isAdmin = true;
        }
      }
    }

    if (!userInfo.name) {
      return res.status(400).json({ success: false, message: 'Unable to identify user' });
    }

    // Find the ticket
    const ticket = await MaintenanceTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Create comment object
    const newComment = {
      text: comment.trim(),
      createdBy: userInfo.name,
      isAdmin: isAdmin,
      createdAt: new Date(),
      userType: userInfo.type,
      userId: userInfo.id,
      attachments: attachments || []
    };

    // Add additional info based on user type
    if (userInfo.type === 'resident') {
      newComment.flatNumber = userInfo.flatNumber;
      newComment.userImage = userInfo.image;
    } else if (userInfo.type === 'society') {
      newComment.role = userInfo.role;
    }

    // Add comment to ticket
    ticket.comments.push(newComment);

    // Save the updated ticket
    const updatedTicket = await ticket.save();

    // Populate the ticket with resident details for response
    await updatedTicket.populate('residentId', 'name phone flatDetails');

    return res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        ticket: updatedTicket,
        newComment: newComment
      }
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
}
