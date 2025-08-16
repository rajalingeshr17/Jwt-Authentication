const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require("nodemailer");
require("dotenv").config();

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET; 


const otpStore = {};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 465, // or 587
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendOtp = async (email, otp) => {
  const mailOptions = {
    from: `"Your App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP sent successfully");
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

// POST /auth/login — Step 1: Email/Password check & send OTP
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password)
      return res.status(400).json({ message: "Please provide email and password" });

    // Find user by email
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    // Compare provided password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(otp)

    // Store OTP in memory (with expiry of 5 mins)
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    // Send OTP via email
    await sendOtp(email, otp);

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// POST /auth/verify-otp — Step 2: OTP verification
// POST /auth/verify-otp — Step 2: OTP verification
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  // Check if OTP exists for the email
  const record = otpStore[email];

  // Debugging: Log the OTP store for the given email
  console.log(`OTP Store for ${email}:`, record);

  if (!record)
    return res.status(400).json({ message: "No OTP requested for this email" });

  // Check if OTP has expired
  if (Date.now() > record.expires) {
    delete otpStore[email]; // Clear expired OTP
    return res.status(400).json({ message: "OTP expired" });
  }

  // Debugging: Log the OTPs to compare
  console.log(`User entered OTP: ${otp}, Stored OTP: ${record.otp}`);

  // Validate OTP
  if (otp !== record.otp) {
    // Debugging: Log the mismatch
    console.log(`OTP Mismatch for ${email}`);
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // Clear OTP from store after successful validation
  delete otpStore[email];

  // Issue JWT and send it
  const user = await User.findOne({ email });
  const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1h" });

  res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

module.exports = router;
