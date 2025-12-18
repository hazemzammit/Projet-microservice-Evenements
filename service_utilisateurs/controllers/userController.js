const User = require("../models/User");
const bcrypt = require("bcrypt");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const body = req.validatedBody || req.body;
    const { firstName, lastName, email, password, role } = body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "Email already used" });

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
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    res.status(200).json({ success: true, message: "Utilisateur supprimé" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
