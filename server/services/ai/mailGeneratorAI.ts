import { callAI } from './grokService';

export interface MailDraftResult {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  signature: string;
}

export async function generateHREmail(
  companyName: string,
  jobTitle: string,
  userResumeText: string,
  emailType: 'cold_outreach' | 'application_followup' | 'thank_you' = 'cold_outreach'
): Promise<MailDraftResult> {
  const systemPrompt = `You are a professional career coach and copywriter.
Generate a tailored recruitment email draft based on the company name, job title, and the candidate's resume background.
The email should be compelling, polite, concise, and focused on value.
Avoid dry templates; write as a real, confident person.

You must return your response strictly as a JSON object matching this structure:
{
  "subject": "Compelling subject line with high click-rate",
  "greeting": "Dear Hiring Team / [Hiring Manager Name] at [Company],",
  "body": "The meat of the email, highlighting 1-2 key achievements from the resume that directly align with the company's needs.",
  "closing": "Looking forward to hearing from you,",
  "signature": "[Full Name]\\n[Phone]\\n[LinkedIn]"
}`;

  const userPrompt = `
COMPANY NAME: ${companyName}
JOB TITLE: ${jobTitle}
EMAIL TYPE: ${emailType}

CANDIDATE RESUME BACK-BACKGROUND:
${userResumeText}
`;

  const aiResponse = await callAI(systemPrompt, userPrompt, true);
  try {
    return JSON.parse(aiResponse) as MailDraftResult;
  } catch (err) {
    const match = aiResponse.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as MailDraftResult;
    }
    throw new Error('Failed to parse generated HR email JSON.');
  }
}
