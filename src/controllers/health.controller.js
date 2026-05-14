const { asyncHandler } = require('../utils');
const { ApiResponse } = require('../utils');
const AIService = require('../services/ai.service');
const config = require('../config');
const { AppError } = require('../utils');

const checkAiHealth = asyncHandler(async (req, res) => {
  const health = await AIService.healthCheck();
  const providerName = config.ai.providerName;

  if (!health.reachable) {
    throw AppError.serviceUnavailable(`${providerName} API is not reachable`, {
      reason: health.reason,
    });
  }

  const response = new ApiResponse(
    200,
    'AI server health check completed',
    {
      provider: providerName,
      reachable: true,
      status: 'healthy',
      model: config.ai.defaultChatModel,
    }
  );
  res.status(200).json(response);
});

module.exports = {
  checkAiHealth,
};
