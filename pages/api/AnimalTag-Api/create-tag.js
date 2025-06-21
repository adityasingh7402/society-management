import connectToDatabase from "../../../lib/mongodb";
import AnimalTag from "../../../models/AnimalTag";

// Function to generate a random 6-digit PIN
const generatePIN = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to check if PIN exists
const isPINUnique = async (pin) => {
  const existingTag = await AnimalTag.findOne({ pinCode: pin });
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
      animalType,
      name,
      breed,
      color,
      age,
      gender,
      identificationMark,
      vaccinated,
      lastVaccinationDate,
      nextVaccinationDue,
      medicalHistory,
      documents,
      qrCodeDataUrl
    } = req.body;

    // Validate required fields
    if (!residentId || !societyId || !animalType || !name || !gender) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate unique PIN
    const pinCode = await generateUniquePIN();

    // Create animal details object
    const animalDetails = {
      name,
      breed,
      color,
      age,
      gender,
      identificationMark,
      vaccinated,
      lastVaccinationDate,
      nextVaccinationDue,
      medicalHistory
    };

    // Create new animal tag
    const animalTag = new AnimalTag({
      residentId,
      societyId,
      animalType,
      animalDetails,
      pinCode,
      registrationDate: new Date(),
      status: 'Pending',
      qrCode: qrCodeDataUrl,
      documents: documents || []
    });

    // Save to database
    await animalTag.save();

    res.status(201).json({
      message: 'Animal tag created successfully',
      data: animalTag,
      pinCode: pinCode // Return the PIN code to frontend
    });

  } catch (error) {
    console.error('Error creating animal tag:', error);
    if (error.message === 'Unable to generate unique PIN. Please try again.') {
      return res.status(500).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
} 