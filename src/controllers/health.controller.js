const { asyncHandler } = require('../utils');
const { ApiResponse } = require('../utils');
const OllamaService = require('../services/ollama.service');
const config = require('../config');
const { AppError } = require('../utils');

const checkAiHealth = asyncHandler(async (req, res) => {
  const health = await OllamaService.healthCheck();

  if (!health.reachable) {
    throw AppError.serviceUnavailable('Ollama server is not reachable', {
      baseUrl: config.ollama.baseUrl,
      reason: health.reason,
    });
  }

  const response = new ApiResponse(
    200,
    'AI server health check completed',
    {
      ollama: 'reachable',
      status: 'healthy',
      baseUrl: config.ollama.baseUrl,
    }
  );
  res.status(200).json(response);
});

module.exports = {
  checkAiHealth,
};
