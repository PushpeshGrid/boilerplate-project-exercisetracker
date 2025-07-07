const User = require("../models/User");

exports.createUser = async (req, res) => {
  const { username } = req.body;

  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "Username is required." });
  }
  const trimmedUsername = username.trim();

  try {
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${trimmedUsername}$`, "i") },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Username already exists." });
    }

    const newUser = new User({ username: trimmedUsername });
    const savedUser = await newUser.save();

    res.status(201).json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Server error. Could not create user." });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "username _id");
    res.json(users);
  } catch (err) {
    console.error("Error getting all users:", err);
    res.status(500).json({ error: "Server error. Could not retrieve users." });
  }
};
