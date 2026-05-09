const express = require("express");
const router = express.Router();
const {
  sendOTP,
  verifyOTPHandler,
  getVerificationStatus,
} = require("../controllers/verificationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/send-otp", sendOTP);       
router.post("/verify-otp", verifyOTPHandler);
router.get("/status", getVerificationStatus);

module.exports = router;
