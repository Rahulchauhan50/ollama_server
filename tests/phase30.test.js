jest.mock('../src/services/ai.service', () => ({
  generate: jest.fn(),
}));

const AIService = require('../src/services/ai.service');
const RerankerService = require('../src/services/reranker.service');

describe('Phase 30: RAG Reranker Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses AI JSON response and returns sorted scores', async () => {
    const mockAiOutput = `[{"index":0,"score":0.9,"reason":"Good","rewrite":"Improved answer A"},{"index":1,"score":0.5,"reason":"Less relevant"}]`;
    AIService.generate.mockResolvedValue(mockAiOutput);

    const result = await RerankerService.rerankAnswers({
      userId: 'u1',
      queryText: 'Q?',
      candidateAnswers: ['A','B'],
      memories: [],
    });

    expect(AIService.generate).toHaveBeenCalled();
    expect(result[0].index).toBe(0);
    expect(result[0].score).toBeCloseTo(0.9);
    expect(result[0].rewrite).toBe('Improved answer A');
  });

  it('falls back when AI response is unparsable', async () => {
    AIService.generate.mockResolvedValue('I cannot produce JSON');

    const result = await RerankerService.rerankAnswers({
      userId: 'u1',
      queryText: 'Q?',
      candidateAnswers: ['A','B','C'],
      memories: [],
    });

    expect(result.length).toBe(3);
    expect(result[0].reason).toBe('fallback');
  });
});
