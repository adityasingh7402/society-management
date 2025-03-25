import connectToDatabase from '../../../lib/mongodb';
import Security from '../../../models/Security';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Extract all fields from the request body
    const {
      securityId,
      guardName,
      guardPhone,
      additionalNumbers = [],
      societyId,
      societyName,
      shiftTimings = { start: '', end: '' },
      address = {
        societyName: '',
        street: '',
        city: '',
        state: '',
        pinCode: ''
      },
      societyVerification
    } = req.body;

    // Validate required fields
    if (!securityId) {
      return res.status(400).json({ error: 'Security ID is required.' });
    }

    if (!guardName || !guardPhone) {
      return res.status(400).json({ error: 'Guard name and phone are required.' });
    }

    // Function to normalize phone numbers
    const normalizePhoneNumber = (phone) => {
      if (!phone) return phone;
      
      // Remove all non-digit characters
      const digitsOnly = phone.replace(/\D/g, '');
      
      // If it starts with 91 and has 10 digits after (total 12), add +
      if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        return `+${digitsOnly}`;
      }
      // If it has 10 digits and doesn't start with +, add +91
      else if (digitsOnly.length === 10 && !phone.startsWith('+')) {
        return `+91${digitsOnly}`;
      }
      // If it already has +91 or other country code, return as is
      else if (phone.startsWith('+')) {
        return phone;
      }
      // Otherwise return with +91 prefix
      return `+91${digitsOnly}`;
    };

    // Normalize primary phone number
    const normalizedGuardPhone = normalizePhoneNumber(guardPhone);

    // Normalize additional numbers (filter out empty ones and normalize)
    const normalizedAdditionalNumbers = additionalNumbers
      .filter(num => num && num.trim() !== '')
      .map(normalizePhoneNumber);

    // Validate phone numbers format after normalization
    const phoneRegex = /^\+[1-9]\d{10,14}$/; // Updated regex for international numbers
    if (!phoneRegex.test(normalizedGuardPhone)) {
      return res.status(400).json({ 
        error: 'Invalid primary phone number format after normalization.',
        normalizedNumber: normalizedGuardPhone
      });
    }

    for (const number of normalizedAdditionalNumbers) {
      if (!phoneRegex.test(number)) {
        return res.status(400).json({ 
          error: `Invalid additional phone number format: ${number}`,
          normalizedNumber: number
        });
      }
    }

    // Validate shift timings
    if (shiftTimings && (!shiftTimings.start || !shiftTimings.end)) {
      return res.status(400).json({ error: 'Both shift start and end times are required.' });
    }

    // Validate address
    if (address) {
      const requiredAddressFields = ['societyName', 'street', 'city', 'state', 'pinCode'];
      const missingFields = requiredAddressFields.filter(field => !address[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: `Missing required address fields: ${missingFields.join(', ')}` 
        });
      }
    }

    // Validate societyVerification if provided
    if (societyVerification) {
      const validStatuses = ['Approved', 'Reject', 'Pending'];
      if (!validStatuses.includes(societyVerification)) {
        return res.status(400).json({ 
          error: 'Invalid verification status.',
          validStatuses: validStatuses
        });
      }
    }

    // Prepare update object with normalized phone numbers
    const updateData = {
      guardName,
      guardPhone: normalizedGuardPhone,
      additionalNumbers: normalizedAdditionalNumbers,
      societyId,
      societyName,
      shiftTimings,
      address,
      ...(societyVerification && { societyVerification }),
      updatedAt: new Date()
    };

    // Find and update the security profile
    const updatedSecurity = await Security.findOneAndUpdate(
      { securityId },
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updatedSecurity) {
      return res.status(404).json({ error: 'Security profile not found.' });
    }

    // Return success response with updated data
    return res.status(200).json({
      success: true,
      message: 'Security profile updated successfully',
      data: {
        securityId: updatedSecurity.securityId,
        guardName: updatedSecurity.guardName,
        guardPhone: updatedSecurity.guardPhone,
        additionalNumbers: updatedSecurity.additionalNumbers,
        shiftTimings: updatedSecurity.shiftTimings,
        address: updatedSecurity.address,
        societyVerification: updatedSecurity.societyVerification,
        updatedAt: updatedSecurity.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating security profile:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: Object.values(error.errors).map(err => err.message) 
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate key error',
        details: 'A security guard with this phone number already exists'
      });
    }

    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
}