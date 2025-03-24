import connectToDatabase from "../../../lib/mongodb";
import Society from "../../../models/Society";
import SecurityGuard from "../../../models/Security";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { societyId, guardName, guardPhone, email, shiftStart, shiftEnd, street, city, state, pinCode } = req.body;
    
    // Step 1: Input Validation
    if (!societyId || !guardName || !guardPhone || !email || !shiftStart || !shiftEnd || !street || !city || !state) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    try {
      // Step 2: Connect to the database
      await connectToDatabase();

      // Step 3: Find the society by societyId
      const society = await Society.findOne({ societyId: societyId });

      if (!society) {
        return res.status(400).json({ message: 'Society ID not found' });
      }

      // Step 4: Check if a security guard with the same phone already exists
      const existingGuard = await SecurityGuard.findOne({ guardPhone });

      if (existingGuard) {
        return res.status(400).json({ message: 'Security guard with this phone number already exists' });
      }

      // Step 5: Create the new security guard document with structured address
      const newSecurityGuard = new SecurityGuard({
        securityId: `SEC-${Date.now()}`, // Example of generating a unique security ID
        guardName,
        guardPhone,
        email,
        shiftTimings: { start: shiftStart, end: shiftEnd }, // Send shift timings as an object
        societyId: society._id, // Link to the society by _id
        societyCode: society.societyId,
        societyName: society.societyName, // Store the society name
        address: {
          societyName: society.societyName, // Automatically set from the found society
          street,
          city,
          state,
          pinCode: pinCode || ''
        }
      });

      await newSecurityGuard.save();

      // Step 6: Update the society's security list using findByIdAndUpdate
      // This avoids triggering validation on the entire society document
      await Society.findByIdAndUpdate(
        society._id,
        { $push: { security: newSecurityGuard._id } },
        { runValidators: false }
      );

      // Step 7: Respond with success message
      res.status(200).json({ message: 'Security guard signed up successfully!' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}