const express = require('express');
const router = express.Router();
const ToolsController = require('../controllers/tools.controller');

router.post('/:toolId/run', ToolsController.handleRunTool);

module.exports = router;
