const { asyncHandler, ApiResponse, AppError } = require('../utils');
const AIService = require('../services/ai.service');
const ToolRegistry = require('../utils/toolRegistry');
const config = require('../config');

const handleRunTool = async (req, res) => {
  const { toolId } = req.params;
  const { input, model } = req.body || {};

  const tool = ToolRegistry.getTool(toolId);
  if (!tool) {
    throw AppError.notFound('Tool not found');
  }

  if (!input || String(input).trim().length === 0) {
    throw AppError.validation('Input is required');
  }

  // Ignore any system prompt from client — do not allow overriding hidden prompt engineering
  const prompt = ToolRegistry.buildPromptForTool(toolId, input);

  const usedModel = model || (config.ai && config.ai.defaultChatModel) || undefined;

  const gen = await AIService.generate(usedModel, prompt, '', { max_tokens: 512 });
  const text = typeof gen === 'string' ? gen : (gen?.response || gen?.content || gen?.choices?.[0]?.text || gen?.choices?.[0]?.message?.content || JSON.stringify(gen));

  const response = ApiResponse.success({ result: text }, 'Tool executed', 200, req.requestId);
  res.status(response.statusCode).json(response.toJSON());
};

module.exports = {
  handleRunTool: asyncHandler(handleRunTool),
};
