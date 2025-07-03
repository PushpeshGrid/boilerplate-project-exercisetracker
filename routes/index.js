
const express = require('express');
const router = express.Router();


const userRoutes = require('./user');
const exerciseRoutes = require('./exercise');

router.use('/users', userRoutes);       
router.use('/users', exerciseRoutes);   

module.exports = router;