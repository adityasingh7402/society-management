import { IncomingForm } from 'formidable';
import connectToDatabase from '../../lib/mongodb'; // Import the DB connection helper
import Society from '../../models/Society'; // Import your Society model

export const config = {
  api: {
    bodyParser: false, // Disable Next.js's default body parser to handle file uploads manually
  },
};

// Function to generate the unique societyId
function generateSocietyId() {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000); // Ensure it's a 6-digit number
  return `${randomSuffix}`;
}

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed', details: err.message });
    }

    console.log('Fields:', fields);
    console.log('Files:', files);

    // Extract and format fields
    const {
      societyName, societyType, societyStructureType, customStructureTypeName,
      managerName, managerPhone, managerEmail,
      street, city, state, pinCode, description, otp
    } = fields;

    const formattedFields = {
      societyName: Array.isArray(societyName) ? societyName[0] : societyName,
      societyType: Array.isArray(societyType) ? societyType[0] : societyType,
      societyStructureType: Array.isArray(societyStructureType) ? societyStructureType[0] : societyStructureType,
      customStructureTypeName: Array.isArray(customStructureTypeName) ? customStructureTypeName[0] : customStructureTypeName,
      managerName: Array.isArray(managerName) ? managerName[0] : managerName,
      managerPhone: Array.isArray(managerPhone) ? managerPhone[0] : managerPhone,
      managerEmail: Array.isArray(managerEmail) ? managerEmail[0] : managerEmail,
      street: Array.isArray(street) ? street[0] : street,
      city: Array.isArray(city) ? city[0] : city,
      state: Array.isArray(state) ? state[0] : state,
      pinCode: Array.isArray(pinCode) ? pinCode[0] : pinCode,
      description: Array.isArray(description) ? description[0] : description,
      otp: Array.isArray(otp) ? otp[0] : otp
    };

    console.log('Formatted Fields:', formattedFields);

    try {
      formattedFields.managerPhone = `+91${formattedFields.managerPhone}`;
      const societyId = generateSocietyId();

      const societyData = {
        societyId,
        ...formattedFields,
      };

      console.log('Society Data:', societyData);

      const society = new Society(societyData);
      await society.save();

      console.log('Society saved successfully:', society);

      res.status(200).json({ success: true, message: 'Society data saved successfully!', data: society });
    } catch (error) {
      console.error('Error saving society data:', error);
      res.status(500).json({ message: 'Error saving society data', error: error.message });
    }
  });
}
