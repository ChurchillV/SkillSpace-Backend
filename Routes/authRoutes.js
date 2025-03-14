const { organizerLogin, userLogin } = require('../Controllers/authController');

const router = require('express').Router();

router.post('/login/org/', organizerLogin);
router.post('/login/user/', userLogin);

module.exports = router;