import { connectToDatabase } from '../../../lib/mongodb';
import GatePass from '../../../models/GatePass';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify the token
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await connectToDatabase();

    const { passId } = req.query;

    // Find and delete the gate pass
    const gatePass = await GatePass.findByIdAndDelete(passId);

    if (!gatePass) {
      return res.status(404).json({ message: 'Gate pass not found' });
    }

    res.status(200).json({
      message: 'Gate pass deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting gate pass:', error);
    res.status(500).json({ message: 'Error deleting gate pass', error: error.message });
  }
} 