import Society from '../../../models/Society';
import Resident from '../../../models/Resident';
import connectDB from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { residentId, action, reason = 'Community guidelines violation' } = req.body;
    // action: 'block' or 'unblock'

    if (!residentId || !action) {
      return res.status(400).json({ message: 'Resident ID and action are required' });
    }

    // Only society can block/unblock residents
    const society = await Society.findById(decoded.id);
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }

    // Verify resident exists and belongs to this society
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    if (resident.societyId.toString() !== society._id.toString()) {
      return res.status(403).json({ message: 'Resident does not belong to your society' });
    }

    const currentBlockIndex = society.blockedResidents.findIndex(
      block => block.residentId.toString() === residentId
    );

    if (action === 'block') {
      if (currentBlockIndex === -1) {
        // Add to blocked list using findByIdAndUpdate to avoid validation issues
        await Society.findByIdAndUpdate(
          society._id,
          {
            $push: {
              blockedResidents: {
                residentId,
                blockedAt: new Date(),
                blockedBy: society._id,
                reason
              }
            }
          },
          { new: true, runValidators: false }
        );

        res.status(200).json({
          success: true,
          message: `${resident.name} has been blocked from posting`,
          action: 'blocked'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Resident is already blocked'
        });
      }
    } else if (action === 'unblock') {
      if (currentBlockIndex !== -1) {
        // Remove from blocked list using findByIdAndUpdate
        await Society.findByIdAndUpdate(
          society._id,
          {
            $pull: {
              blockedResidents: {
                residentId: residentId
              }
            }
          },
          { new: true, runValidators: false }
        );

        res.status(200).json({
          success: true,
          message: `${resident.name} has been unblocked and can now post`,
          action: 'unblocked'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Resident is not blocked'
        });
      }
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "block" or "unblock"' });
    }

  } catch (error) {
    console.error('Error managing resident access:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update resident access', 
      error: error.message 
    });
  }
}
