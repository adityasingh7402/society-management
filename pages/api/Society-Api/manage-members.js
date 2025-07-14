import connectToDatabase from '../../../lib/mongodb';
import Society from '../../../models/Society';
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
    const society = await Society.findOne({ managerPhone: decoded.phone });

    if (!society) {
      return res.status(404).json({ success: false, message: 'Society not found' });
    }

    const isManager = decoded.phone === society.managerPhone;
    const isMember = Array.isArray(society.members) && society.members.some(member => member.phone === decoded.phone);

    if (!isManager && !isMember) {
      return res.status(403).json({ message: "You are not authorized to manage members in this society." });
    }

    switch (req.method) {
      case 'GET': // Get all members
        return res.status(200).json({ 
          success: true, 
          members: society.members || [] 
        });

      case 'POST': // Add new member
        const { name, phone, email, role, permissions } = req.body;

        // Validate required fields
        if (!name || !phone || !email || !role) {
          return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Format phone number
        const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

        // Check if member already exists
        if (society.members.some(m => m.phone === formattedPhone)) {
          return res.status(400).json({ success: false, message: 'Member with this phone number already exists' });
        }

        // Add new member
        society.members.push({
          name,
          phone: formattedPhone,
          email,
          role,
          permissions: permissions || getDefaultPermissions(role),
          addedBy: society._id,
          status: 'active'
        });

        await society.save();
        return res.status(201).json({ success: true, message: 'Member added successfully' });

      case 'PUT': // Update member
        const { memberId, updates } = req.body;
        const memberIndex = society.members.findIndex(m => m._id.toString() === memberId);

        if (memberIndex === -1) {
          return res.status(404).json({ success: false, message: 'Member not found' });
        }

        // Format phone number if it's being updated
        if (updates.phone) {
          updates.phone = updates.phone.startsWith('+91') ? updates.phone : `+91${updates.phone}`;
        }

        // Update member details
        society.members[memberIndex] = {
          ...society.members[memberIndex].toObject(),
          ...updates,
          _id: society.members[memberIndex]._id // Preserve the original _id
        };

        await society.save();
        return res.status(200).json({ success: true, message: 'Member updated successfully' });

      case 'DELETE': // Remove member
        const { memberIdToDelete } = req.body;
        const memberToDeleteIndex = society.members.findIndex(m => m._id.toString() === memberIdToDelete);

        if (memberToDeleteIndex === -1) {
          return res.status(404).json({ success: false, message: 'Member not found' });
        }

        society.members.splice(memberToDeleteIndex, 1);
        await society.save();
        return res.status(200).json({ success: true, message: 'Member removed successfully' });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in manage-members:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Helper function to get default permissions based on role
function getDefaultPermissions(role) {
  switch (role) {
    case 'admin':
      return ['full_access'];
    case 'manager':
      return [
        'manage_residents',
        'manage_bills',
        'manage_maintenance',
        'manage_security',
        'manage_notices',
        'manage_amenities',
        'manage_complaints',
        'view_reports'
      ];
    case 'accountant':
      return ['manage_bills', 'view_reports'];
    case 'security_admin':
      return ['manage_security', 'view_reports'];
    case 'maintenance_admin':
      return ['manage_maintenance', 'manage_complaints', 'view_reports'];
    case 'member':
      return ['view_reports'];
    default:
      return [];
  }
} 