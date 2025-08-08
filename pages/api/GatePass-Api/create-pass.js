import connectToDatabase from "../../../lib/mongodb";
import GatePass from "../../../models/GatePass";
import { nanoid } from 'nanoid';
import { logSuccess, logFailure } from '../../../services/loggingService';

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
      await logFailure('CREATE_GATE_PASS', req, 'Missing required fields', {
        providedFields: {
          residentId: !!residentId,
          societyId: !!societyId,
          societyName: !!societyName,
          flatDetails: !!flatDetails,
          guestDetails: !!guestDetails,
          duration: !!duration
        },
        errorType: 'VALIDATION_ERROR'
      });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate guest details
    if (!guestDetails.name || !guestDetails.phone || !guestDetails.purpose) {
      await logFailure('CREATE_GATE_PASS', req, 'Missing guest details', {
        providedGuestFields: {
          name: !!(guestDetails && guestDetails.name),
          phone: !!(guestDetails && guestDetails.phone),
          purpose: !!(guestDetails && guestDetails.purpose)
        },
        residentId,
        societyId,
        errorType: 'VALIDATION_ERROR'
      });
      return res.status(400).json({ message: 'Missing guest details' });
    }

    // Validate duration
    if (!duration.startDate || !duration.endDate || !duration.days || 
        duration.days < 1 || duration.days > 10) {
      await logFailure('CREATE_GATE_PASS', req, 'Invalid duration', {
        providedDuration: {
          startDate: !!(duration && duration.startDate),
          endDate: !!(duration && duration.endDate),
          days: duration && duration.days
        },
        residentId,
        societyId,
        errorType: 'VALIDATION_ERROR'
      });
      return res.status(400).json({ message: 'Invalid duration. Must be between 1 and 10 days.' });
    }

    // Validate vehicle details if hasVehicle is true
    if (hasVehicle && (!vehicleDetails || !vehicleDetails.vehicleType || !vehicleDetails.registrationNumber)) {
      await logFailure('CREATE_GATE_PASS', req, 'Missing vehicle details', {
        hasVehicle,
        providedVehicleFields: {
          vehicleType: !!(vehicleDetails && vehicleDetails.vehicleType),
          registrationNumber: !!(vehicleDetails && vehicleDetails.registrationNumber)
        },
        residentId,
        societyId,
        errorType: 'VALIDATION_ERROR'
      });
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

    // Log successful gate pass creation
    await logSuccess('CREATE_GATE_PASS', req, {
      message: 'Gate pass created successfully',
      gatePassId: gatePass._id.toString(),
      residentId,
      societyId,
      societyName,
      guestName: guestDetails.name,
      guestPhone: guestDetails.phone,
      guestPurpose: guestDetails.purpose,
      startDate: gatePass.duration.startDate,
      endDate: gatePass.duration.endDate,
      durationDays: gatePass.duration.days,
      hasVehicle,
      vehicleType: hasVehicle ? vehicleDetails.vehicleType : null,
      registrationNumber: hasVehicle ? vehicleDetails.registrationNumber : null,
      pinCode: pinCode,
      status: gatePass.status
    }, gatePass._id.toString(), 'gate_pass');

    res.status(201).json({
      message: 'Gate pass created successfully',
      data: gatePass,
      pinCode: pinCode // Return the PIN code to frontend
    });

  } catch (error) {
    console.error('Error creating gate pass:', error);
    
    // Log failure
    await logFailure('CREATE_GATE_PASS', req, error.message === 'Unable to generate unique PIN. Please try again.' ? error.message : 'Failed to create gate pass', {
      errorMessage: error.message,
      errorType: error.name || 'UNKNOWN_ERROR',
      residentId: req.body?.residentId,
      societyId: req.body?.societyId,
      guestName: req.body?.guestDetails?.name,
      hasVehicle: req.body?.hasVehicle
    });
    
    if (error.message === 'Unable to generate unique PIN. Please try again.') {
      return res.status(500).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
} 