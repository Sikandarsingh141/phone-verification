const User = require("../models/User");
const { sendOTPSMS } = require("../services/smsService");
const {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiry,
} = require("../utils/generateOTP");

exports.sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    if (!e164Regex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number must be in E.164 format, e.g. +919876543210",
      });
    }

    const otp = generateOTP();           
    const otpHash = await hashOTP(otp);    
    const otpExpiresAt = getOTPExpiry(
      parseInt(process.env.OTP_EXPIRY_MINUTES) || 2
    );

    await User.findByIdAndUpdate(req.user._id, {
      phoneNumber,
      otpHash,
      otpExpiresAt,
      isPhoneVerified: false,
    });

    await sendOTPSMS(phoneNumber, otp);

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${phoneNumber}. It expires in 2 minutes.`,
    });
  } catch (error) {
    console.error("sendOTP error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.verifyOTPHandler = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required.",
      });
    }


    const user = await User.findById(req.user._id).select(
      "+otpHash +otpExpiresAt"
    );

    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "No pending verification. Please request a new OTP.",
      });
    }

    if (new Date() > user.otpExpiresAt) {
      await User.findByIdAndUpdate(user._id, {
        otpHash: null,
        otpExpiresAt: null,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    const isValid = await verifyOTP(otp, user.otpHash);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        isPhoneVerified: true,
        otpHash: null,
        otpExpiresAt: null,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Phone number verified successfully! 🎉",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        phoneNumber: updatedUser.phoneNumber,
        isPhoneVerified: updatedUser.isPhoneVerified,
      },
    });
  } catch (error) {
    console.error("verifyOTP error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVerificationStatus = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      phoneNumber: req.user.phoneNumber,
      isPhoneVerified: req.user.isPhoneVerified,
    },
  });
};
