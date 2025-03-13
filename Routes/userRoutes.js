const router = require('express').Router();
const { createUser, createOrganizer } = require('../Controllers/userController');
const {validateUser, validateOrganizer} = require('../Middleware/validators');

router.post('/create-account/user/', validateUser, createUser);
router.post('/create-account/org/', validateOrganizer, createOrganizer);

module.exports = router;