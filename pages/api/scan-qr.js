import { connectToDatabase } from '../../lib/mongodb';
import VehicleTag from '../../models/VehicleTag';
import GuestPass from '../../models/GuestPass';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    const { qrData } = req.body;
    
    // Parse the QR data
    const scannedData = JSON.parse(qrData);
    
    if (scannedData.tagId) {
      // This is a vehicle tag
      const vehicleTag = await VehicleTag.findById(scannedData.tagId)
        .populate('resident', 'name flat')
        .lean();

      if (!vehicleTag) {
        return res.status(404).json({ message: 'Vehicle tag not found' });
      }

      const isExpired = new Date(vehicleTag.validUntil) < new Date();

      return res.status(200).json({
        data: {
          type: 'vehicle',
          status: vehicleTag.status,
          isExpired,
          vehicleDetails: {
            vehicleType: vehicleTag.vehicleType,
            registrationNumber: vehicleTag.registrationNumber
          },
          resident: vehicleTag.resident,
          validUntil: vehicleTag.validUntil
        }
      });
    } else if (scannedData.passId) {
      // This is a guest pass
      const guestPass = await GuestPass.findById(scannedData.passId)
        .populate('resident', 'name flat')
        .lean();

      if (!guestPass) {
        return res.status(404).json({ message: 'Guest pass not found' });
      }

      const isExpired = new Date(guestPass.validUntil) < new Date();

      return res.status(200).json({
        data: {
          type: 'guest',
          status: guestPass.status,
          isExpired,
          guestDetails: {
            name: guestPass.guestName,
            phone: guestPass.guestPhone
          },
          resident: guestPass.resident,
          validUntil: guestPass.validUntil
        }
      });
    }

    return res.status(400).json({ message: 'Invalid QR code data' });

  } catch (error) {
    console.error('Error scanning QR:', error);
    return res.status(500).json({ message: 'Failed to scan QR code' });
  }
} 