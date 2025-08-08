import connectToDatabase from '../../../lib/mongodb';
import Society from '../../../models/Society';
import jwt from 'jsonwebtoken';
import { logSuccess, logFailure } from '../../../services/loggingService';

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
          await logFailure('ADD_SOCIETY_MEMBER', req, 'Missing required fields', {
            providedFields: { name: !!name, phone: !!phone, email: !!email, role: !!role },
            societyId: society._id.toString(),
            errorType: 'VALIDATION_ERROR'
          });
          return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Format phone number
        const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

        // Check if member already exists
        if (society.members.some(m => m.phone === formattedPhone)) {
          await logFailure('ADD_SOCIETY_MEMBER', req, 'Member with this phone number already exists', {
            phone: formattedPhone,
            name,
            role,
            societyId: society._id.toString(),
            errorType: 'DUPLICATE_MEMBER'
          });
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
        
        // Log successful member addition
        const newMember = society.members[society.members.length - 1];
        await logSuccess('ADD_SOCIETY_MEMBER', req, {
          message: 'Member added successfully',
          memberName: name,
          memberPhone: formattedPhone,
          memberEmail: email,
          memberRole: role,
          memberId: newMember._id.toString(),
          societyId: society._id.toString(),
          addedBy: decoded.name || decoded.phone
        }, newMember._id.toString(), 'society_member');
        
        return res.status(201).json({ success: true, message: 'Member added successfully' });

      case 'PUT': // Update member
        const { memberId, updates } = req.body;
        const memberIndex = society.members.findIndex(m => m._id.toString() === memberId);

        if (memberIndex === -1) {
          await logFailure('UPDATE_SOCIETY_MEMBER', req, 'Member not found', {
            memberId,
            societyId: society._id.toString(),
            errorType: 'MEMBER_NOT_FOUND'
          });
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
        
        // Log successful member update
        const updatedMember = society.members[memberIndex];
        await logSuccess('UPDATE_SOCIETY_MEMBER', req, {
          message: 'Member updated successfully',
          memberId,
          memberName: updatedMember.name,
          memberPhone: updatedMember.phone,
          memberRole: updatedMember.role,
          updatedFields: Object.keys(updates),
          societyId: society._id.toString(),
          updatedBy: decoded.name || decoded.phone
        }, memberId, 'society_member');
        
        return res.status(200).json({ success: true, message: 'Member updated successfully' });

      case 'DELETE': // Remove member
        const { memberIdToDelete } = req.body;
        const memberToDeleteIndex = society.members.findIndex(m => m._id.toString() === memberIdToDelete);

        if (memberToDeleteIndex === -1) {
          await logFailure('DELETE_SOCIETY_MEMBER', req, 'Member not found', {
            memberIdToDelete,
            societyId: society._id.toString(),
            errorType: 'MEMBER_NOT_FOUND'
          });
          return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const memberToDelete = society.members[memberToDeleteIndex];
        society.members.splice(memberToDeleteIndex, 1);
        await society.save();
        
        // Log successful member deletion
        await logSuccess('DELETE_SOCIETY_MEMBER', req, {
          message: 'Member removed successfully',
          deletedMemberName: memberToDelete.name,
          deletedMemberPhone: memberToDelete.phone,
          deletedMemberRole: memberToDelete.role,
          memberIdToDelete,
          societyId: society._id.toString(),
          deletedBy: decoded.name || decoded.phone
        }, memberIdToDelete, 'society_member');
        
        return res.status(200).json({ success: true, message: 'Member removed successfully' });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in manage-members:', error);
    
    // Log failure
    await logFailure('MANAGE_SOCIETY_MEMBERS', req, 'Failed to manage society members', {
      errorMessage: error.message,
      errorType: error.name || 'UNKNOWN_ERROR',
      method: req.method,
      requestData: req.body
    });
    
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