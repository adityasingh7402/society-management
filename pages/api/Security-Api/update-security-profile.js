import connectToDatabase from '../../../lib/mongodb'; // Import the DB connection helper
import Security from '../../../models/Security'; // Import your Security model

export default async function handler(req, res) {
  await connectToDatabase(); // Ensure the database connection is established

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Token missing.' });
    }

    // Add token verification logic here
    // const user = verifyToken(token);
    // if (!user) {
    //   return res.status(403).json({ error: 'Forbidden: Invalid token.' });
    // }

    const {
      securityId, // Security ID to identify the record
      guardName,
      guardPhone,
      shiftTimings, // Object with start and end times
    } = req.body;

    if (!securityId) {
      return res.status(400).json({ error: 'Security ID is required.' });
    }

    // Validate guard phone number
    if (guardPhone && !/^\+91\d{10}$/.test(guardPhone)) {
      return res
        .status(400)
        .json({ error: 'Guard phone number must start with +91 and be 13 characters long.' });
    }

    // Validate shift timings
    if (shiftTimings) {
      const { start, end } = shiftTimings;
      if (!start || !end) {
        return res.status(400).json({ error: 'Both start and end shift timings are required.' });
      }
      if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
        return res.status(400).json({ error: 'Shift timings must be in HH:mm format.' });
      }
    }

    // Find the security profile by ID and update the editable fields
    const updatedSecurity = await Security.findOneAndUpdate(
      { securityId }, // Find by securityId
      {
        ...(guardName && { guardName }), // Update only if value exists
        ...(guardPhone && { guardPhone }),
        ...(shiftTimings && { shiftTimings }), // Update shift timings if provided
      },
      { new: true } // Return the updated document
    );

    if (!updatedSecurity) {
      return res.status(404).json({ error: 'Security profile not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Security profile updated successfully!',
      data: updatedSecurity,
    });
  } catch (error) {
    console.error('Error updating security profile:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
