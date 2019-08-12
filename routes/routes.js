const express = require('express')
const router = express.Router()

// Controllers
const users = require('../controllers/users')
const plans = require('../controllers/plans')

/* -----MIKROTIK - MONGODB-----  */
router.get('/mikrotik/users/create', users.mikrotikCreateUsers)

/* -----USERS----- */
router.get('/users', users.getUsers)
router.put('/users', users.updateUser)
router.post('/users', users.addUser)
router.get('/users/:username', users.getUser)
router.post('/users/disable', users.disableUser)
router.post('/users/enable', users.enableUser)
router.post('/users/delete', users.deleteUser)
router.post('/users/type/admin', users.typeAdminUser)
router.post('/users/type/default', users.typeDefaultUser)

// Login
router.post('/session/login', users.login)
router.post('/session/relogin', users.reLogin)

// Planes
router.get('/plans/profiles/names', plans.getProfilesNames)
router.get('/plans', plans.getPlans)
router.post('/plans', plans.createPlans)
router.put('/plans', plans.updatePlans)
router.delete('/plans/:id', plans.deletePlans)

module.exports = router