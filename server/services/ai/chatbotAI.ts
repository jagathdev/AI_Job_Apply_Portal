import { callAI, CustomApiKeys } from './grokService';

export async function generateChatbotResponse(
  userMessage: string,
  chatHistory: Array<{ sender: 'user' | 'ai'; text: string }>,
  context: {
    resumeText?: string;
    companyJD?: string;
    atsScore?: number;
    interviewPrep?: string;
  },
  customApiKeys?: CustomApiKeys
): Promise<string> {
  const systemPrompt = `You are "AI Job Search Assistant" - a friendly, objective, senior technical coach and resume advisor.
You are helping the user search for jobs, optimize their resumes, and prepare for interviews.

You are visible as a floating assistant on every page. You MUST use the provided user's details (Context) to answer all queries in a deeply grounded, customized manner.
- Do NOT make up qualifications or achievements for the user.
- Highlight gaps, suggest STAR-method examples, and write short interview response pitches when asked.
- Keep your responses structured, conversational, highly professional, encouraging, and clear.
- Use markdown bolding and lists to keep answers extremely readable and punchy.

CURRENT CONTEXT CONFIGURED:
- RESUME: ${context.resumeText ? 'Configured (' + context.resumeText.substring(0, 400) + '...)' : 'Not uploaded yet'}
- COMPANY / JOB DESCRIPTION: ${context.companyJD ? 'Configured (' + context.companyJD.substring(0, 400) + '...)' : 'Not analyzed yet'}
- CURRENT ATS SCORE: ${context.atsScore !== undefined ? context.atsScore + '/100' : 'No ATS check run yet'}
- INTERVIEW PREP STATE: ${context.interviewPrep ? 'Configured' : 'Not generated yet'}

Ensure you prioritize replying to their active message while drawing upon any historical conversation patterns below.`;

  // Format chat history for AI context
  const historySnippet = chatHistory
    .slice(-8) // Limit to last 8 messages to save tokens
    .map((msg) => `${msg.sender.toUpperCase()}: ${msg.text}`)
    .join('\n');

  const userPrompt = `
CONVERSATION HISTORY:
${historySnippet || 'None - this is the start of the chat.'}

USER ACTIVE MESSAGE:
${userMessage}
`;

  return callAI(systemPrompt, userPrompt, false, customApiKeys);
}
