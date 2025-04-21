import axios from 'axios';

const FACTOR2_API_KEY = process.env.FACTOR2_API_KEY;
const FACTOR2_BASE_URL = 'https://2factor.in/API/V1';

export const sendOtp = async (phoneNumber) => {
  try {
    const response = await axios.get(`${FACTOR2_BASE_URL}/${FACTOR2_API_KEY}/SMS/${phoneNumber}/AUTOGEN`);
    
    if (response.data.Status === 'Success') {
      return { success: true, sessionId: response.data.Details };
    } else {
      throw new Error('Failed to send OTP');
    }
  } catch (error) {
    console.error('Factor2 OTP error:', error);
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

export const verifyOtp = async (otp, sessionId) => {
  try {
    const response = await axios.get(`${FACTOR2_BASE_URL}/${FACTOR2_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`);
    
    if (response.data.Status === 'Success') {
      return { success: true, message: 'OTP verified successfully' };
    } else {
      return { success: false, message: 'Invalid OTP' };
    }
  } catch (error) {
    console.error('Factor2 OTP verification error:', error);
    throw new Error(`Failed to verify OTP: ${error.message}`);
  }
};
