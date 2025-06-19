import connectToDatabase from "../../../lib/mongodb";
import GuestPass from "../../../models/GuestPass";

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { passId } = req.query;
    const { status, remarks, societyId } = req.body;

    if (!passId || !status || !societyId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate status
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const guestPass = await GuestPass.findById(passId);

    if (!guestPass) {
      return res.status(404).json({ message: 'Guest pass not found' });
    }

    // Check if the society has permission to approve
    if (guestPass.societyId.toString() !== societyId) {
      return res.status(403).json({ message: 'Unauthorized to approve this pass' });
    }

    // Update pass status
    guestPass.status = status;
    guestPass.remarks = remarks;
    guestPass.approvedBy = societyId;
    guestPass.approvedAt = new Date();

    await guestPass.save();

    res.status(200).json({
      message: `Guest pass ${status.toLowerCase()} successfully`,
      data: guestPass
    });

  } catch (error) {
    console.error('Error approving guest pass:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 