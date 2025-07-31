import connectToDatabase from '../../../lib/mongodb';
import AnimalTag from '../../../models/AnimalTag';
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
      const animalType = Array.isArray(fields.animalType) ? fields.animalType[0] : fields.animalType;
      const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
      const breed = Array.isArray(fields.breed) ? fields.breed[0] : fields.breed;
      const color = Array.isArray(fields.color) ? fields.color[0] : fields.color;
      const age = Array.isArray(fields.age) ? fields.age[0] : fields.age;
      const gender = Array.isArray(fields.gender) ? fields.gender[0] : fields.gender;
      const identificationMark = Array.isArray(fields.identificationMark) ? fields.identificationMark[0] : fields.identificationMark;
      const vaccinated = Array.isArray(fields.vaccinated) ? fields.vaccinated[0] : fields.vaccinated;
      const lastVaccinationDate = Array.isArray(fields.lastVaccinationDate) ? fields.lastVaccinationDate[0] : fields.lastVaccinationDate;
      const nextVaccinationDue = Array.isArray(fields.nextVaccinationDue) ? fields.nextVaccinationDue[0] : fields.nextVaccinationDue;
      const medicalHistory = Array.isArray(fields.medicalHistory) ? fields.medicalHistory[0] : fields.medicalHistory;
      const qrCodeDataUrl = Array.isArray(fields.qrCodeDataUrl) ? fields.qrCodeDataUrl[0] : fields.qrCodeDataUrl;

      // Validate required fields
      if (!residentId || !societyId || !animalType || !name || !gender) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      // Handle optional image upload
      const imageFile = files.animalImage;
      if (imageFile) {
        const file = Array.isArray(imageFile) ? imageFile[0] : imageFile;
        tempFilePath = file.filepath;

        // Upload image to Cloudinary
        console.log('Uploading animal image to Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(file.filepath, {
          resource_type: 'auto',
          folder: 'animal-tags', // Organize images in a folder
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Optimize image size
            { quality: 'auto' }
          ]
        });
        uploadedImageUrl = uploadResult.secure_url;
        console.log('Animal image uploaded successfully:', uploadedImageUrl);
      }

      // Start database transaction
      session = await mongoose.startSession();
      session.startTransaction();

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

      // Create new animal tag with optional image URL
      const newAnimalTag = new AnimalTag({
        residentId,
        societyId,
        animalType,
        animalDetails,
        pinCode,
        registrationDate: new Date(),
        status: 'Pending',
        qrCode: qrCodeDataUrl,
        animalImage: uploadedImageUrl, // Include image URL if uploaded
        documents: [] // Default empty array
      });

      const savedAnimalTag = await newAnimalTag.save({ session });
      console.log('Animal tag saved to database:', savedAnimalTag._id);

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
        message: 'Animal tag created successfully' + (uploadedImageUrl ? ' with image' : ''),
        animalTag: savedAnimalTag,
        pinCode: pinCode
      });

    } catch (error) {
      console.error('Error in animal tag creation:', error);

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
          await cloudinary.uploader.destroy(`animal-tags/${publicId}`);
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

      // Handle specific PIN generation error
      if (error.message === 'Unable to generate unique PIN. Please try again.') {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create animal tag',
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
