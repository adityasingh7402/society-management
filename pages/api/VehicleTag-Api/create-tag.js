import connectToDatabase from "../../../lib/mongodb";
import VehicleTag from "../../../models/VehicleTag";
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
      validUntil,
      qrCodeDataUrl // Accept QR code data URL from frontend
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
      status: 'Pending',
      qrCode: qrCodeDataUrl // Store the QR code data URL
    });

    // Save to database
    await vehicleTag.save();

    res.status(201).json({
      message: 'Vehicle tag created successfully',
      data: vehicleTag,
      pinCode: pinCode // Return the PIN code to frontend
    });

  } catch (error) {
    console.error('Error creating vehicle tag:', error);
    if (error.message === 'Unable to generate unique PIN. Please try again.') {
      return res.status(500).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
} 