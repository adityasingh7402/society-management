import connectToDatabase from "../../../../lib/mongodb";
import ServicePass from "../../../../models/ServicePass";

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

    // Update the service pass
    const updatedPass = await ServicePass.findByIdAndUpdate(
      passId,
      {
        qrCode,
        shareableImage
      },
      { new: true }
    );

    if (!updatedPass) {
      return res.status(404).json({ message: 'Service pass not found' });
    }

    res.status(200).json({
      message: 'Service pass updated successfully',
      data: updatedPass
    });

  } catch (error) {
    console.error('Error updating service pass:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 