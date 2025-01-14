import connectToDatabase from "../../../lib/mongodb";
import Society from "../../../models/Society";
import Resident from '../../../models/Resident';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { societyId, name, phone, email, address, unitNumber } = req.body;

    console.log(societyId, name, phone, email, address, unitNumber )
    // Step 1: Input Validation
    if (!societyId || !name || !phone || !email || !address || !unitNumber) {
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

      // Step 4: Check if a resident with the same email already exists
      const existingResident = await Resident.findOne({ phone });

      if (existingResident) {
        return res.status(400).json({ message: 'Resident with this email already exists' });
      }

      // Step 5: Create the new resident document
      const newResident = new Resident({
        name,
        phone,
        email,
        address,
        unitNumber,
        societyId: society._id, // Link to the society by _id
        societyName: society.societyName, // Store the society name
      });

      await newResident.save();

      // Step 6: Add the new resident's ID to the society's resident list
      console.log(society.residents)
      if (!society.residents) {
        society.residents = []; // Ensure residents is an array
      }
      society.residents.push(newResident._id);
      await society.save();
      console.log(society.residents)

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
