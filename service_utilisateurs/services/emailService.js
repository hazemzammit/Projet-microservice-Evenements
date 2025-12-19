const nodemailer = require("nodemailer");

// Log email configuration (without exposing password)
console.log("Email Configuration:");
console.log("- Email User:", process.env.EMAIL_USER);
console.log("- Email Pass:", process.env.EMAIL_PASS ? "****" + process.env.EMAIL_PASS.slice(-4) : "NOT SET");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  },
  // Add these for better debugging
  debug: true, // Enable debug output
  logger: true // Log to console
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Email transporter verification failed:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

exports.sendEmail = async (to, subject, html) => {
  try {
    console.log("📧 Attempting to send email to:", to);
    console.log("📧 Subject:", subject);
    
    const info = await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email sending failed:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error command:", error.command);
    console.error("Full error:", error);
    throw error;
  }
};