const TRAILING_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from',
  'in', 'into', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'to', 'with'
]);

// Smart Title Casing: Capitalizes words but preserves existing acronyms (e.g., HTML, USA)
const titleCase = (value) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      if (part === part.toUpperCase() && part.length > 1) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');

// Dynamically removes conversational framing from any prompt
const cleanConversationalFluff = (text) => {
  let result = text;
  
  // 1. Remove basic greetings
  result = result.replace(/^(hi|hello|hey|greetings|dear)[,.!-\s]+/i, '');
  
  // 2. Remove universal request prefixes (works for any topic)
  const requestRegex = /^(can you|could you|would you|please|tell me(?: about)?|show me|explain|describe|how to|how do [we|i]|how can [we|i]|what is(?: the)?|what are(?: the)?|write(?: me)?(?: a| an| some)?|create(?: me)?(?: a| an| some)?|generate(?: a| an| some)?|help me(?: with)?|i need(?: help(?: with)?)?|i want to|give me(?: a| an| some)?|just)\b\s*/i;

  let prev;
  do {
    prev = result;
    result = result.replace(requestRegex, '');
  } while (result !== prev); 

  return result.trim() || text; 
};

const buildConversationTitleFromMessage = (message) => {
  // 1. Normalize spaces and handle empty inputs
  const text = (message || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return 'New Conversation';
  }

  // 2. Strip the conversational framing from the prompt
  let coreTopic = cleanConversationalFluff(text);
  
  // 3. Grab only the first sentence or clause to ensure conciseness
  coreTopic = coreTopic.split(/[.?!;\n]/)[0].trim();

  // 4. Tokenize the remaining phrase
  let words = coreTopic.split(/\s+/);
  
  // 5. Limit to a natural title length (e.g., maximum 6 words)
  let titleWords = words.slice(0, 6);

  // 6. Remove trailing grammar words so the title doesn't end awkwardly (e.g., "The Capital Of" -> "The Capital")
  while (titleWords.length > 0 && TRAILING_STOP_WORDS.has(titleWords[titleWords.length - 1].toLowerCase())) {
    titleWords.pop();
  }

  // 7. Fallback: If stripping left nothing, use the first few words of the raw message
  if (titleWords.length === 0) {
    titleWords = text.split(/\s+/).slice(0, 4);
  }

  // 8. Clean trailing punctuation and apply title casing
  const rawTitle = titleWords.join(' ').replace(/[^A-Za-z0-9]+$/, '');
  return titleCase(rawTitle).slice(0, 200);
};

module.exports = {
  buildConversationTitleFromMessage,
};