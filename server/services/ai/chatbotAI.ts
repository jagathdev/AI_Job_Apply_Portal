import { callAI, CustomApiKeys } from './grokService';

type ChatMessage = { sender: 'user' | 'ai'; text: string };

export interface ChatContext {
  resumeText?: string;
  companyJD?: string;
  atsScore?: number;
  interviewPrep?: string;
  userInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    portfolio?: string;
    linkedIn?: string;
    github?: string;
    degree?: string;
  };
}

// ---- 1. Detect if the user is asking for a mail / cover letter / application / whatsapp ----
const EMAIL_INTENT_REGEX =
  /\b(draft.*(?:mail|email|letter|outreach|whatsapp)|write.*(?:mail|email|letter|outreach|whatsapp)|send.*(?:mail|email|hr|whatsapp)|cold.*email|cover.*letter|email.*draft|mail.*draft|hr.*email|email.*hr|whatsapp)\b/i;

function isEmailRequest(message: string): boolean {
  return EMAIL_INTENT_REGEX.test(message);
}

// ---- 2. Count existing questions in chat history to support sequential numbering (6, 7, 8...) ----
function getExistingQuestionCount(chatHistory: ChatMessage[]): number {
  let count = 0;
  for (const msg of chatHistory) {
    if (msg.sender === 'ai') {
      const numbersInMsg: number[] = [];

      const qMatches = msg.text.match(/Question\s*(\d+)/gi);
      if (qMatches) {
        qMatches.forEach(m => {
          const numMatch = m.match(/\d+/);
          if (numMatch) numbersInMsg.push(parseInt(numMatch[0], 10));
        });
      }

      const numMatches = msg.text.match(/(?:^|\n)\s*(\d+)[\.\)]\s+/g);
      if (numMatches) {
        numMatches.forEach(m => {
          const numMatch = m.match(/\d+/);
          if (numMatch) {
            const num = parseInt(numMatch[0], 10);
            if (num < 200) numbersInMsg.push(num);
          }
        });
      }

      if (numbersInMsg.length > 0) {
        const maxInMsg = Math.max(...numbersInMsg);
        if (maxInMsg > count) count = maxInMsg;
      }
    }
  }
  return count;
}

// ---- 3. Code-level renumbering & newline formatting guarantees ----
function formatQuestionNumbersAndAnswers(text: string, startNum: number): string {
  // Guarantee 1: Place a blank line before Answer: if it's on the same line or immediately adjacent
  let formatted = text.replace(/([^\n])\s*(Answer:)/gi, '$1\n\nAnswer:');

  // Guarantee 2: Code-level renumbering starting from startNum (e.g., 6, 11, 16)
  let currentNum = startNum;

  if (/Question\s*\d+[:\.]/i.test(formatted)) {
    formatted = formatted.replace(/Question\s*\d+[:\.]/gi, () => {
      const res = `Question ${currentNum}:`;
      currentNum++;
      return res;
    });
  } else {
    formatted = formatted.replace(/(?:^|\n)\s*\d+[\.\)]\s+/g, (match) => {
      const prefix = match.startsWith('\n') ? '\n\n' : '';
      const res = `${prefix}${currentNum}. `;
      currentNum++;
      return res;
    });
  }

  return formatted;
}

