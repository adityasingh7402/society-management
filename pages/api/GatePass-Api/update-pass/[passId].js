import connectToDatabase from "../../../../lib/mongodb";
import GatePass from "../../../../models/GatePass";

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { passId } = req.query;
    const { qrCode, shareableImage } = req.body;

    // Validate required fields
    if (!passId || !qrCode || !shareableImage) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Update the gate pass
    const updatedPass = await GatePass.findByIdAndUpdate(
      passId,
      {
        qrCode,
        shareableImage
      },
      { new: true }
    );

    if (!updatedPass) {
      return res.status(404).json({ message: 'Gate pass not found' });
    }

    res.status(200).json({
      message: 'Gate pass updated successfully',
      data: updatedPass
    });

  } catch (error) {
    console.error('Error updating gate pass:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 