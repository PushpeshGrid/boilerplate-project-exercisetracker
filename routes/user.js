const express = require('express');
const router = express.Router(); // Create an Express Router instance
const userController = require('../controllers/userController'); // Import user controller

// Route to create a new user (POST /api/users)
router.post('/', userController.createUser);

// Route to get all users (GET /api/users)
router.get('/', userController.getAllUsers);

module.exports = router; // Export the router