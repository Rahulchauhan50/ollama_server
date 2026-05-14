const { GoogleGenAI } = require('@google/genai');
const config = require('../config');
const { AppError } = require('../utils');

// Lazily initialised so unit tests that set config.isTest can skip real network calls
let _ai = null;
const getAi = () => {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  }
  return _ai;
};

/**
 * Parse a Gemini API error and throw the appropriate AppError.
 *
 * Gemini SDK surfaces errors as plain Error objects whose message contains
 * the raw JSON body.  We inspect the status code / message to produce clean,
 * client-friendly errors rather than leaking raw API details.
 *
 * @param {Error}  error   - The caught error
 * @param {string} context - Short label, e.g. "chat" or "generate"
 */
const handleGeminiError = (error, context) => {
  if (error.isCustom) throw error;

  const msg = error.message || '';

  // 429 – quota / rate limit
  if (
    error.status === 429 ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota')
  ) {
    // Try to extract the suggested retry-after seconds from the message
    const retryMatch = msg.match(/retry[^0-9]*([0-9]+(\.[0-9]+)?)s/i);
    const retryAfter = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;

    throw AppError.tooManyRequests(
      `Gemini API rate limit reached. Please retry in ${retryAfter} seconds.`,
      { retryAfterSeconds: retryAfter }
    );
  }

  // 401 / 403 – auth
  if (error.status === 401 || error.status === 403 || msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
    throw AppError.unauthorized('Gemini API key is invalid or missing permissions');
  }

  // 400 – bad request (e.g. safety block, invalid model)
  if (
    error.status === 400 ||
    error.status === 404 ||
    msg.includes('INVALID_ARGUMENT') ||
    msg.includes('NOT_FOUND') ||
    msg.includes('is not found for API version')
  ) {
    throw AppError.badRequest(`Gemini rejected the request: ${msg.slice(0, 200)}`);
  }

  // Generic fallback
  throw AppError.serviceUnavailable(`Gemini ${context} failed: ${msg.slice(0, 300)}`);
};

/**
 * Convert the Ollama-style [{role, content}] messages array to the
 * Gemini generateContent `contents` format:
 *   [{role: 'user'|'model', parts: [{text}]}]
 *
 * Notes:
 *  - Gemini uses "model" not "assistant" for the AI role.
 *  - System instructions are passed via `systemInstruction`, not in contents.
 */
const toGeminiContents = (messages) =>
  messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

const extractSystemPrompt = (messages) => {
  const sys = messages.find((m) => m.role === 'system');
  return sys ? sys.content : undefined;
};

const GeminiService = {
  /**
   * List models available — returns the configured allowed list so the
   * API surface stays compatible with the existing ModelsController.
   */
  async listModels() {
    // Gemini does not expose an anonymous /tags endpoint; we return the
    // statically-configured allowed list instead (same as Ollama test mode).
    return (config.gemini.allowedChatModels || []).map((name) => ({ name }));
  },

  /**
   * Send a chat request to Gemini and return the assistant text.
   * @param {string} model    - Gemini model id, e.g. "gemini-1.5-flash"
   * @param {Array}  messages - [{role, content}] including optional system msg
   * @param {Object} options  - { temperature, top_p, max_tokens }
   * @returns {Promise<string>} assistant reply text
   */
  async chat(model, messages, options = {}) {
    try {
      // Validate model is allowed
      const allowedModels = config.gemini.allowedChatModels || [];
      if (!allowedModels.includes(model)) {
        throw AppError.badRequest(`Model "${model}" not in allowed list`);
      }

      if (config.isTest) {
        return 'Test mode response from Gemini';
      }

      const ai = getAi();
      const systemPrompt = extractSystemPrompt(messages);
      const contents = toGeminiContents(messages);

      const generationConfig = {};
      if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
      if (options.top_p !== undefined) generationConfig.topP = options.top_p;
      if (options.max_tokens !== undefined) generationConfig.maxOutputTokens = options.max_tokens;

      const requestBody = { model, contents, config: generationConfig };
      if (systemPrompt) {
        requestBody.config = {
          ...generationConfig,
          systemInstruction: systemPrompt,
        };
      }

      const response = await ai.models.generateContent(requestBody);
      return response.text;
    } catch (error) {
      handleGeminiError(error, 'chat');
    }
  },

  /**
   * Generate a single-turn completion (used for title generation etc.)
   * @param {string} model
   * @param {string} prompt
   * @param {string} system  - optional system instruction
   * @param {Object} options - { max_tokens, temperature }
   * @returns {Promise<string>} generated text
   */
  async generate(model, prompt, system = '', options = {}) {
    try {
      const allowedModels = config.gemini.allowedChatModels || [];
      if (!allowedModels.includes(model)) {
        throw AppError.badRequest(`Model "${model}" not in allowed list`);
      }

      if (config.isTest) {
        return 'Test mode generated text from Gemini';
      }

      const ai = getAi();
      const generationConfig = {};
      if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
      if (options.max_tokens !== undefined) generationConfig.maxOutputTokens = options.max_tokens;

      const requestBody = {
        model,
        contents: prompt,
        config: generationConfig,
      };
      if (system) {
        requestBody.config = { ...generationConfig, systemInstruction: system };
      }

      const response = await ai.models.generateContent(requestBody);
      return response.text;
    } catch (error) {
      handleGeminiError(error, 'generate');
    }
  },

  /**
   * Create a text embedding using Gemini embedding models.
   * @param {Object|string} modelOrPayload - model id string OR { model, input }
   * @param {string}        maybeInput     - input text (when first arg is a string)
   * @returns {Promise<{embeddings: number[][]}>}
   */
  async createEmbedding(modelOrPayload, maybeInput) {
    try {
      const payload =
        typeof modelOrPayload === 'object' && modelOrPayload !== null
          ? modelOrPayload
          : { model: modelOrPayload, input: maybeInput };

      const { model, input } = payload;

      if (config.isTest) {
        // Return deterministic fake embedding in test mode
        const seed = Array.from(String(input))
          .map((c) => c.charCodeAt(0))
          .reduce((s, c) => s + c, 0);
        const values = Array.from({ length: 768 }, (_, i) => {
          const v = Math.sin(seed + i) * 10000;
          return v - Math.floor(v);
        });
        return { embeddings: [{ values }] };
      }

      const ai = getAi();

      // Gemini embedContent accepts a single string or array of strings
      const response = await ai.models.embedContent({
        model,
        contents: input,
      });

      return response;
    } catch (error) {
      handleGeminiError(error, 'embedding');
    }
  },

  /**
   * Health check — verifies the API key is functional by listing models.
   * @returns {Promise<{reachable: boolean, reason?: string}>}
   */
  async healthCheck() {
    try {
      if (config.isTest) {
        return { reachable: true };
      }
      const ai = getAi();
      // A lightweight call: embed a single character to verify connectivity
      await ai.models.embedContent({
        model: config.gemini.embeddingModel,
        contents: 'ping',
      });
      return { reachable: true };
    } catch (error) {
      return { reachable: false, reason: error.message };
    }
  },

  /**
   * Kept for API surface compatibility – Gemini has no running-models concept.
   */
  async listRunningModels() {
    return [];
  },
};

module.exports = GeminiService;
