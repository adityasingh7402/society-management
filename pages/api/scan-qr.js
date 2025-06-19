import connectToDatabase from '../../lib/mongodb';
import VehicleTag from '../../models/VehicleTag';
import GuestPass from '../../models/GuestPass';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    const { qrData, securitySocietyId } = req.body;

    if (!securitySocietyId) {
      return res.status(401).json({ message: 'Security authentication required' });
    }
    
    // Parse the QR data
    let scannedData;
    try {
      scannedData = JSON.parse(qrData);
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    // Validate required fields in QR data
    if (!scannedData.tagType || !scannedData.societyId) {
      return res.status(400).json({ message: 'Invalid QR code: Missing required fields' });
    }

    // Validate that the security guard belongs to the same society as the QR code
    if (scannedData.societyId !== securitySocietyId) {
      return res.status(403).json({ 
        message: 'Access denied: This QR code belongs to a different society' 
      });
    }
    
    if (scannedData.tagType === 'vehicle' && scannedData.tagId) {
      // This is a vehicle tag
      const vehicleTag = await VehicleTag.findOne({
        _id: scannedData.tagId,
        societyId: scannedData.societyId
      })
      .populate('residentId', 'name flat')
      .populate('societyId', 'societyName')
      .lean();

      if (!vehicleTag) {
        return res.status(404).json({ message: 'Vehicle tag not found or does not belong to this society' });
      }

      const isExpired = new Date(vehicleTag.validUntil) < new Date();

      // If tag is expired, update its status
      if (isExpired && vehicleTag.status !== 'Expired') {
        await VehicleTag.findByIdAndUpdate(scannedData.tagId, { status: 'Expired' });
        vehicleTag.status = 'Expired';
      }

      return res.status(200).json({
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
    } else if (scannedData.tagType === 'guest' && scannedData.passId) {
      // This is a guest pass
      const guestPass = await GuestPass.findOne({
        _id: scannedData.passId,
        societyId: scannedData.societyId
      })
      .populate('residentId', 'name flat')
      .populate('societyId', 'societyName')
      .lean();

      if (!guestPass) {
        return res.status(404).json({ message: 'Guest pass not found or does not belong to this society' });
      }

      const isExpired = new Date(guestPass.validUntil) < new Date();

      // If pass is expired, update its status
      if (isExpired && guestPass.status !== 'Expired') {
        await GuestPass.findByIdAndUpdate(scannedData.passId, { status: 'Expired' });
        guestPass.status = 'Expired';
      }

      return res.status(200).json({
        data: {
          type: 'guest',
          status: guestPass.status,
          isExpired,
          guestDetails: {
            name: guestPass.guestName,
            phone: guestPass.guestPhone
          },
          resident: guestPass.residentId,
          society: guestPass.societyId,
          validFrom: guestPass.validFrom,
          validUntil: guestPass.validUntil
        }
      });
    }

    return res.status(400).json({ message: 'Invalid QR code: Unsupported tag type' });

  } catch (error) {
    console.error('Error scanning QR:', error);
    return res.status(500).json({ message: 'Failed to scan QR code' });
  }
} 