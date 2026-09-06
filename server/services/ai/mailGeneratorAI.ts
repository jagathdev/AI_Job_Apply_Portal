import { callAI, CustomApiKeys } from './grokService';

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
  emailType: 'cold_outreach' | 'application_followup' | 'thank_you' = 'cold_outreach',
  customApiKeys?: CustomApiKeys
): Promise<MailDraftResult> {
  const systemPrompt = `You are a professional career coach and copywriter.
Generate a tailored recruitment email draft based on the company name, job title, and the candidate's resume background.
The email should be compelling, polite, concise, and focused on value.
Avoid dry templates; write as a real, confident person.

CRITICAL FORMATTING RULE:
You MUST wrap candidate name, target job role, target company name, current job role, current company name, and key skills/technologies in markdown double asterisks **like this**:
- Target Role: e.g. **Frontend Developer (React.js)**
- Target Company: e.g. **Andor Tech**
- Current / Previous Role: e.g. **Junior Associate Software Developer**
- Current / Previous Company: e.g. **AstroVed**
- Skills: e.g. **React.js**, **JavaScript (ES6+)**, **TypeScript**, **HTML5**, **CSS3**, **RESTful APIs**
- Candidate Name: e.g. **Jagath Ratchagan V**

You must return your response strictly as a JSON object matching this structure:
{
  "subject": "Application for **[Job Title]** – **[Candidate Name]**",
  "greeting": "Dear Hiring Team / [Hiring Manager Name] at **[Company Name]**,",
  "body": "The meat of the email, highlighting key achievements from the resume that directly align with the company's needs. Ensure candidate name, current role, current company, skills, and target company are wrapped in **bold** asterisks.",
  "closing": "Looking forward to hearing from you,",
  "signature": "**[Full Name]**\\n[Phone]\\n[Email]\\n[LinkedIn]"
}`;

  const userPrompt = `
COMPANY NAME: ${companyName}
JOB TITLE: ${jobTitle}
EMAIL TYPE: ${emailType}

CANDIDATE RESUME BACK-BACKGROUND:
${userResumeText}
`;

  const aiResponse = await callAI(systemPrompt, userPrompt, true, customApiKeys);
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
