import connectToDatabase from '../../../lib/mongodb'; // Import the DB connection helper
import Tenant from '../../../models/Tenant'; // Import your Tenant model

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

    // Assume you have token verification logic here
    // const user = verifyToken(token); // Replace with your token verification logic
    // if (!user) {
    //   return res.status(403).json({ error: 'Forbidden: Invalid token.' });
    // }

    const {
      tenantId, // Change from residentId to tenantId
      name,
      phone,
      email,
      address,
      unitNumber,
      additionalNumbers, // Array of additional phone numbers
    } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required.' });
    }

    // Validate additional phone numbers if provided
    if (additionalNumbers) {
      const isValidNumbers = additionalNumbers.every(
        (num) => /^\+91\d{10}$/.test(num)
      );
      if (!isValidNumbers) {
        return res
          .status(400)
          .json({ error: 'All additional phone numbers must start with +91 and be 13 characters long.' });
      }

      // Limit additional numbers to three
      if (additionalNumbers.length > 3) {
        return res
          .status(400)
          .json({ error: 'You can only add up to three additional phone numbers.' });
      }
    }

    // Find the tenant by ID and update their editable fields
    const updatedTenant = await Tenant.findOneAndUpdate(
      { tenantId }, // Find by tenantId
      {
        ...(name && { name }), // Only update if the value exists
        ...(phone && { phone: phone.startsWith('+91') ? phone : `+91${phone}` }), // Ensure proper phone format
        ...(email && { email }),
        ...(address && { address }),
        ...(unitNumber && { unitNumber }),
        ...(additionalNumbers && { additionalNumbers }), // Update additional numbers if provided
      },
      { new: true } // Return the updated document
    );

    if (!updatedTenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Tenant profile updated successfully!',
      data: updatedTenant,
    });
  } catch (error) {
    console.error('Error updating tenant profile:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
