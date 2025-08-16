const express = require('express');
const router = express.Router();

// Import each CRUD route file
const createUserRoute = require('./createUser');
const readUserRoute   = require('./readUser');
const updateUserRoute = require('./updateUser');
const deleteUserRoute = require('./deleteUser');
const authRoute       = require('./auth');

// Mount the routes at specific paths
router.use('/createuser', createUserRoute); // Registration
router.use('/readuser', readUserRoute);       // Reading users
router.use('/updateuser', updateUserRoute);     // Updating a user
router.use('/deleteuser', deleteUserRoute);     // Deleting a user
router.use('/auth', authRoute);                // Login (authentication)

module.exports = router;
