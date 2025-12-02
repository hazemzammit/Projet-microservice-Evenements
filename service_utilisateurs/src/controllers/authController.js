const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const VERIFICATION_TOKEN_EXPIRES = process.env.VERIFICATION_TOKEN_EXPIRES || "7d";
const BASE_USER_SERVICE_URL =
  process.env.APP_URL || process.env.USER_SERVICE_URL || "http://localhost:4000";

const buildVerificationUrl = (token) => `${BASE_USER_SERVICE_URL}/users/verify?token=${token}`;

const generateVerificationToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: VERIFICATION_TOKEN_EXPIRES });

const sendVerificationEmail = async (user) => {
  const token = generateVerificationToken(user._id);
  const verifyUrl = buildVerificationUrl(token);
  await sendEmail(
    user.email,
    "Verify your account",
    `<p>Please verify your account by clicking <a href="${verifyUrl}">here</a></p>`
  );
  return { token, verifyUrl };
};

const trySendVerificationEmail = async (user) => {
  try {
    return await sendVerificationEmail(user);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return { error: err };
  }
};

exports.register = async (req, res) => {
  try {
    const body = req.validatedBody || req.body;
    const { firstName, lastName, email, password, role } = body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: "Email already used" });

    const hashed = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`;
    const user = new User({
      firstName,
      lastName,
      name: fullName,
      email,
      password: hashed,
      role: role || "user"
    });
    await user.save();

    const verification = await trySendVerificationEmail(user);

    res.status(201).json({
      success: true,
      message: verification.error
        ? "User registered. Verification email failed to send."
        : "User registered. Check email to verify.",
      verifyUrl: verification.verifyUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verify = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.status(400).json({ success: false, message: "Missing token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    user.isVerified = true;
    await user.save();

    res.status(200).json({ success: true, message: "Account verified" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid or expired token" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.validatedBody || req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    if (!user.isVerified) {
      const verification = await trySendVerificationEmail(user);
      return res.status(403).json({
        success: false,
        message: verification.error
          ? "Account not verified. Unable to send verification email."
          : "Account not verified. A new verification link has been sent.",
        verifyUrl: verification.verifyUrl
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.requestReset = async (req, res) => {
  try {
    const { email } = req.validatedBody || req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "15m" });
    const baseUrl =
      process.env.FRONTEND_URL ||
      process.env.APP_URL ||
      process.env.USER_SERVICE_URL ||
      "http://localhost:4000";

    const resetLink = `${baseUrl}/users/reset-password/confirm?token=${token}`;

    let emailError;
    try {
      await sendEmail(
        user.email,
        "Reset Password",
        `<h2>Reset Password</h2>
         <p>Click below to reset your password:</p>
         <a href="${resetLink}">Reset password</a>`
      );
    } catch (err) {
      emailError = err;
      console.error("Failed to send reset email:", err);
    }

    res.json({
      success: true,
      message: emailError
        ? "Reset link generated but email failed to send."
        : "Reset link sent to your email",
      resetLink,
      token
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.confirmReset = async (req, res) => {
  try {
    const token = req.query.token || (req.validatedBody && req.validatedBody.token) || req.body.token;
    const newPassword = (req.validatedBody && req.validatedBody.newPassword) || req.body.newPassword || req.body.password;

    if (!token || !newPassword)
      return res.status(400).json({ success: false, message: "Missing token or newPassword" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: "Password has been reset" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid or expired token" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { oldPassword, newPassword } = req.validatedBody || req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!oldPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match)
      return res.status(400).json({ success: false, message: "Old password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: "Password changed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
