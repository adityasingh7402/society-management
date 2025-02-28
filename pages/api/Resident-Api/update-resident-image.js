import connectToDatabase from '../../../lib/mongodb';
import Resident from '../../../models/Resident';
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

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new IncomingForm();
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'File upload failed', details: err.message });
      }

      try {
        // Extract residentId from fields
        const { residentId } = fields;
        console.log('Resident ID:', residentId); // Debugging log

        if (!residentId) {
          return res.status(400).json({ error: 'Resident ID is required' });
        }

        // Handle file upload
        const imageFile = files.image; // Assuming the field name is "image"
        console.log('Image file:', imageFile); // Debugging log

        if (!imageFile) {
          return res.status(400).json({ error: 'No image file provided' });
        }

        // Extract the first file from the array (if it's an array)
        const file = Array.isArray(imageFile) ? imageFile[0] : imageFile;

        // Upload the image to Cloudinary using the file path
        const result = await cloudinary.uploader.upload(file.filepath, {
          resource_type: 'auto', // Automatically detect the file type
        });
        const imageUrl = result.secure_url;
        console.log('Image uploaded to Cloudinary:', imageUrl); // Debugging log

        // Connect to the database
        await connectToDatabase();

        // Find the resident by ID and update the userImage field
        const resident = await Resident.findById(residentId);
        if (!resident) {
          return res.status(404).json({ error: 'Resident not found' });
        }

        resident.userImage = imageUrl;
        await resident.save();

        // Delete the temporary file after uploading
        fs.unlinkSync(file.filepath);

        res.status(200).json({ success: 'Image uploaded and resident updated successfully', imageUrl });
      } catch (error) {
        console.error('Error in updating resident image:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}