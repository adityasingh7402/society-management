import connectToDatabase from "../../../lib/mongodb";
import VehicleTag from "../../../models/VehicleTag";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();
    const { tagId } = req.query;

    if (!tagId) {
      return res.status(400).json({ message: 'Tag ID is required' });
    }

    const vehicleTag = await VehicleTag.findById(tagId)
      .populate('residentId', 'name flat')
      .populate('societyId', 'societyName')
      .lean();

    if (!vehicleTag) {
      return res.status(404).json({ message: 'Vehicle tag not found' });
    }

    const isExpired = new Date(vehicleTag.validUntil) < new Date();

    // If tag is expired, update its status
    if (isExpired && vehicleTag.status !== 'Expired') {
      await VehicleTag.findByIdAndUpdate(tagId, { status: 'Expired' });
      vehicleTag.status = 'Expired';
    }

    res.status(200).json({
      data: {
        type: 'vehicle',
        status: vehicleTag.status,
        isExpired,
        vehicleType: vehicleTag.vehicleType,
        vehicleDetails: vehicleTag.vehicleDetails,
        resident: vehicleTag.residentId,
        society: vehicleTag.societyId,
        validFrom: vehicleTag.validFrom,
        validUntil: vehicleTag.validUntil
      }
    });

  } catch (error) {
    console.error('Error fetching vehicle tag:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 