jest.mock('../src/services/ai.service', () => ({
  generate: jest.fn(),
}));

const AIService = require('../src/services/ai.service');
const ToolsController = require('../src/controllers/tools.controller');

// Helper to mock Express req/res
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Phase 32: One-Click Tools API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns generated result for a valid tool', async () => {
    AIService.generate.mockResolvedValue('Generated summary');
    const req = { params: { toolId: 'summarize_text' }, body: { input: 'Long text' }, requestId: 'r1' };
    const res = mockRes();
    await ToolsController.handleRunTool(req, res);
    expect(AIService.generate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { result: 'Generated summary' } }));
  });

  it('returns 404 for invalid tool', async () => {
    const req = { params: { toolId: 'not_a_tool' }, body: { input: 'x' }, requestId: 'r2' };
    const res = mockRes();
    await expect(ToolsController.handleRunTool(req, res)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('ignores system prompt and still runs', async () => {
    AIService.generate.mockResolvedValue('OK');
    const req = { params: { toolId: 'rewrite_text' }, body: { input: 'Text', system: 'evil override' }, requestId: 'r3' };
    const res = mockRes();
    await ToolsController.handleRunTool(req, res);
    expect(AIService.generate).toHaveBeenCalled();
  });
});
