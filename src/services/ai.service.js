/**
 * AI Service Facade
 *
 * Routes all AI calls to the active backend selected in config.ai.
 */
const config = require('../config');

const resolveService = () => (config.ai.providerKey === 'ollama'
  ? require('./ollama.service')
  : require('./gemini.service'));

const providerName = config.ai.providerName;
console.info(`🤖 AI provider: ${providerName}`);

module.exports = new Proxy({}, {
  get(_target, prop) {
    const service = resolveService();
    const value = service[prop];
    return typeof value === 'function' ? value.bind(service) : value;
  },
});
