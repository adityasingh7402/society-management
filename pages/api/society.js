import { IncomingForm } from 'formidable';
import connectToDatabase from '../../lib/mongodb'; // Import the DB connection helper
import Society from '../../models/Society'; // Import your Society model

export const config = {
  api: {
    bodyParser: false,  // Disable Next.js's default body parser to handle file uploads manually
  },
};

// Function to generate the unique societyId
function generateSocietyId() {
  // Generate a 6-digit random number
  const randomSuffix = Math.floor(100000 + Math.random() * 900000); // Ensure it's a 6-digit number
  return `${randomSuffix}`;
}

export default async function handler(req, res) {
  // Ensure that the database is connected before handling the request
  await connectToDatabase();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed', details: err.message });
    }

    // Log the parsed fields and files for debugging
    console.log('Fields:', fields);
    console.log('Files:', files);

    // Ensure all fields are strings (extract first value from arrays if necessary)
    const {
      societyName, societyType, managerName, managerPhone, managerEmail,
      societyAddress, zipCode, description, otp
    } = fields;

    // Convert any fields that are arrays to strings
    const formattedFields = {
      societyName: Array.isArray(societyName) ? societyName[0] : societyName,
      societyType: Array.isArray(societyType) ? societyType[0] : societyType,
      managerName: Array.isArray(managerName) ? managerName[0] : managerName,
      managerPhone: Array.isArray(managerPhone) ? managerPhone[0] : managerPhone,
      managerEmail: Array.isArray(managerEmail) ? managerEmail[0] : managerEmail,
      societyAddress: Array.isArray(societyAddress) ? societyAddress[0] : societyAddress,
      zipCode: Array.isArray(zipCode) ? zipCode[0] : zipCode,
      description: Array.isArray(description) ? description[0] : description,
      otp: Array.isArray(otp) ? otp[0] : otp
    };

    console.log('Formatted Fields:', formattedFields); // Log formatted fields

    try {
      // Generate a custom societyId
      formattedFields.managerPhone = `+91${formattedFields.managerPhone}`;
      const societyId = generateSocietyId();

      // Prepare society data
      const societyData = {
        societyId,  // The custom generated societyId
        ...formattedFields,
      };

      console.log('Society Data:', societyData); // Log the data being saved

      // Save society data to the database
      const society = new Society(societyData);
      await society.save();

      console.log('Society saved successfully:', society);

      // Respond with success message
      res.status(200).json({ success: true, message: 'Society data saved successfully!', data: society });

    } catch (error) {
      console.error('Error saving society data:', error);
      res.status(500).json({ message: 'Error saving society data', error: error.message });
    }
  });
}
