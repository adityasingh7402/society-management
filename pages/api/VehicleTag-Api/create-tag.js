import connectToDatabase from "../../../lib/mongodb";
import VehicleTag from "../../../models/VehicleTag";
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

// Function to generate a random 6-digit PIN
const generatePIN = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to check if PIN exists
const isPINUnique = async (pin) => {
  const existingTag = await VehicleTag.findOne({ pinCode: pin });
  return !existingTag;
};

// Function to generate a unique PIN
const generateUniquePIN = async () => {
  let pin;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10; // Prevent infinite loop

  while (!isUnique && attempts < maxAttempts) {
    pin = generatePIN();
    isUnique = await isPINUnique(pin);
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Unable to generate unique PIN. Please try again.');
  }

  return pin;
};

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

    // Generate unique PIN
    const pinCode = await generateUniquePIN();

    // Create vehicle details object
    const vehicleDetails = {
      brand,
      model,
      color,
      registrationNumber
    };

    // Create new vehicle tag
    const vehicleTag = new VehicleTag({
      residentId,
      societyId,
      vehicleType,
      vehicleDetails,
      pinCode,
      validFrom: new Date(),
      validUntil: new Date(validUntil),
      status: 'Pending'
    });

    // Save to get the _id
    await vehicleTag.save();

    // Create QR code data with additional fields
    const qrData = JSON.stringify({
      tagId: vehicleTag._id,
      tagType: 'vehicle',
      societyId: societyId,
      pinCode: pinCode // Include PIN in QR data
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
    if (error.message === 'Unable to generate unique PIN. Please try again.') {
      return res.status(500).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
} 