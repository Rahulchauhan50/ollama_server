const tools = {
  summarize_text: {
    id: 'summarize_text',
    template: 'Summarize the following text in a concise paragraph:\n\n{{input}}',
  },
  rewrite_text: {
    id: 'rewrite_text',
    template: 'Rewrite the following text to be clearer and more concise:\n\n{{input}}',
  },
  extract_action_items: {
    id: 'extract_action_items',
    template: 'Extract action items from the following text as a numbered list. Only include actionable items:\n\n{{input}}',
  },
  draft_reply: {
    id: 'draft_reply',
    template: 'Draft a brief professional reply to the following message. Keep it under 80 words:\n\n{{input}}',
  },
  explain_code: {
    id: 'explain_code',
    template: 'Explain the following code snippet in simple terms, line by line:\n\n{{input}}',
  },
};

const escapeInput = (s) => String(s || '').replace(/\n/g, '\\n').replace(/\s+$/g, '');

const getTool = (id) => tools[id] || null;

const buildPromptForTool = (id, input) => {
  const tool = getTool(id);
  if (!tool) return null;
  const safe = escapeInput(input);
  return tool.template.replace('{{input}}', safe);
};

module.exports = {
  getTool,
  buildPromptForTool,
  listTools: () => Object.keys(tools),
};
