const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');

router.get('/status', appController.getAppStatus);

module.exports = router;
