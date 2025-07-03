const express = require('express');
const router = express.Router(); // Create an Express Router instance
const exerciseController = require('../controllers/exerciseController'); // Import exercise controller

// Route to add an exercise for a specific user (POST /api/users/:_id/exercises)
router.post('/:id/exercises', exerciseController.addExercise);

// Route to get the exercise log for a specific user (GET /api/users/:_id/logs)
router.get('/:id/logs', exerciseController.getExerciseLog);

module.exports = router; // Export the router