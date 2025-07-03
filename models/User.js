// models/User.js
const mongoose = require('mongoose');

// schema for an individual exercise entry
const exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true // Automatically trims whitespace from the beginning and end of the string
  },
  duration: {
    type: Number,
    required: true,
    min: 1 // Duration must be at least 1 minute
  },
  date: {
    type: Date,
    default: Date.now // If no date is provided, set to the current date and time
  }
}, { _id: false }); // We don't need separate _id for subdocuments unless explicitly required

// schema for a user
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensures usernames are unique in the database
    trim: true // Automatically trims whitespace
  },
  // The 'log' field is an array of exerciseSchema subdocuments.
  // This embeds the exercises directly within the user document.
  log: [exerciseSchema]
});

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User;