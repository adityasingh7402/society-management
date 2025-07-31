import connectToDatabase from '../../../lib/mongodb';
import VehicleTag from '../../../models/VehicleTag';
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
  return Math.floor(100000 + Math.random() * 900000);
}

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
      const societyId = Array.isArray(fields.societyId) ? fields.societyId[0] : fields.societyId;
      const residentId = Array.isArray(fields.residentId) ? fields.residentId[0] : fields.residentId;
      const vehicleType = Array.isArray(fields.vehicleType) ? fields.vehicleType[0] : fields.vehicleType;
      const registrationNumber = Array.isArray(fields.registrationNumber) ? fields.registrationNumber[0] : fields.registrationNumber;
      const vehicleBrand = Array.isArray(fields.vehicleBrand) ? fields.vehicleBrand[0] : fields.vehicleBrand;
      const vehicleModel = Array.isArray(fields.vehicleModel) ? fields.vehicleModel[0] : fields.vehicleModel;
      const vehicleColor = Array.isArray(fields.vehicleColor) ? fields.vehicleColor[0] : fields.vehicleColor;
      const driverName = Array.isArray(fields.driverName) ? fields.driverName[0] : fields.driverName;
      const driverMobile = Array.isArray(fields.driverMobile) ? fields.driverMobile[0] : fields.driverMobile;
      const reason = Array.isArray(fields.reason) ? fields.reason[0] : fields.reason;
      const validFrom = Array.isArray(fields.validFrom) ? fields.validFrom[0] : fields.validFrom;
      const validUntil = Array.isArray(fields.validUntil) ? fields.validUntil[0] : fields.validUntil;
      const qrCodeData = Array.isArray(fields.qrCodeData) ? fields.qrCodeData[0] : fields.qrCodeData;

      // Validate required fields
      if (!societyId || !residentId || !vehicleType || !registrationNumber) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      // Handle optional image upload
      const imageFile = files.vehicleImage;
      if (imageFile) {
        const file = Array.isArray(imageFile) ? imageFile[0] : imageFile;
        tempFilePath = file.filepath;

        // Upload image to Cloudinary
        console.log('Uploading vehicle image to Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(file.filepath, {
          resource_type: 'auto',
          folder: 'vehicle-tags', // Organize images in a folder
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Optimize image size
            { quality: 'auto' }
          ]
        });
        uploadedImageUrl = uploadResult.secure_url;
        console.log('Vehicle image uploaded successfully:', uploadedImageUrl);
      }

      // Start database transaction
      session = await mongoose.startSession();
      session.startTransaction();

      // Generate PIN code
      const pinCode = generatePinCode();

      // Create vehicle tag record with optional image URL
      const newVehicleTag = new VehicleTag({
        societyId,
        residentId,
        vehicleType,
        vehicleDetails: {
          registrationNumber,
          brand: vehicleBrand,
          model: vehicleModel,
          color: vehicleColor
        },
        driverName,
        driverMobile,
        reason,
        validFrom: validFrom ? new Date(validFrom) : new Date(), // Default to current date if not provided
        validUntil: validUntil ? new Date(validUntil) : null,
        vehicleImage: uploadedImageUrl, // Include image URL if uploaded
        qrCodeData,
        pinCode,
        status: 'Pending', // Capitalized to match schema enum
        createdAt: new Date()
      });

      const savedVehicleTag = await newVehicleTag.save({ session });
      console.log('Vehicle tag saved to database:', savedVehicleTag._id);

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
        message: 'Vehicle tag created successfully' + (uploadedImageUrl ? ' with image' : ''),
        vehicleTag: savedVehicleTag,
        pinCode: pinCode
      });

    } catch (error) {
      console.error('Error in vehicle tag creation:', error);

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
          await cloudinary.uploader.destroy(`vehicle-tags/${publicId}`);
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
        error: 'Failed to create vehicle tag',
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
