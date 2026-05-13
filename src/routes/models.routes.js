const express = require('express');
const ModelsController = require('../controllers/models.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, ModelsController.list);

module.exports = router;
