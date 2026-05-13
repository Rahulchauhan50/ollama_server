const OllamaService = require('../services/ollama.service');
const config = require('../config');
const { ApiResponse, asyncHandler } = require('../utils');

const ModelsController = {
  list: asyncHandler(async (req, res) => {
    const requestId = req.requestId;

    const all = await OllamaService.listModels();

    const allowed = (config.ollama.allowedChatModels || []).map((m) => m.toString());

    const filtered = all.filter((m) => allowed.includes(m.model));

    const models = filtered.map((m) => ({
      name: m.model,
      isDefault: m.model === config.ollama.defaultChatModel,
    }));

    const response = ApiResponse.success({ models }, 'Model list', 200, requestId);
    res.status(response.statusCode).json(response.toJSON());
  }),
};

module.exports = ModelsController;
