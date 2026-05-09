const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999); // Always 6 digits
  return otp.toString();
};


const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

const verifyOTP = async (otp, otpHash) => {
  return bcrypt.compare(otp, otpHash);
};

const getOTPExpiry = (minutes = 2) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = { generateOTP, hashOTP, verifyOTP, getOTPExpiry };
