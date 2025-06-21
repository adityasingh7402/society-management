import connectToDatabase from "../../../lib/mongodb";
import ServicePass from "../../../models/ServicePass";

// Function to generate a random 6-digit PIN
const generatePIN = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to check if PIN exists
const isPINUnique = async (pin) => {
  const existingPass = await ServicePass.findOne({ pinCode: pin });
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
      personnelDetails,
      passType,
      duration,
      workingHours
    } = req.body;

    // Validate required fields
    if (!residentId || !societyId || !societyName || !flatDetails || !personnelDetails || !passType || !duration || !workingHours) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate personnel details
    if (!personnelDetails.name || !personnelDetails.phone || !personnelDetails.serviceType) {
      return res.status(400).json({ message: 'Missing personnel details' });
    }

    // Validate other service type if service type is Other
    if (personnelDetails.serviceType === 'Other' && !personnelDetails.otherServiceType) {
      return res.status(400).json({ message: 'Please specify the other service type' });
    }

    // Validate duration
    if (!duration.startDate || !duration.endDate) {
      return res.status(400).json({ message: 'Invalid duration' });
    }

    // Validate working hours
    if (!workingHours.startTime || !workingHours.endTime) {
      return res.status(400).json({ message: 'Invalid working hours' });
    }

    // Generate unique PIN
    const pinCode = await generateUniquePIN();

    // Create new service pass
    const servicePass = new ServicePass({
      residentId,
      societyId,
      societyName,
      flatDetails,
      personnelDetails,
      passType,
      duration: {
        startDate: new Date(duration.startDate),
        endDate: new Date(duration.endDate)
      },
      workingHours,
      pinCode,
      status: 'Active'
    });

    // Save to database
    await servicePass.save();

    res.status(201).json({
      message: 'Service pass created successfully',
      data: servicePass,
      pinCode: pinCode // Return the PIN code to frontend
    });

  } catch (error) {
    console.error('Error creating service pass:', error);
    if (error.message === 'Unable to generate unique PIN. Please try again.') {
      return res.status(500).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
} 