const express = require('express');
const ModelsController = require('../controllers/models.controller');

const router = express.Router();

router.get('/', ModelsController.list);

module.exports = router;