// ---- 4. Strip junk symbols from response ----
function cleanPlainText(text: string, emailMode = false): string {
  if (emailMode) {
    return text
      .replace(/```[a-z]*\n?/gi, '')        // code fences ```
      .replace(/^#{1,6}\s?/gm, '')          // ## headings
      .replace(/`(.*?)`/gs, '$1')           // inline code
      .trim();
  }
  return text
    .replace(/```[a-z]*\n?/gi, '')        // code fences ```
    .replace(/^#{1,6}\s?/gm, '')          // ## headings
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')   // --- or *** dividers
    .replace(/\*\*(.*?)\*\*/gs, '$1')     // bold **text**
    .replace(/\*(.*?)\*/gs, '$1')         // italics *text*
    .replace(/`(.*?)`/gs, '$1')           // inline code
    .trim();
}

// ---- 5. Build system prompt based on intent ----
function buildSystemPrompt(context: ChatContext, emailMode: boolean, nextStartNum: number): string {
  const hasResume = !!context.resumeText?.trim();
  const hasJD = !!context.companyJD?.trim();

  if (emailMode) {
    const candidateName = context.userInfo?.name || 'Jagathratchagan V';
    const candidateDegree = context.userInfo?.degree || '2025 M.Sc. Computer Science graduate';
    const candidateEmail = context.userInfo?.email || 'jagath9360@gmail.com';
    const candidatePhone = context.userInfo?.phone || '+91 9360270984';
    const candidateLocation = context.userInfo?.location || 'Chennai, Tamil Nadu, India';
    const candidateGithub = context.userInfo?.github || 'https://github.com/jagathdev';
    const candidateLinkedin = context.userInfo?.linkedIn || 'https://linkedin.com/in/jagathdevloper';
    const candidatePortfolio = context.userInfo?.portfolio || 'https://portfolio-jagathratchagan.vercel.app';

    return `You are an email and outreach drafting engine for a job-search assistant.

STRICT MANDATORY RULES:
1. Output ONLY the raw email or message — nothing else. No code fences, no headings, no preamble, no explanations.
2. DO NOT add numbers (e.g., 1., 2., 3.) to paragraphs of emails, WhatsApp messages, or cover letters. Write natural paragraphs without paragraph numbers.
3. DO NOT output long essay paragraphs, internship lists, project descriptions, company histories, or metric stats.
4. Keep the message short, punchy, and under 90 words.
5. You MUST output EXACTLY this short, concise email format word-for-word, substituting ONLY <Role Title>, <Company Name>, and <Recruiter Name> from the JOB DESCRIPTION below (if JOB DESCRIPTION is provided; otherwise use "Frontend Developer (React.js)" or "Associate Software Engineer (ASE)", "Target Company", and "Hiring Team"):

Subject: Application for **<Role Title>** – **${candidateName}**

Dear **<Recruiter Name>**,

I am writing to apply for the **<Role Title>** position at **<Company Name>**.

I am a **${candidateDegree}** with hands-on experience building performant, responsive UIs using **JavaScript, React.js, TypeScript, HTML5/CSS3, and REST APIs**, alongside full-stack application development.

My updated resume is attached for your consideration. I look forward to the opportunity to discuss how my background fits your team.

Best regards,
**${candidateName}**
${candidatePhone}
${candidateEmail}
${candidateLocation}
GitHub: ${candidateGithub}
LinkedIn: ${candidateLinkedin}
Portfolio: ${candidatePortfolio}

6. DO NOT alter the body text, paragraph order, or signature footer.
7. DO NOT put GitHub/LinkedIn links above "Best regards". They MUST appear strictly below "Best regards," as part of the footer signature.`;
  }

  return `You are "AI Job Search Assistant" - a friendly, objective, senior technical coach and resume advisor.

You MUST answer using ONLY the user's actual resume and the job description below. Never invent skills, years of experience, or achievements that are not in the resume.
If the resume or JD is missing and the question needs it, ask the user to upload/paste it instead of guessing.

FORMATTING RULES (apply to every response, no exceptions):
- Plain text only. Do NOT use markdown symbols: no **bold**, no ## headings, no --- dividers, no *, no backticks, no tables with |.
- NEVER add paragraph numbers (1., 2., 3.) to messages, email drafts, WhatsApp drafts, or conversational body text.
- WHEN USER ASKS FOR TECHNICAL INTERVIEW QUESTIONS:
  1. Always provide AT LEAST 5 technical interview questions along with clear, concise, high-impact answers for each.
  2. You MUST number the questions sequentially starting strictly from ${nextStartNum} (e.g. ${nextStartNum}., ${nextStartNum + 1}., ${nextStartNum + 2}., ${nextStartNum + 3}., ${nextStartNum + 4}.). DO NOT start from 1!
  3. MANDATORY NEWLINE RULE: Place a BLANK LINE between the question and the Answer. The word "Answer:" MUST start on a new line below a blank line.
  4. Format each entry as:

${nextStartNum}. <Question text>

Answer: <Concise direct answer text>

${nextStartNum + 1}. <Question text>

Answer: <Concise direct answer text>

  5. Never output just questions without answers.
  6. End your message with: "Want more questions? Click 'More Questions' below or type 'More Questions'."
- For non-interview queries, keep answers clear, concise, and conversational, like plain chat text.

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

  const pastHistory = chatHistory.filter(
    (m, idx) => !(idx === chatHistory.length - 1 && m.sender === 'user' && m.text === userMessage)
  );
  const existingQuestionCount = getExistingQuestionCount(pastHistory);

  const isQuestionRequest = /\b(question|questions|q&a|interview|5 more|more questions|load 5 more)\b/i.test(userMessage);
  const nextStartNum = isQuestionRequest ? existingQuestionCount + 1 : 1;

  const systemPrompt = buildSystemPrompt(context, emailMode, nextStartNum);

  const historySnippet = pastHistory
    .slice(-8)
    .map((msg) => `${msg.sender.toUpperCase()}: ${msg.text}`)
    .join('\n');

  const extraInstruction = isQuestionRequest
    ? `\nIMPORTANT INSTRUCTION:
The user is requesting technical interview questions. The previous question count was ${existingQuestionCount}.
You MUST number the new 5 questions sequentially starting strictly from ${nextStartNum} to ${nextStartNum + 4} (e.g. ${nextStartNum}., ${nextStartNum + 1}., ${nextStartNum + 2}., ${nextStartNum + 3}., ${nextStartNum + 4}.).
DO NOT start from 1!
Also, place a BLANK LINE between each question and its Answer so "Answer:" starts on a clean new line.`
    : '';

  const userPrompt = `
CONVERSATION HISTORY:
${historySnippet || 'None - this is the start of the chat.'}

USER ACTIVE MESSAGE:
${userMessage}${extraInstruction}
`;

  const raw = await callAI(systemPrompt, userPrompt, false, customApiKeys);
  const cleaned = cleanPlainText(raw, emailMode);

  // Guarantee programmatically at code level:
  if (isQuestionRequest) {
    return formatQuestionNumbersAndAnswers(cleaned, nextStartNum);
  }

  return cleaned;
}