import connectToDatabase from "../../../../lib/mongodb";
import GatePass from "../../../../models/GatePass";

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { passId } = req.query;

    // Validate passId
    if (!passId) {
      return res.status(400).json({ message: 'Pass ID is required' });
    }

    // Find and delete the pass
    const deletedPass = await GatePass.findByIdAndDelete(passId);

    if (!deletedPass) {
      return res.status(404).json({ message: 'Gate pass not found' });
    }

    res.status(200).json({
      message: 'Gate pass deleted successfully',
      data: deletedPass
    });

  } catch (error) {
    console.error('Error deleting gate pass:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 