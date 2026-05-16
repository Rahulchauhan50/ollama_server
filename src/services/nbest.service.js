const AIService = require('./ai.service');

const parseJson = (text) => {
  try {
    const m = String(text).match(/\[\s*\{?[\s\S]*\}\s*\]|\[\s*"[\s\S]*"\s*\]/m);
    if (m) return JSON.parse(m[0]);
    return JSON.parse(text);
  } catch (err) {
    // Try to extract array of quoted strings
    const matches = String(text).match(/"([^"]+)"/g);
    if (matches) return matches.map((s) => s.replace(/^"|"$/g, ''));
    throw err;
  }
};

const generateNBest = async ({ model, prompt, system, n = 3, max_tokens, temperature }) => {
  // Prompt the model to return a JSON array of candidate answers
  const wrapper = `Produce ${n} distinct candidate answers to the user's query. Return only a JSON array of strings, no extra commentary.\n\nQuery:\n${prompt}`;
  const gen = await AIService.generate(model, wrapper, system || '', { max_tokens: max_tokens || 200, temperature });
  const text = typeof gen === 'string' ? gen : (gen?.response || gen?.content || gen?.choices?.[0]?.text || gen?.choices?.[0]?.message?.content || JSON.stringify(gen));
  const parsed = parseJson(String(text));
  // Normalize to array of strings
  if (Array.isArray(parsed)) {
    return parsed.map((p) => (typeof p === 'string' ? p : JSON.stringify(p)) ).slice(0, n);
  }
  throw new Error('Unexpected n-best format');
};

module.exports = { generateNBest };
