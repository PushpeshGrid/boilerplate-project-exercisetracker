
const express = require('express');
const router = express.Router(); 

const userController = require('../controllers/userController');
const exerciseController = require('../controllers/exerciseController');


router.post('/users', userController.createUser);
router.get('/users', userController.getAllUsers);

router.post('/users/:id/exercises', exerciseController.addExercise);
router.get('/users/:id/logs', exerciseController.getExerciseLog);

module.exports = router; 