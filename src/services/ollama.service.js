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

      const base = config.ollama.baseUrl;
      const url = `${base.replace(/\/$/, '')}/api/tags`;

      // Build axios config with optional basic auth
      const axiosConfig = { timeout: config.ollama.timeoutMs };
      if (config.ollama.username && config.ollama.password) {
        axiosConfig.auth = {
          username: config.ollama.username,
          password: config.ollama.password,
        };
      }

      const res = await axios.get(url, axiosConfig);
      // Expect response data to have tags or models list
      const data = res.data;

      // Ollama /api/tags typically returns an array of tag strings or objects
      if (Array.isArray(data)) {
        return data.map((item) => {
          if (typeof item === 'string') {
            return { name: item };
          }
          if (item && item.name) {
            return { name: item.name };
          }
          return { name: String(item) };
        });
      }

      // Handle response with 'models' property (newer Ollama versions)
      if (data && Array.isArray(data.models)) {
        return data.models.map((m) => ({ name: typeof m === 'string' ? m : m.name }));
      }

      // Fallback if data has a 'tags' property
      if (data && Array.isArray(data.tags)) {
        return data.tags.map((t) => ({ name: typeof t === 'string' ? t : t.name }));
      }

      throw AppError.serviceUnavailable('Unexpected Ollama response for listModels');
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.serviceUnavailable(`Failed to list models from Ollama: ${error.message}`);
    }
  },

  async chat(model, messages, options = {}) {
    try {
      if (config.isTest) {
        return {
          message: {
            role: 'assistant',
            content: 'Test mode response from Ollama',
          },
        };
      }

      // Validate model is allowed
      const allowedModels = config.ollama.allowedChatModels || [];
      if (!allowedModels.includes(model)) {
        throw AppError.badRequest(`Model "${model}" not in allowed list`);
      }

      const base = config.ollama.baseUrl;
      const url = `${base.replace(/\/$/, '')}/api/chat`;

      // Build axios config with optional basic auth
      const axiosConfig = { timeout: config.ollama.timeoutMs };
      if (config.ollama.username && config.ollama.password) {
        axiosConfig.auth = {
          username: config.ollama.username,
          password: config.ollama.password,
        };
      }

      const payload = {
        model,
        messages,
        stream: false,
        ...options,
      };

      const res = await axios.post(url, payload, axiosConfig);
      return res.data;
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.serviceUnavailable(`Failed to chat with Ollama: ${error.message}`);
    }
  },

  async generate(model, prompt, system = '', options = {}) {
    try {
      if (config.isTest) {
        return {
          message: {
            content: 'Test mode generated text from Ollama',
          },
        };
      }

      // Validate model is allowed
      const allowedModels = config.ollama.allowedChatModels || [];
      if (!allowedModels.includes(model)) {
        throw AppError.badRequest(`Model "${model}" not in allowed list`);
      }

      const base = config.ollama.baseUrl;
      const url = `${base.replace(/\/$/, '')}/api/generate`;

      // Build axios config with optional basic auth
      const axiosConfig = { timeout: config.ollama.timeoutMs };
      if (config.ollama.username && config.ollama.password) {
        axiosConfig.auth = {
          username: config.ollama.username,
          password: config.ollama.password,
        };
      }

      const payload = {
        model,
        prompt,
        system: system || undefined,
        stream: false,
        ...options,
      };

      const res = await axios.post(url, payload, axiosConfig);
      return res.data;
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.serviceUnavailable(`Failed to generate with Ollama: ${error.message}`);
    }
  },

  async createEmbedding(modelOrPayload, maybeInput) {
    try {
      if (config.isTest) {
        const payloadInput = typeof modelOrPayload === 'object' && modelOrPayload !== null
          ? modelOrPayload
          : { model: modelOrPayload, input: maybeInput };

        const seed = Array.from(String(payloadInput.input || ''))
          .map((char) => char.charCodeAt(0))
          .reduce((sum, code) => sum + code, 0);

        const embedding = Array.from({ length: 768 }, (_, index) => {
          const value = Math.sin(seed + index) * 10000;
          return value - Math.floor(value);
        });

        return { embedding };
      }

      const payloadInput = typeof modelOrPayload === 'object' && modelOrPayload !== null
        ? modelOrPayload
        : { model: modelOrPayload, input: maybeInput };

      const { model, input } = payloadInput;

      const base = config.ollama.baseUrl;
      const url = `${base.replace(/\/$/, '')}/api/embed`;

      // Build axios config with optional basic auth
      const axiosConfig = { timeout: config.ollama.timeoutMs };
      if (config.ollama.username && config.ollama.password) {
        axiosConfig.auth = {
          username: config.ollama.username,
          password: config.ollama.password,
        };
      }

      const payload = {
        model,
        input,
      };
      const res = await axios.post(url, payload, axiosConfig);
      return res.data;
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.serviceUnavailable(`Failed to create embedding with Ollama: ${error}`);
    }
  },

  async listRunningModels() {
    try {
      if (config.isTest) {
        return [];
      }

      const base = config.ollama.baseUrl;
      const url = `${base.replace(/\/$/, '')}/api/ps`;

      // Build axios config with optional basic auth
      const axiosConfig = { timeout: config.ollama.timeoutMs };
      if (config.ollama.username && config.ollama.password) {
        axiosConfig.auth = {
          username: config.ollama.username,
          password: config.ollama.password,
        };
      }

      const res = await axios.get(url, axiosConfig);
      const data = res.data;

      // Handle response with 'models' property
      if (data && Array.isArray(data.models)) {
        return data.models;
      }

      // Return empty array if no models running
      return [];
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.serviceUnavailable(`Failed to list running models from Ollama: ${error.message}`);
    }
  },

  async healthCheck() {
    try {
      if (config.isTest) {
        return { reachable: true };
      }

      const base = config.ollama.baseUrl;
      const url = `${base.replace(/\/$/, '')}/api/tags`;

      // Build axios config with optional basic auth
      const axiosConfig = { timeout: config.ollama.timeoutMs };
      if (config.ollama.username && config.ollama.password) {
        axiosConfig.auth = {
          username: config.ollama.username,
          password: config.ollama.password,
        };
      }

      await axios.get(url, axiosConfig);
      return { reachable: true };
    } catch (error) {
      return { reachable: false, reason: error.message };
    }
  },
};

module.exports = OllamaService;
