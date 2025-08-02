import connectToDatabase from '../../../lib/mongodb';
import Resident from '../../../models/Resident';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  await connectToDatabase();

  // Verify token and authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const resident = await Resident.findOne({ phone: decoded.phone });

    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }

    switch (req.method) {
      case 'GET': // Get all resident members
        return res.status(200).json({ 
          success: true, 
          members: resident.members || [] 
        });

      case 'POST': // Add new member to resident
        const { name, phone, email, role } = req.body;

        // Validate required fields
        if (!name || !phone || !email || !role) {
          return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Format phone number
        const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

        // Check if member already exists
        if (resident.members.some(m => m.phone === formattedPhone)) {
          return res.status(400).json({ success: false, message: 'Member with this phone number already exists' });
        }

        // Add new member
        resident.members.push({
          name,
          phone: formattedPhone,
          email,
          role,
          addedBy: resident._id,
          status: 'active'
        });

        await resident.save();
        return res.status(201).json({ success: true, message: 'Member added successfully' });

      case 'PUT': // Update member
        const { memberId, updates } = req.body;
        const memberIndex = resident.members.findIndex(m => m._id.toString() === memberId);

        if (memberIndex === -1) {
          return res.status(404).json({ success: false, message: 'Member not found' });
        }

        // Format phone number if it's being updated
        if (updates.phone) {
          updates.phone = updates.phone.startsWith('+91') ? updates.phone : `+91${updates.phone}`;
        }

        // Update member details
        resident.members[memberIndex] = {
          ...resident.members[memberIndex].toObject(),
          ...updates,
          _id: resident.members[memberIndex]._id // Preserve the original _id
        };

        await resident.save();
        return res.status(200).json({ success: true, message: 'Member updated successfully' });

      case 'DELETE': // Remove member
        const { memberIdToDelete } = req.body;
        const memberToDeleteIndex = resident.members.findIndex(m => m._id.toString() === memberIdToDelete);

        if (memberToDeleteIndex === -1) {
          return res.status(404).json({ success: false, message: 'Member not found' });
        }

        resident.members.splice(memberToDeleteIndex, 1);
        await resident.save();
        return res.status(200).json({ success: true, message: 'Member removed successfully' });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in manage-residents:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
