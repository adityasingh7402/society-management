import connectToDatabase from '../../../lib/mongodb';
import Visitor from '../../../models/Visitor';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const { visitorId } = req.query;

    if (!visitorId) {
      return res.status(400).json({ error: 'Visitor ID is required' });
    }

    try {
      await connectToDatabase();

      const visitor = await Visitor.findByIdAndDelete(visitorId);
      if (!visitor) {
        return res.status(404).json({ error: 'Visitor not found' });
      }

      res.status(200).json({ success: 'Visitor entry deleted successfully' });
    } catch (error) {
      console.error('Error deleting visitor entry:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}