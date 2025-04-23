import connectToDatabase from "../../../lib/mongodb";
import Society from "../../../models/Society";
import Resident from '../../../models/Resident';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { 
      societyId, 
      name, 
      phone, 
      email, 
      street, 
      city, 
      state, 
      pinCode
    } = req.body;

    // Step 1: Input Validation
    if (!societyId || !name || !phone || !email) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    try {
      await connectToDatabase();

      const society = await Society.findOne({ societyId: societyId });
      
      if (!society) {
        return res.status(400).json({ message: 'Society ID not found' });
      }

      const existingResident = await Resident.findOne({
        $or: [{ phone }, { email }]
      });

      if (existingResident) {
        const duplicateField = existingResident.phone === phone ? 'Mobile' : 'Email';
        return res.status(400).json({ message: `Resident with this ${duplicateField} already exists` });
      }

      const newResident = new Resident({
        name,
        phone,
        email,
        societyCode: society.societyId,
        societyId: society._id,
        societyName: society.societyName,
        address: {
          societyName: society.societyName,
          street: street || '',
          city: city || '',
          state: state || '',
          pinCode: pinCode || ''
        }
      });

      const savedResident = await newResident.save();

      await Society.findByIdAndUpdate(
        society._id,
        { $push: { residents: savedResident._id } },
        { runValidators: false }
      );

      res.status(200).json({ 
        message: 'Resident signed up successfully!',
        residentId: savedResident._id
      });
    } catch (error) {
      console.error('Error in resident signup:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}