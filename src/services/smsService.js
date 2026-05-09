const twilio = require("twilio");

let twilioClient = null;

const getTwilioClient = () => {
  if (!twilioClient) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
};

const sendOTPSMS = async (toPhoneNumber, otp) => {
  const messageBody = `Your verification code is: ${otp}. It expires in 2 minutes. Do not share it with anyone.`;
  if (process.env.MOCK_SMS === "true") {
    console.log(`[MOCK SMS] To: ${toPhoneNumber}`);
    console.log(`Message: ${messageBody}`);
    return;
  }

  try {
    const message = await getTwilioClient().messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhoneNumber,
    });

    console.log(`SMS sent. Twilio SID: ${message.sid}`);
  } catch (error) {
    console.error(`Twilio error: ${error.message}`);
    throw new Error("Failed to send verification SMS. Please try again.");
  }
};

module.exports = { sendOTPSMS };
