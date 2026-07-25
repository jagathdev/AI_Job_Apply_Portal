import { callAI, CustomApiKeys } from './grokService';

type ChatMessage = { sender: 'user' | 'ai'; text: string };

interface ChatContext {
  resumeText?: string;
  companyJD?: string;
  atsScore?: number;
  interviewPrep?: string;
}

// ---- 1. Detect if the user is asking for a mail / cover letter / application letter ----
const EMAIL_INTENT_REGEX =
  /\b(mail|email|cover letter|application letter|hr mail|write.*mail|draft.*mail|send.*hr)\b/i;

function isEmailRequest(message: string): boolean {
  return EMAIL_INTENT_REGEX.test(message);
}

// ---- 2. Strip ALL markdown/junk symbols from every response - plain text only ----
function cleanPlainText(text: string): string {
  return text
    .replace(/```[a-z]*\n?/gi, '')        // code fences ```
    .replace(/^#{1,6}\s?/gm, '')          // ## headings
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')   // --- or *** dividers
    .replace(/^\s*[-*+•—–]\s+/gm, '')     // - or * or bullet markers
    .replace(/^\s*\d+\.\s+/gm, (m) => m)  // keep numbered lists as-is (1. 2. 3.)
    .replace(/\*\*(.*?)\*\*/gs, '$1')     // bold **text** (with dotAll)
    .replace(/\*(.*?)\*/gs, '$1')         // italics *text*
    .replace(/__(.*?)__/gs, '$1')         // bold __text__
    .replace(/_(.*?)_/gs, '$1')           // italics _text_
    .replace(/`([^`]*)`/gs, '$1')         // inline code
    .replace(/^>\s?/gm, '')               // blockquote >
    .replace(/\|/g, ' ')                  // table pipes |
    .replace(/[ \t]+\n/g, '\n')           // trailing spaces
    .replace(/\n{3,}/g, '\n\n')           // collapse extra blank lines
    .trim();
}

// ---- 3. Build system prompt based on intent ----
function buildSystemPrompt(context: ChatContext, emailMode: boolean): string {
  const hasResume = !!context.resumeText?.trim();
  const hasJD = !!context.companyJD?.trim();

  if (emailMode) {
    return `You are an email-drafting engine for a job-search assistant.

STRICT RULES:
1. Output ONLY the raw email — nothing else. No markdown (**, ##, ---, \`\`\`), no headings, no "here's your email" preamble, no "how to use this" or checklist sections, no explanations.
2. First line must be "Subject: <subject line>". Leave one blank line, then the email body. End with the sender's name, phone, email, location pulled ONLY from the resume text below — if not present, omit that line entirely instead of inventing it.
3. Ground every claim (skills, years of experience, projects, tech stack) ONLY in the RESUME and JOB DESCRIPTION provided below. Do NOT invent years of experience, companies, or achievements not present in the resume.
4. Tailor the content to match the JOB DESCRIPTION's requirements, but only using what genuinely exists in the resume.
5. If RESUME is missing, do not generate a generic email — instead output exactly: "Please upload your resume first so I can draft an accurate email." Nothing else.
6. If JOB DESCRIPTION is missing, still write the email using the resume, but keep it role-agnostic (do not invent a company or role name).

RESUME:
${hasResume ? context.resumeText : 'NOT PROVIDED'}

JOB DESCRIPTION:
${hasJD ? context.companyJD : 'NOT PROVIDED'}`;
  }

  return `You are "AI Job Search Assistant" - a friendly, objective, senior technical coach and resume advisor.

You MUST answer using ONLY the user's actual resume and the job description below. Never invent skills, years of experience, or achievements that are not in the resume.
If the resume or JD is missing and the question needs it, ask the user to upload/paste it instead of guessing.

FORMATTING RULES (apply to every response, no exceptions):
- Plain text only. Do NOT use markdown symbols: no **bold**, no ## headings, no --- dividers, no *, no backticks, no tables with |.
- If you need to list things, use plain numbered lines like "1. ..." "2. ..." with a line break between each — nothing else, no dashes or asterisks.
- Keep answers clear, concise, and conversational, like plain chat text.

CURRENT CONTEXT:
- RESUME: ${hasResume ? context.resumeText : 'Not uploaded yet'}
- COMPANY / JOB DESCRIPTION: ${hasJD ? context.companyJD : 'Not analyzed yet'}
- CURRENT ATS SCORE: ${context.atsScore !== undefined ? context.atsScore + '/100' : 'No ATS check run yet'}
- INTERVIEW PREP STATE: ${context.interviewPrep ? 'Configured' : 'Not generated yet'}`;
}

export async function generateChatbotResponse(
  userMessage: string,
  chatHistory: ChatMessage[],
  context: ChatContext,
  customApiKeys?: CustomApiKeys
): Promise<string> {
  const emailMode = isEmailRequest(userMessage);
  const systemPrompt = buildSystemPrompt(context, emailMode);

  const historySnippet = chatHistory
    .slice(-8)
    .map((msg) => `${msg.sender.toUpperCase()}: ${msg.text}`)
    .join('\n');

  const userPrompt = `
CONVERSATION HISTORY:
${historySnippet || 'None - this is the start of the chat.'}

USER ACTIVE MESSAGE:
${userMessage}
`;

  const raw = await callAI(systemPrompt, userPrompt, false, customApiKeys);

  // Safety net: even if the model slips and adds markdown, strip it for EVERY response
  return cleanPlainText(raw);
}