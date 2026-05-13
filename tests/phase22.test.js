jest.mock('../src/repositories/conversation.repository', () => ({
  findById: jest.fn(),
}));

jest.mock('../src/repositories/message.repository', () => ({
  findByConversationId: jest.fn(),
}));

const ConversationRepository = require('../src/repositories/conversation.repository');
const MessageRepository = require('../src/repositories/message.repository');
const { handleGetMessages } = require('../src/controllers/message.controller');

describe('Phase 22: Get Conversation Messages API', () => {
  const req = {
    params: { conversationId: 'conv123' },
    query: { skip: '0', limit: '2' },
    user: { _id: 'user123' },
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ConversationRepository.findById.mockResolvedValue({
      _id: 'conv123',
      userId: 'user123',
    });
    MessageRepository.findByConversationId.mockResolvedValue({
      messages: [
        { _id: 'msg1', role: 'user', content: 'Hi', createdAt: '2026-05-13T00:00:00.000Z' },
        { _id: 'msg2', role: 'assistant', content: 'Hello', createdAt: '2026-05-13T00:01:00.000Z' },
      ],
      total: 2,
    });
  });

  it('returns messages in chronological order with pagination metadata', async () => {
    await handleGetMessages(req, res);

    expect(ConversationRepository.findById).toHaveBeenCalledWith('conv123', 'user123');
    expect(MessageRepository.findByConversationId).toHaveBeenCalledWith('conv123', {
      skip: 0,
      limit: 2,
    });
    expect(res.status).toHaveBeenCalledWith(200);

    const payload = res.json.mock.calls[0][0];
    expect(payload.statusCode).toBe(200);
    expect(payload.message).toBe('Messages retrieved');
    expect(payload.data.messages).toHaveLength(2);
    expect(payload.data.pagination).toEqual({ skip: 0, limit: 2, total: 2 });
  });

  it('returns an empty array for an empty conversation', async () => {
    MessageRepository.findByConversationId.mockResolvedValue({ messages: [], total: 0 });

    await handleGetMessages(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.data.messages).toEqual([]);
    expect(payload.data.pagination.total).toBe(0);
  });

  it('returns 404 when the conversation does not belong to the user', async () => {
    ConversationRepository.findById.mockResolvedValue(null);

    await expect(handleGetMessages(req, res)).rejects.toBeDefined();

    expect(MessageRepository.findByConversationId).not.toHaveBeenCalled();
  });
});
