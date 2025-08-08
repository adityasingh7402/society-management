import connectToDatabase from '../../../lib/mongodb';
import Security from '../../../models/Security';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Extract test data from request body
    const {
      securityId = 'TEST_SEC_001',
      guardName = 'Test Guard',
      guardPhone = '9876543210'
    } = req.body;

    console.log('Testing security update without auth...');
    console.log('Data received:', { securityId, guardName, guardPhone });

    // Try to find and update (or create for testing)
    const updateData = {
      guardName,
      guardPhone: guardPhone.startsWith('+91') ? guardPhone : `+91${guardPhone}`,
      updatedAt: new Date()
    };

    const updatedSecurity = await Security.findOneAndUpdate(
      { securityId },
      updateData,
      { 
        new: true,
        upsert: true, // Create if doesn't exist
        runValidators: true
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Test update successful (no auth required)',
      data: {
        securityId: updatedSecurity.securityId,
        guardName: updatedSecurity.guardName,
        guardPhone: updatedSecurity.guardPhone,
        updatedAt: updatedSecurity.updatedAt
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({ 
      error: 'Test failed', 
      details: error.message 
    });
  }
}
