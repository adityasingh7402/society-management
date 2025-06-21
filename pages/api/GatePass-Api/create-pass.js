import connectToDatabase from "../../../lib/mongodb";
import GatePass from "../../../models/GatePass";
import { nanoid } from 'nanoid';

// Function to generate a random 6-digit PIN
const generatePIN = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to check if PIN exists
const isPINUnique = async (pin) => {
  const existingPass = await GatePass.findOne({ pinCode: pin });
  return !existingPass;
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
      societyName,
      flatDetails,
      guestDetails,
      duration,
      hasVehicle,
      vehicleDetails
    } = req.body;

    // Validate required fields
    if (!residentId || !societyId || !societyName || !flatDetails || !guestDetails || !duration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate guest details
    if (!guestDetails.name || !guestDetails.phone || !guestDetails.purpose) {
      return res.status(400).json({ message: 'Missing guest details' });
    }

    // Validate duration
    if (!duration.startDate || !duration.endDate || !duration.days || 
        duration.days < 1 || duration.days > 10) {
      return res.status(400).json({ message: 'Invalid duration. Must be between 1 and 10 days.' });
    }

    // Validate vehicle details if hasVehicle is true
    if (hasVehicle && (!vehicleDetails || !vehicleDetails.vehicleType || !vehicleDetails.registrationNumber)) {
      return res.status(400).json({ message: 'Missing vehicle details' });
    }

    // Generate unique PIN
    const pinCode = await generateUniquePIN();

    // Create new gate pass
    const gatePass = new GatePass({
      residentId,
      societyId,
      societyName,
      flatDetails,
      guestDetails,
      duration: {
        startDate: new Date(duration.startDate),
        endDate: new Date(duration.endDate),
        days: duration.days
      },
      hasVehicle,
      vehicleDetails: hasVehicle ? vehicleDetails : { vehicleType: '', registrationNumber: '' },
      pinCode,
      status: 'Active'
    });

    // Save to database
    await gatePass.save();

    res.status(201).json({
      message: 'Gate pass created successfully',
      data: gatePass,
      pinCode: pinCode // Return the PIN code to frontend
    });

  } catch (error) {
    console.error('Error creating gate pass:', error);
    if (error.message === 'Unable to generate unique PIN. Please try again.') {
      return res.status(500).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
} 