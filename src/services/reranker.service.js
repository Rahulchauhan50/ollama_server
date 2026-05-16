const AIService = require('./ai.service');
const config = require('../config');

const buildPrompt = ({ queryText, candidateAnswers, memories }) => {
  const memoryBlock = (memories || []).map((m, i) => `${i + 1}. ${m.content} (score: ${Number(m.score || 0).toFixed(4)})`).join('\n');

  let prompt = `You are an evaluator. Given the user query and a list of candidate answers, score each candidate from 0.0 to 1.0 for correctness and relevance. Return a JSON array of objects with keys: index (candidate index), score (0.0-1.0), reason (short explanation), and optionally rewrite (a brief improved answer).`;
  prompt += `\n\nUser query:\n${queryText}\n\n`;
  if (memoryBlock && memoryBlock.length > 0) {
    prompt += `Relevant memories:\n${memoryBlock}\n\n`;
  }

  prompt += `Candidates:\n`;
  candidateAnswers.forEach((c, idx) => {
    prompt += `${idx + 1}) ${c}\n`;
  });

  prompt += `\nReturn only valid JSON. Example output:\n[{"index":0,"score":0.95,"reason":"Matches memory","rewrite":"..."}]`;
  return prompt;
};

const parseJsonArray = (text) => {
  // Try to extract the first JSON array in the text
  const m = text.match(/\[\s*\{[\s\S]*\}\s*\]/m);
  if (m) {
    return JSON.parse(m[0]);
  }
  return JSON.parse(text);
};

const rerankAnswers = async ({ userId, queryText, candidateAnswers = [], memories = [], model, max_tokens }) => {
  if (!Array.isArray(candidateAnswers) || candidateAnswers.length === 0) return [];

  const usedModel = model || (config.ai && config.ai.providerConfig && config.ai.providerConfig.defaultChatModel) || undefined;
  const prompt = buildPrompt({ queryText, candidateAnswers, memories });

  const gen = await AIService.generate(usedModel, prompt, '', { max_tokens: max_tokens || 200 });
  const text = typeof gen === 'string' ? gen : (gen?.response || gen?.content || gen?.choices?.[0]?.text || gen?.choices?.[0]?.message?.content || JSON.stringify(gen));

  try {
    const parsed = parseJsonArray(String(text));
    // Normalize and map to candidate answers
    const scored = parsed.map((p) => ({
      index: p.index,
      score: Number(p.score) || 0,
      reason: p.reason || '',
      rewrite: p.rewrite || null,
      answer: candidateAnswers[p.index],
    }));
    return scored.sort((a, b) => b.score - a.score);
  } catch (err) {
    console.error('Reranker: failed to parse AI response', err);
    // Fallback: return candidates with equal scores
    return candidateAnswers.map((c, i) => ({ index: i, score: 1 / candidateAnswers.length, reason: 'fallback', rewrite: null, answer: c }));
  }
};

module.exports = {
  rerankAnswers,
};
