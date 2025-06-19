import connectToDatabase from "../../lib/mongodb";
import VehicleTag from "../../models/VehicleTag";
import GuestPass from "../../models/GuestPass";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'QR data is required' });
    }

    let decodedData;
    try {
      decodedData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    const { type, tagId, passId } = decodedData;

    if (!type || (!tagId && !passId)) {
      return res.status(400).json({ message: 'Invalid QR code data' });
    }

    let result;
    const currentDate = new Date();

    if (type === 'vehicle') {
      const vehicleTag = await VehicleTag.findById(tagId)
        .populate('residentId', 'name phone flatDetails')
        .populate('societyId', 'societyName');

      if (!vehicleTag) {
        return res.status(404).json({ message: 'Vehicle tag not found' });
      }

      // Check if tag is expired
      if (new Date(vehicleTag.validUntil) < currentDate) {
        vehicleTag.status = 'Expired';
        await vehicleTag.save();
        return res.status(400).json({ 
          message: 'Vehicle tag has expired',
          data: {
            ...vehicleTag.toObject(),
            isExpired: true
          }
        });
      }

      result = {
        type: 'vehicle',
        status: vehicleTag.status,
        validUntil: vehicleTag.validUntil,
        vehicleDetails: vehicleTag.vehicleDetails,
        resident: vehicleTag.residentId,
        society: vehicleTag.societyId,
        isExpired: false
      };

    } else if (type === 'guest') {
      const guestPass = await GuestPass.findById(passId)
        .populate('residentId', 'name phone flatDetails')
        .populate('societyId', 'societyName');

      if (!guestPass) {
        return res.status(404).json({ message: 'Guest pass not found' });
      }

      // Check if pass is expired
      if (new Date(guestPass.validUntil) < currentDate) {
        guestPass.status = 'Expired';
        await guestPass.save();
        return res.status(400).json({ 
          message: 'Guest pass has expired',
          data: {
            ...guestPass.toObject(),
            isExpired: true
          }
        });
      }

      // If pass is being used for the first time
      if (guestPass.status === 'Approved' && !guestPass.usedAt) {
        guestPass.usedAt = currentDate;
        guestPass.status = 'Used';
        await guestPass.save();
      }

      result = {
        type: 'guest',
        status: guestPass.status,
        validFrom: guestPass.validFrom,
        validUntil: guestPass.validUntil,
        guestDetails: guestPass.guestDetails,
        vehicleDetails: guestPass.vehicleDetails,
        resident: guestPass.residentId,
        society: guestPass.societyId,
        isExpired: false,
        usedAt: guestPass.usedAt
      };
    }

    res.status(200).json({
      message: 'QR code validated successfully',
      data: result
    });

  } catch (error) {
    console.error('Error scanning QR code:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 