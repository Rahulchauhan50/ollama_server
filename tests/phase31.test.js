jest.mock('../src/services/ai.service', () => ({
  generate: jest.fn(),
}));

const AIService = require('../src/services/ai.service');
const NBestService = require('../src/services/nbest.service');

describe('Phase 31: N-Best Candidate Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses JSON array of strings from AI generate', async () => {
    AIService.generate.mockResolvedValue('["Answer A","Answer B","Answer C"]');

    const candidates = await NBestService.generateNBest({ model: 'm', prompt: 'Q', n: 3 });
    expect(AIService.generate).toHaveBeenCalled();
    expect(candidates).toEqual(['Answer A','Answer B','Answer C']);
  });

  it('extracts quoted strings when AI returns noisy text', async () => {
    AIService.generate.mockResolvedValue('Here are options:\n"A"\n"B"\n"C"');
    const candidates = await NBestService.generateNBest({ model: 'm', prompt: 'Q', n: 3 });
    expect(candidates).toEqual(['A','B','C']);
  });
});
