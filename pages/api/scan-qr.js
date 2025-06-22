import connectToDatabase from '../../lib/mongodb';
import VehicleTag from '../../models/VehicleTag';
import AnimalTag from '../../models/AnimalTag';
import GatePass from '../../models/GatePass';
import ServicePass from '../../models/ServicePass';

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
    if (!scannedData.societyId || !scannedData.pinCode) {
      return res.status(400).json({ message: 'Invalid QR code: Missing required fields' });
    }

    // Strict society ID validation
    if (scannedData.societyId !== securitySocietyId) {
      return res.status(403).json({ 
        message: 'Access denied: Security guard can only verify passes/tags from their own society' 
      });
    }

    let result;
    const now = new Date();

    switch (scannedData.tagType || scannedData.passType) {
      case 'vehicle': {
        const vehicleTag = await VehicleTag.findOne({
          _id: scannedData.tagId,
          societyId: securitySocietyId,
          pinCode: scannedData.pinCode
        })
        .populate('residentId', 'name flatDetails')
        .populate('societyId', 'societyName')
        .lean();

        if (!vehicleTag) {
          return res.status(401).json({ message: 'Invalid vehicle tag ID or PIN code' });
        }

        const isExpired = new Date(vehicleTag.validUntil) < now;
        if (isExpired && vehicleTag.status !== 'Expired') {
          await VehicleTag.findByIdAndUpdate(vehicleTag._id, { status: 'Expired' });
          vehicleTag.status = 'Expired';
        }

        result = {
          type: 'vehicle',
          status: vehicleTag.status,
          isExpired,
          vehicleType: vehicleTag.vehicleType,
          vehicleDetails: vehicleTag.vehicleDetails,
          resident: vehicleTag.residentId,
          society: vehicleTag.societyId,
          validFrom: vehicleTag.validFrom,
          validUntil: vehicleTag.validUntil
        };
        break;
      }

      case 'animal': {
        const animalTag = await AnimalTag.findOne({
          _id: scannedData.tagId,
          societyId: securitySocietyId,
          pinCode: scannedData.pinCode
        })
        .populate('residentId', 'name flatDetails')
        .populate('societyId', 'societyName')
        .lean();

        if (!animalTag) {
          return res.status(401).json({ message: 'Invalid animal tag ID or PIN code' });
        }

        result = {
          type: 'animal',
          status: animalTag.status,
          animalType: animalTag.animalType,
          animalDetails: animalTag.animalDetails,
          resident: animalTag.residentId,
          society: animalTag.societyId,
          registrationDate: animalTag.registrationDate
        };
        break;
      }

      case 'guest': {
        const gatePass = await GatePass.findOne({
          _id: scannedData.passId,
          societyId: securitySocietyId,
          pinCode: scannedData.pinCode
        })
        .populate('residentId', 'name flatDetails')
        .populate('societyId', 'societyName')
        .lean();

        if (!gatePass) {
          return res.status(401).json({ message: 'Invalid guest pass ID or PIN code' });
        }

        const isExpired = new Date(gatePass.duration.endDate) < now;
        if (isExpired && gatePass.status !== 'Expired') {
          await GatePass.findByIdAndUpdate(gatePass._id, { status: 'Expired' });
          gatePass.status = 'Expired';
        }

        result = {
          type: 'guest',
          status: gatePass.status,
          isExpired,
          guestDetails: gatePass.guestDetails,
          resident: gatePass.residentId,
          society: gatePass.societyId,
          validFrom: gatePass.duration.startDate,
          validUntil: gatePass.duration.endDate,
          hasVehicle: gatePass.hasVehicle,
          vehicleDetails: gatePass.vehicleDetails
        };
        break;
      }

      case 'service': {
        const servicePass = await ServicePass.findOne({
          _id: scannedData.passId,
          societyId: securitySocietyId,
          pinCode: scannedData.pinCode
        })
        .populate('residentId', 'name flatDetails')
        .populate('societyId', 'societyName')
        .lean();

        if (!servicePass) {
          return res.status(401).json({ message: 'Invalid service pass ID or PIN code' });
        }

        const isExpired = new Date(servicePass.duration.endDate) < now;
        if (isExpired && servicePass.status !== 'Expired') {
          await ServicePass.findByIdAndUpdate(servicePass._id, { status: 'Expired' });
          servicePass.status = 'Expired';
        }

        result = {
          type: 'service',
          status: servicePass.status,
          isExpired,
          personnelDetails: servicePass.personnelDetails,
          resident: servicePass.residentId,
          society: servicePass.societyId,
          validFrom: servicePass.duration.startDate,
          validUntil: servicePass.duration.endDate,
          workingHours: servicePass.workingHours
        };
        break;
      }

      default:
        return res.status(400).json({ message: 'Invalid tag/pass type' });
    }

    return res.status(200).json({ data: result });

  } catch (error) {
    console.error('Error scanning QR:', error);
    return res.status(500).json({ message: 'Failed to scan QR code' });
  }
} 