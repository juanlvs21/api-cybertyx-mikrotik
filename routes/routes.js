const express = require('express')
const router = express.Router()

// Controllers
const users = require('../controllers/users')
const plans = require('../controllers/plans')

/* -----MIKROTIK - MONGODB-----  */
router.get('/mikrotik/users/create', users.mikrotikCreateUsers)

/* -----USERS----- */
router.get('/users', users.getUsers)
router.get('/users/:username', users.getUser)

// Login
router.post('/session/login', users.login)
router.post('/session/relogin', users.reLogin)

// Planes
router.get('/plans', plans.getPlans)
router.post('/plans', plans.createPlans)
router.put('/plans', plans.updatePlans)
router.delete('/plans/:id', plans.deletePlans)

module.exports = router