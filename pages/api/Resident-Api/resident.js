import connectToDatabase from "../../../lib/mongodb";
import Society from "../../../models/Society";
import Resident from '../../../models/Resident';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { societyId, name, phone, email, street, city, state, unitNumber, pinCode } = req.body;

    // Step 1: Input Validation
    if (!societyId || !name || !phone || !email || !street || !city || !state || !unitNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Step 2: Connect to the database
    await connectToDatabase();

    try {
      // Step 3: Find the society by societyId
      const society = await Society.findOne({ societyId: societyId });

      if (!society) {
        return res.status(400).json({ message: 'Society ID not found' });
      }

      // Step 4: Check if a resident with the same phone number already exists
      const existingResident = await Resident.findOne({ phone });

      if (existingResident) {
        return res.status(400).json({ message: 'Resident with this Mobile already exists' });
      }

      // Step 5: Create the new resident document with structured address
      const newResident = new Resident({
        name,
        phone,
        email,
        unitNumber,
        societyCode: society.societyId,
        societyId: society._id, // Link to the society by _id
        societyName: society.societyName, // Store the society name
        address: {
          societyName: society.societyName, // Automatically set from the found society
          street,
          city,
          state,
          pinCode
        }
      });

      await newResident.save();

      // Step 6: Add the new resident's ID to the society's resident list
      if (!Array.isArray(society.residents)) {
        society.residents = []; // Ensure residents is an array
      }
      society.residents.push(newResident._id);
      await society.save();

      // Step 7: Respond with success message
      res.status(200).json({ message: 'Resident signed up successfully!' });
    } catch (error) {
      console.error('Error in signup:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
