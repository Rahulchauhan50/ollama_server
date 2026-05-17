const { buildConversationTitleFromMessage } = require('../src/services/conversation-title.service');

describe('conversation title service', () => {
  it('builds a title from a net worth query using the user message only', () => {
    expect(buildConversationTitleFromMessage('Hello, that is the current net worth of elon musk')).toBe('Elon Musk Net Worth');
  });

  it('builds a title for a mythology story request from the user message only', () => {
    expect(buildConversationTitleFromMessage('tell me a mythalogical story form hindu literature')).toBe('Hindu Mythological Stories');
  });

  it('falls back to a short keyword title for generic prompts', () => {
    expect(buildConversationTitleFromMessage('Could you explain the basics of vector embeddings for chat search?')).toBe('Explain Basics Vector Embeddings');
  });
});
