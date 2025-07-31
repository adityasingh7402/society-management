import connectToDatabase from '../../../lib/mongodb';
import GatePass from '../../../models/GatePass';
import cloudinary from 'cloudinary';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import mongoose from 'mongoose';

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

// Utility function to generate PIN code
function generatePinCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    pin = generatePinCode();
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
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const form = new IncomingForm();
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'File upload parsing failed', 
        details: err.message 
      });
    }

    // Start a database session for transaction support
    let session = null;
    let uploadedImageUrl = null;
    let tempFilePath = null;

    try {
      // Connect to the database
      await connectToDatabase();
      
      // Extract form data - handle arrays from formidable
      const residentId = Array.isArray(fields.residentId) ? fields.residentId[0] : fields.residentId;
      const societyId = Array.isArray(fields.societyId) ? fields.societyId[0] : fields.societyId;
      const societyName = Array.isArray(fields.societyName) ? fields.societyName[0] : fields.societyName;
      
      // Flat details
      const flatBlock = Array.isArray(fields.flatBlock) ? fields.flatBlock[0] : fields.flatBlock;
      const flatFloor = Array.isArray(fields.flatFloor) ? fields.flatFloor[0] : fields.flatFloor;
      const flatNumber = Array.isArray(fields.flatNumber) ? fields.flatNumber[0] : fields.flatNumber;
      
      // Guest details
      const guestName = Array.isArray(fields.guestName) ? fields.guestName[0] : fields.guestName;
      const guestPhone = Array.isArray(fields.guestPhone) ? fields.guestPhone[0] : fields.guestPhone;
      const guestPurpose = Array.isArray(fields.guestPurpose) ? fields.guestPurpose[0] : fields.guestPurpose;
      
      // Duration
      const startDate = Array.isArray(fields.startDate) ? fields.startDate[0] : fields.startDate;
      const endDate = Array.isArray(fields.endDate) ? fields.endDate[0] : fields.endDate;
      const days = Array.isArray(fields.days) ? fields.days[0] : fields.days;
      
      // Vehicle details
      const hasVehicle = Array.isArray(fields.hasVehicle) ? fields.hasVehicle[0] === 'true' : fields.hasVehicle === 'true';
      const vehicleType = Array.isArray(fields.vehicleType) ? fields.vehicleType[0] : fields.vehicleType;
      const registrationNumber = Array.isArray(fields.registrationNumber) ? fields.registrationNumber[0] : fields.registrationNumber;

      // Validate required fields
      if (!residentId || !societyId || !societyName || !guestName || !guestPhone || !guestPurpose || !startDate || !endDate || !days) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      // Validate duration
      if (parseInt(days) < 1 || parseInt(days) > 10) {
        return res.status(400).json({ 
          success: false, 
          error: 'Duration must be between 1 and 10 days' 
        });
      }

      // Validate vehicle details if hasVehicle is true
      if (hasVehicle && (!vehicleType || !registrationNumber)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing vehicle details' 
        });
      }

      // Handle optional image upload
      const imageFile = files.guestImage;
      if (imageFile) {
        const file = Array.isArray(imageFile) ? imageFile[0] : imageFile;
        tempFilePath = file.filepath;

        // Upload image to Cloudinary
        console.log('Uploading guest image to Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(file.filepath, {
          resource_type: 'auto',
          folder: 'gate-pass-images', // Organize images in a folder
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Optimize image size
            { quality: 'auto' }
          ]
        });
        uploadedImageUrl = uploadResult.secure_url;
        console.log('Guest image uploaded successfully:', uploadedImageUrl);
      }

      // Start database transaction
      session = await mongoose.startSession();
      session.startTransaction();

      // Generate PIN code
      const pinCode = await generateUniquePIN();

      // Create gate pass record with optional image URL
      const newGatePass = new GatePass({
        residentId,
        societyId,
        societyName,
        flatDetails: {
          block: flatBlock || '',
          floor: flatFloor || '',
          flatNumber: flatNumber || ''
        },
        guestDetails: {
          name: guestName,
          phone: guestPhone,
          purpose: guestPurpose
        },
        duration: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          days: parseInt(days)
        },
        hasVehicle,
        vehicleDetails: {
          vehicleType: hasVehicle ? (vehicleType || '') : '',
          registrationNumber: hasVehicle ? (registrationNumber || '') : ''
        },
        guestImage: uploadedImageUrl, // Include image URL if uploaded
        pinCode,
        status: 'Active'
      });

      const savedGatePass = await newGatePass.save({ session });
      console.log('Gate pass saved to database:', savedGatePass._id);

      // Commit transaction
      await session.commitTransaction();
      console.log('Transaction committed successfully');

      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      // Success response
      res.status(201).json({
        success: true,
        message: 'Gate pass created successfully' + (uploadedImageUrl ? ' with guest image' : ''),
        data: savedGatePass,
        pinCode: pinCode
      });

    } catch (error) {
      console.error('Error in gate pass creation:', error);

      // Rollback transaction if it was started
      if (session) {
        try {
          await session.abortTransaction();
          console.log('Transaction rolled back');
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError);
        }
      }

      // Clean up uploaded image if database operation failed
      if (uploadedImageUrl) {
        try {
          // Extract public_id from Cloudinary URL for deletion
          const publicId = uploadedImageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`gate-pass-images/${publicId}`);
          console.log('Uploaded image cleaned up from Cloudinary');
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded image:', cleanupError);
        }
      }

      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (fileError) {
          console.error('Error cleaning up temp file:', fileError);
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create gate pass',
        details: error.message
      });

    } finally {
      // Always end the session
      if (session) {
        session.endSession();
      }
    }
  });
}
