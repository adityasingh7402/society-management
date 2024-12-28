import twilio from 'twilio';

const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendOtp = async (phoneNumber) => {
  try {
    // Send OTP via SMS using the Twilio Verify service
    const verification = await client.verify.services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    return { success: true, verificationId: verification.sid };
  } catch (error) {
    console.error('Twilio OTP error:', error);
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

export const verifyOtp = async (otp, phoneNumber) => {
  try {
    // Verify OTP using the phone number and code received from the user
    const verificationCheck = await client.verify.services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({ to: phoneNumber, code: otp });

    if (verificationCheck.status === 'approved') {
      return { success: true, message: 'OTP verified successfully' };
    } else {
      return { success: false, message: 'Invalid OTP' };
    }
  } catch (error) {
    console.error('Twilio OTP verification error:', error);
    throw new Error(`Failed to verify OTP: ${error.message}`);
  }
};
