const AIService = require('../services/ai.service');
const config = require('../config');
const { ApiResponse, asyncHandler } = require('../utils');

const ModelsController = {
  list: asyncHandler(async (req, res) => {
    const requestId = req.requestId;

    // Use whichever provider is currently active
    const providerConfig = config.ai.providerConfig;

    const all = await AIService.listModels();

    const normalize = (value) => String(value || '').trim().toLowerCase();
    const allowed = (providerConfig.allowedChatModels || [])
      .map((m) => normalize(m))
      .filter(Boolean);

    const isAllowedModel = (modelName) => {
      const normalized = normalize(modelName);
      if (!normalized) return false;
      return allowed.some((a) => {
        if (normalized === a) return true;
        if (normalized.startsWith(`${a}:`)) return true;
        const normalizedBase = normalized.split(':')[0];
        const allowedBase = a.split(':')[0];
        return normalizedBase === allowedBase;
      });
    };

    const filtered = allowed.length > 0
      ? all.filter((m) => isAllowedModel(m.name))
      : all;

    // Safety fallback: never return an empty model list when provider returned models.
    const source = filtered.length > 0 ? filtered : all;

    const models = source.map((m) => ({
      name: m.name,
      isDefault: normalize(m.name) === normalize(providerConfig.defaultChatModel),
    }));

    const response = ApiResponse.success({ models }, 'Model list', 200, requestId);
    res.status(response.statusCode).json(response.toJSON());
  }),
};

module.exports = ModelsController;
