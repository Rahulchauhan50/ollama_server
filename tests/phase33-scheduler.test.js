jest.useFakeTimers();

jest.mock('../src/config', () => ({
  isProduction: false,
}));

jest.mock('../src/services/summarizer.service', () => ({
  summarizeConversation: jest.fn(),
}));

const SummarizerService = require('../src/services/summarizer.service');
const Scheduler = require('../src/services/conversation-summary-scheduler.service');

describe('Phase 33 inactivity scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('debounces and schedules one summary per conversation', async () => {
    Scheduler.scheduleConversationSummary({ conversationId: 'c1', userId: 'u1', delayMinutes: 1 });
    Scheduler.scheduleConversationSummary({ conversationId: 'c1', userId: 'u1', delayMinutes: 1 });

    jest.advanceTimersByTime(60 * 1000);
    await Promise.resolve();

    expect(SummarizerService.summarizeConversation).toHaveBeenCalledTimes(1);
    expect(SummarizerService.summarizeConversation).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'c1', userId: 'u1' })
    );
  });
});
