const { asyncHandler } = require('../utils');
const { ApiResponse, AppError } = require('../utils');
const OllamaService = require('../services/ollama.service');
const User = require('../models/User.model');
const Conversation = require('../models/Conversation.model');
const Message = require('../models/Message.model');

const getAdminStatus = asyncHandler(async (req, res) => {
  const response = new ApiResponse(
    200,
    'Admin API available',
    {
      status: 'admin_access_granted',
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
      },
    }
  );
  res.status(200).json(response);
});

const getOllamaTags = asyncHandler(async (req, res) => {
  try {
    const tags = await OllamaService.listModels();
    const response = new ApiResponse(200, 'Ollama tags', { tags });
    res.status(200).json(response);
  } catch (err) {
    throw AppError.serviceUnavailable(`Ollama tags unavailable: ${err.message}`);
  }
});

const getOllamaPs = asyncHandler(async (req, res) => {
  try {
    const running = await OllamaService.listRunningModels();
    const response = new ApiResponse(200, 'Ollama running models', { running });
    res.status(200).json(response);
  } catch (err) {
    throw AppError.serviceUnavailable(`Ollama ps unavailable: ${err.message}`);
  }
});

const getCounts = asyncHandler(async (req, res) => {
  // Support single-route counts by path
  const path = req.path || '';
  let users = null;
  let conversations = null;
  let messages = null;

  if (path.includes('/users')) {
    users = await User.countDocuments();
  } else if (path.includes('/conversations')) {
    conversations = await Conversation.countDocuments();
  } else if (path.includes('/messages')) {
    messages = await Message.countDocuments();
  } else {
    // full summary
    users = await User.countDocuments();
    conversations = await Conversation.countDocuments();
    messages = await Message.countDocuments();
  }

  const payload = { users, conversations, messages };
  const response = new ApiResponse(200, 'Counts', payload);
  res.status(200).json(response);
});

const getSystemLogs = asyncHandler(async (req, res) => {
  const LoggingService = require('../services/logging.service');
  const limit = Number(req.query.limit || 50);
  const logs = await LoggingService.recent(limit);
  const response = new ApiResponse(200, 'System logs', { logs });
  res.status(200).json(response);
});

const getUsageSummary = asyncHandler(async (req, res) => {
  const UsageService = require('../services/usage.service');
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const summary = await UsageService.summary(limit);
  const response = new ApiResponse(200, 'Usage summary', { summary });
  res.status(200).json(response);
});

module.exports = {
  getAdminStatus,
  getOllamaTags,
  getOllamaPs,
  getCounts,
};
