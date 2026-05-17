const { buildRetrievalQueryText } = require('../src/services/rag.service');

describe('RAG retrieval query context', () => {
  it('combines recent turns with the current user message', () => {
    const query = buildRetrievalQueryText({
      queryText: 'What about his companies?',
      recentMessages: [
        { role: 'user', content: 'Tell me about Elon Musk' },
        { role: 'assistant', content: 'Elon Musk leads Tesla and SpaceX.' },
      ],
    });

    expect(query).toContain('Tell me about Elon Musk');
    expect(query).toContain('Elon Musk leads Tesla and SpaceX.');
    expect(query).toContain('What about his companies?');
  });

  it('limits the retrieval query length', () => {
    const query = buildRetrievalQueryText({
      queryText: 'x'.repeat(5000),
      recentMessages: Array.from({ length: 20 }, (_, index) => ({
        role: index % 2 === 0 ? 'user' : 'assistant',
        content: `message ${index}`,
      })),
    });

    expect(query.length).toBeLessThanOrEqual(2000);
  });
});
