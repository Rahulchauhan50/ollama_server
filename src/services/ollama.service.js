const axios = require('axios');
const config = require('../config');
const { AppError } = require('../utils');

const OllamaService = {
  async listModels() {
    try {
      // In test environment, return allowed models to avoid external calls
      if (config.isTest) {
        return (config.ollama.allowedChatModels || []).map((name) => ({ name }));
      }

      const base = config.ollama.apiUrl || config.ollama.baseUrl;
      const url = `${base.replace(/\/$/, '')}/api/tags`;

      const res = await axios.get(url, { timeout: 5000 });
      // Expect response data to have tags or models list
      const data = res.data;

      // Ollama /api/tags typically returns an array of tag strings or objects
      if (Array.isArray(data)) {
        return data.map((item) => {
          if (typeof item === 'string') return { name: item };
          if (item && item.name) return { name: item.name };
          return { name: String(item) };
        });
      }

      // Fallback if data has a 'tags' property
      if (data && Array.isArray(data.tags)) {
        return data.tags.map((t) => ({ name: typeof t === 'string' ? t : t.name }));
      }

      throw AppError.serviceUnavailable('Unexpected Ollama response for listModels');
    } catch (error) {
      if (error.isCustom) throw error;
      throw AppError.serviceUnavailable(`Failed to list models from Ollama: ${error.message}`);
    }
  },
};

module.exports = OllamaService;
