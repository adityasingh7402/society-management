import connectToDatabase from "../../../lib/mongodb";
import ServicePass from "../../../models/ServicePass";
import cloudinary from 'cloudinary';
import { IncomingForm } from 'formidable';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

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

  let tempFilePath = null;

  try {
    await connectToDatabase();

    const form = new IncomingForm();
    form.keepExtensions = true;

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // Extract fields (convert from arrays if needed)
    const residentId = Array.isArray(fields.residentId) ? fields.residentId[0] : fields.residentId;
    const societyId = Array.isArray(fields.societyId) ? fields.societyId[0] : fields.societyId;
    const societyName = Array.isArray(fields.societyName) ? fields.societyName[0] : fields.societyName;
    const flatNumber = Array.isArray(fields.flatNumber) ? fields.flatNumber[0] : fields.flatNumber;
    const personnelName = Array.isArray(fields.personnelName) ? fields.personnelName[0] : fields.personnelName;
    const personnelPhone = Array.isArray(fields.personnelPhone) ? fields.personnelPhone[0] : fields.personnelPhone;
    const serviceType = Array.isArray(fields.serviceType) ? fields.serviceType[0] : fields.serviceType;
    const otherServiceType = Array.isArray(fields.otherServiceType) ? fields.otherServiceType[0] : fields.otherServiceType;
    const passType = Array.isArray(fields.passType) ? fields.passType[0] : fields.passType;
    const startDate = Array.isArray(fields.startDate) ? fields.startDate[0] : fields.startDate;
    const endDate = Array.isArray(fields.endDate) ? fields.endDate[0] : fields.endDate;
    const startTime = Array.isArray(fields.startTime) ? fields.startTime[0] : fields.startTime;
    const endTime = Array.isArray(fields.endTime) ? fields.endTime[0] : fields.endTime;

    // Validate required fields
    if (!residentId || !societyId || !societyName || !flatNumber || !personnelName || !personnelPhone || !serviceType || !passType || !startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate other service type if service type is Other
    if (serviceType === 'Other' && !otherServiceType) {
      return res.status(400).json({ message: 'Please specify the other service type' });
    }

    // Handle personnel image upload if present
    let personnelImageUrl = null;
    const personnelImageFile = files.personnelImage;
    
    if (personnelImageFile) {
      const file = Array.isArray(personnelImageFile) ? personnelImageFile[0] : personnelImageFile;
      tempFilePath = file.filepath;
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(file.filepath, {
        resource_type: 'auto',
        folder: 'service-passes/personnel',
      });
      
      personnelImageUrl = result.secure_url;
    }

    // Generate unique PIN
    const pinCode = await generateUniquePIN();

    // Create new service pass
    const servicePass = new ServicePass({
      residentId,
      societyId,
      societyName,
      flatDetails: {
        flatNumber
      },
      personnelDetails: {
        name: personnelName,
        phone: personnelPhone,
        serviceType,
        otherServiceType: serviceType === 'Other' ? otherServiceType : undefined,
        personnelImage: personnelImageUrl
      },
      passType,
      duration: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      workingHours: {
        startTime,
        endTime
      },
      pinCode,
      status: 'Active'
    });

    // Save to database
    await servicePass.save();

    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    res.status(201).json({
      message: 'Service pass created successfully',
      data: servicePass,
      pinCode: pinCode // Return the PIN code to frontend
    });

  } catch (error) {
    console.error('Error creating service pass:', error);
    
    // Clean up temp file in case of error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    if (error.message === 'Unable to generate unique PIN. Please try again.') {
      return res.status(500).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
