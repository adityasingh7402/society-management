import connectToDatabase from "../../../lib/mongodb";
import VehicleTag from "../../../models/VehicleTag";
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const {
      residentId,
      societyId,
      vehicleType,
      brand,
      model,
      color,
      registrationNumber,
      validUntil
    } = req.body;

    // Validate required fields
    if (!residentId || !societyId || !vehicleType || !brand || !model || !color || !registrationNumber || !validUntil) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create vehicle details object
    const vehicleDetails = {
      brand,
      model,
      color,
      registrationNumber
    };

    // Generate a unique identifier for the tag
    const tagId = nanoid(10);

    // Create new vehicle tag first
    const vehicleTag = new VehicleTag({
      residentId,
      societyId,
      vehicleType,
      vehicleDetails,
      validFrom: new Date(),
      validUntil: new Date(validUntil),
      status: 'Pending'
    });

    // Save to get the _id
    await vehicleTag.save();

    // Now create QR code data with the saved tag's ID
    const qrData = JSON.stringify({
      tagId: vehicleTag._id
    });

    // Generate QR code with custom styling
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#4A90E2',  // Blue dots
        light: '#FFFFFF'  // White background
      },
      width: 400
    }); 

    // Update the tag with the QR code
    vehicleTag.qrCode = qrCodeImage;
    await vehicleTag.save();

    res.status(201).json({
      message: 'Vehicle tag created successfully',
      data: vehicleTag
    });

  } catch (error) {
    console.error('Error creating vehicle tag:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 