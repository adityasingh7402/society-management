import connectDB from '../../../lib/mongodb';
import cloudinary from 'cloudinary';
import { IncomingForm } from 'formidable';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new IncomingForm({ multiples: true });
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'File upload failed', details: err.message });
      }

      try {
        const imageFiles = files.image;
        if (!imageFiles) {
          return res.status(400).json({ error: 'No image files provided' });
        }

        // Convert to array if single file
        const filesArray = Array.isArray(imageFiles) ? imageFiles : [imageFiles];

        // Upload all images to Cloudinary
        const uploadPromises = filesArray.map(async (file) => {
          try {
            const result = await cloudinary.uploader.upload(file.filepath, {
              resource_type: 'auto',
              folder: 'society_Images',
            });
            
            // Delete the temporary file after successful upload
            fs.unlinkSync(file.filepath);
            
            return result.secure_url;
          } catch (error) {
            console.error('Error uploading file:', error);
            // Delete the temporary file in case of error
            if (fs.existsSync(file.filepath)) {
              fs.unlinkSync(file.filepath);
            }
            throw error;
          }
        });

        const imageUrls = await Promise.all(uploadPromises);

        await connectDB();

        res.status(200).json({ 
          success: true, 
          message: 'Images uploaded successfully', 
          imageUrls 
        });
      } catch (error) {
        console.error('Error in uploading images:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Internal server error', 
          details: error.message 
        });
      }
    });
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}