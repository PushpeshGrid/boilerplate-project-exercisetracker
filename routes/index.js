
const express = require('express');
const router = express.Router();

// Import specific route modules
const userRoutes = require('./user');
const exerciseRoutes = require('./exercise');

// Mount the specific routes under their respective base paths
router.use('/users', userRoutes);       // All routes defined in userRoutes will be prefixed with /api/users
router.use('/users', exerciseRoutes);   // All routes defined in exerciseRoutes will also be prefixed with /api/users
                                        // (e.g., /api/users/:id/exercises, /api/users/:id/logs)

module.exports = router;