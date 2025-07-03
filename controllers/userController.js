const User = require("../models/User"); // Import the User model

// Function to create a new user
exports.createUser = async (req, res) => {
  const { username } = req.body;

  // Input validation and trimming
  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "Username is required." });
  }
  const trimmedUsername = username.trim();

  try {
    // Check if username already exists (case-insensitive search)
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${trimmedUsername}$`, "i") },
    });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists." });
    }

    // Create a new user instance
    const newUser = new User({ username: trimmedUsername });
    // Save the new user to the database
    const savedUser = await newUser.save();

    // Respond with the required format
    res.status(201).json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    // Handle Mongoose validation errors (e.g., if schema requirements are not met)
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    // Handle other potential database errors
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Server error. Could not create user." });
  }
};

// Function to get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Find all users and select only the username and _id fields
    const users = await User.find({}, "username _id");
    // Respond with the array of users
    res.json(users);
  } catch (err) {
    console.error("Error getting all users:", err);
    res.status(500).json({ error: "Server error. Could not retrieve users." });
  }
};
