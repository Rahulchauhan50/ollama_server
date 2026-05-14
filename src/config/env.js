const { z } = require('zod');
const path = require('path');
require('dotenv').config({
  path: process.env.NODE_ENV === 'test'
    ? path.resolve(__dirname, '../../.env.test')
    : path.resolve(__dirname, '../../.env'),
});

const rawEnv = { ...process.env };
if (rawEnv.IS_COMMERCIAL_API === undefined) {
  const commercialApiAlias = rawEnv.iscommercailapi ?? rawEnv.iscommercialapi ?? rawEnv.isCommercialApi;
  if (commercialApiAlias !== undefined) {
    rawEnv.IS_COMMERCIAL_API = commercialApiAlias;
  }
}

const parseOptionalModelList = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  return value
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
};

// Zod schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),
  JWT_ACCESS_SECRET: z.string().min(8, 'JWT_ACCESS_SECRET must be at least 8 characters'),
  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 characters'),

  // ── AI provider switch ─────────────────────────────────────────────────────
  // IS_COMMERCIAL_API=true  → Gemini API (commercial/cloud)
  // IS_COMMERCIAL_API=false → Ollama (self-hosted)
  IS_COMMERCIAL_API: z.string().default('false').transform((v) => v.toLowerCase() === 'true'),

  // Shared allowed models list (used by whichever backend is active)
  ALLOWED_CHAT_MODELS: z.string()
    .default('gemini-1.5-flash,gemini-1.5-pro,gemini-2.0-flash')
    .transform((val) => val.split(',').map((m) => m.trim())),

  // Provider-specific allow-lists (optional; fallback to ALLOWED_CHAT_MODELS)
  GEMINI_ALLOWED_CHAT_MODELS: z.string().optional(),
  OLLAMA_ALLOWED_CHAT_MODELS: z.string().optional(),

  // ── Gemini API (used when IS_COMMERCIAL_API=true) ──────────────────────────
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_CHAT_MODEL_DEFAULT: z.string().default('gemini-1.5-flash'),
  GEMINI_EMBEDDING_MODEL: z.string().default('gemini-embedding-001'),

  // ── Ollama / self-hosted (used when IS_COMMERCIAL_API=false) ───────────────
  OLLAMA_BASE_URL: z.string().optional().default('http://localhost:11434'),
  OLLAMA_CHAT_MODEL_DEFAULT: z.string().optional().default('llama2'),
  OLLAMA_EMBEDDING_MODEL: z.string().optional().default('nomic-embed-text'),
  OLLAMA_API_TIMEOUT_MS: z.coerce.number().int().positive().default(6000000),
  OLLAMA_USERNAME: z.string().optional(),
  OLLAMA_PASSWORD: z.string().optional(),
}).passthrough();

// Validate and export config
let config;
try {
  config = envSchema.parse(rawEnv);
  const provider = config.IS_COMMERCIAL_API ? 'Gemini API' : 'Ollama (self-hosted)';
  console.info(`✅ Environment configuration validated — AI provider: ${provider}`);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('\n');
    console.error('❌ Environment configuration invalid:\n', missingVars);
    process.exit(1);
  }
  throw error;
}

const geminiConfig = {
  apiKey: config.GEMINI_API_KEY,
  defaultChatModel: config.GEMINI_CHAT_MODEL_DEFAULT,
  embeddingModel: config.GEMINI_EMBEDDING_MODEL,
  allowedChatModels:
    parseOptionalModelList(config.GEMINI_ALLOWED_CHAT_MODELS) || config.ALLOWED_CHAT_MODELS,
};

const ollamaConfig = {
  baseUrl: config.OLLAMA_BASE_URL,
  defaultChatModel: config.OLLAMA_CHAT_MODEL_DEFAULT,
  embeddingModel: config.OLLAMA_EMBEDDING_MODEL,
  allowedChatModels:
    parseOptionalModelList(config.OLLAMA_ALLOWED_CHAT_MODELS) || config.ALLOWED_CHAT_MODELS,
  timeoutMs: config.OLLAMA_API_TIMEOUT_MS,
  username: config.OLLAMA_USERNAME,
  password: config.OLLAMA_PASSWORD,
};

const activeProviderKey = config.IS_COMMERCIAL_API ? 'gemini' : 'ollama';
const activeProviderConfig = activeProviderKey === 'ollama' ? ollamaConfig : geminiConfig;

module.exports = {
  nodeEnv: config.NODE_ENV,
  port: config.PORT,
  mongoUri: config.MONGODB_URI,
  jwt: {
    accessSecret: config.JWT_ACCESS_SECRET,
    refreshSecret: config.JWT_REFRESH_SECRET,
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },

  // Raw env toggle retained for compatibility with existing configs.
  isCommercialApi: config.IS_COMMERCIAL_API,

  // Active AI backend used by controllers and facades.
  ai: {
    providerKey: activeProviderKey,
    providerName: activeProviderKey === 'ollama' ? 'Ollama' : 'Gemini',
    providerConfig: activeProviderConfig,
    defaultChatModel: activeProviderConfig.defaultChatModel,
    allowedChatModels: activeProviderConfig.allowedChatModels,
    embeddingModel: activeProviderConfig.embeddingModel,
  },

  // Gemini config block
  gemini: geminiConfig,

  // Ollama config block
  ollama: ollamaConfig,

  isDevelopment: config.NODE_ENV === 'development',
  isProduction: config.NODE_ENV === 'production',
  isTest: config.NODE_ENV === 'test',
};
