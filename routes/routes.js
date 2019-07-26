const express = require('express');
const router = express.Router();

// Controllers
const users = require('../controllers/users');

/* -----MIKROTIK - MONGODB-----  */
router.get('/mikrotik/users/create', users.mikrotikCreateUsers);

/* -----USERS----- */
router.get('/users', users.getUsers);
router.get('/users/:username', users.getUser);

// Login
router.post('/session/login', users.login);

module.exports = router;