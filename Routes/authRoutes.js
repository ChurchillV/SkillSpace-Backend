const { organizerLogin } = require('../Controllers/authController');

const router = require('express').Router();

router.post('/login/org/', organizerLogin);

module.exports = router;