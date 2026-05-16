jest.mock('../src/services/memory.service', () => ({
  retrieveRelevantMemories: jest.fn(),
}));

const MemoryService = require('../src/services/memory.service');
const RAGService = require('../src/services/rag.service');

describe('Phase 29: RAG Prompt Builder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('injects memories into system message when available', async () => {
    MemoryService.retrieveRelevantMemories.mockResolvedValue([
      { messageId: 'm1', content: 'User likes pizza.', role: 'user', score: 0.8123 },
    ]);

    const msgs = await RAGService.buildChatMessages({
      userId: 'user123',
      queryText: 'What do I like?',
      recentMessages: [{ role: 'user', content: 'Hello' }],
      memoryLimit: 3,
    });

    expect(MemoryService.retrieveRelevantMemories).toHaveBeenCalledWith({
      userId: 'user123',
      queryText: 'What do I like?',
      limit: 3,
      threshold: expect.any(Number),
    });

    expect(Array.isArray(msgs)).toBe(true);
    expect(msgs[0].role).toBe('system');
    expect(msgs[0].content).toMatch(/Relevant memories/);
    expect(msgs[0].content).toMatch(/User likes pizza\./);
    expect(msgs[1]).toEqual({ role: 'user', content: 'Hello' });
  });

  it('continues without memories when retrieval fails', async () => {
    MemoryService.retrieveRelevantMemories.mockRejectedValue(new Error('DB down'));

    const msgs = await RAGService.buildChatMessages({
      userId: 'user123',
      queryText: 'Anything',
      recentMessages: [],
    });

    expect(msgs[0].role).toBe('system');
    expect(msgs[0].content).not.toMatch(/Relevant memories/);
  });
});
