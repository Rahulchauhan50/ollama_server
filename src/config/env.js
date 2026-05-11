const { z } = require('zod');
require('dotenv').config();

// Zod schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),
  JWT_ACCESS_SECRET: z.string().min(8, 'JWT_ACCESS_SECRET must be at least 8 characters'),
  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 characters'),
  OLLAMA_BASE_URL: z.string().url('Invalid Ollama base URL'),
  OLLAMA_CHAT_MODEL_DEFAULT: z.string().default('llama2'),
  OLLAMA_EMBEDDING_MODEL: z.string().default('nomic-embed-text'),
  ALLOWED_CHAT_MODELS: z.string().default('llama2,neural-chat,mistral').transform(
    (val) => val.split(',').map((m) => m.trim())
  ),
  // Legacy/backward compatibility variables
  OLLAMA_API_URL: z.string().url().optional(),
  OLLAMA_USERNAME: z.string().optional(),
  OLLAMA_PASSWORD: z.string().optional(),
}).passthrough();

// Validate and export config
let config;
try {
  config = envSchema.parse(process.env);
  console.info('✅ Environment configuration validated');
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
  ollama: {
    baseUrl: config.OLLAMA_BASE_URL,
    defaultChatModel: config.OLLAMA_CHAT_MODEL_DEFAULT,
    embeddingModel: config.OLLAMA_EMBEDDING_MODEL,
    allowedChatModels: config.ALLOWED_CHAT_MODELS,
    // Backward compat
    apiUrl: config.OLLAMA_API_URL,
    username: config.OLLAMA_USERNAME,
    password: config.OLLAMA_PASSWORD,
  },
  isDevelopment: config.NODE_ENV === 'development',
  isProduction: config.NODE_ENV === 'production',
  isTest: config.NODE_ENV === 'test',
};
