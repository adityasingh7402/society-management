import connectToDatabase from '../../lib/mongodb';
import VehicleTag from '../../models/VehicleTag';

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
        message: 'Access denied: Security guard can only verify vehicle tags from their own society' 
      });
    }
    
    // Build query based on available data
    const query = {
      societyId: securitySocietyId, // Use security's society ID for verification
      pinCode: scannedData.pinCode
    };

    // Add tagId to query if available
    if (scannedData.tagId) {
      query._id = scannedData.tagId;
    }

    // Find vehicle tag with matching criteria
    const vehicleTag = await VehicleTag.findOne(query)
      .populate('residentId', 'name flatDetails')
      .populate('societyId', 'societyName')
      .lean();

    if (!vehicleTag) {
      return res.status(401).json({ 
        message: scannedData.tagId 
          ? 'Invalid vehicle tag ID or PIN code' 
          : 'Invalid PIN code or vehicle tag does not belong to this society'
      });
    }

    // Double-check society match
    if (vehicleTag.societyId._id.toString() !== securitySocietyId) {
      return res.status(403).json({ 
        message: 'Access denied: Vehicle tag belongs to a different society' 
      });
    }

    const isExpired = new Date(vehicleTag.validUntil) < new Date();

    // If tag is expired, update its status
    if (isExpired && vehicleTag.status !== 'Expired') {
      await VehicleTag.findByIdAndUpdate(vehicleTag._id, { status: 'Expired' });
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

  } catch (error) {
    console.error('Error scanning vehicle QR:', error);
    return res.status(500).json({ message: 'Failed to scan vehicle QR code' });
  }
} 