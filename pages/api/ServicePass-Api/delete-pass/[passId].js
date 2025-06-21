import connectToDatabase from "../../../../lib/mongodb";
import ServicePass from "../../../../models/ServicePass";

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
    const deletedPass = await ServicePass.findByIdAndDelete(passId);

    if (!deletedPass) {
      return res.status(404).json({ message: 'Service pass not found' });
    }

    res.status(200).json({
      message: 'Service pass deleted successfully',
      data: deletedPass
    });

  } catch (error) {
    console.error('Error deleting service pass:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 