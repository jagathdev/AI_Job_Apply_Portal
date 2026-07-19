import { callAI } from './grokService';

export interface ResumeStructure {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedIn: string;
  };
  summary: string;
  skills: string[];
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    duration: string;
    details: string;
  }>;
  projects: Array<{
    title: string;
    description: string;
    techStack: string[];
    link: string;
  }>;
  achievements: string[];
  certifications: string[];
  languages: string[];
  interests: string[];
}

// Strips markdown code fences some models add even in "JSON mode", and
// trims to the first {...} block so trailing chatter doesn't break parsing.
// Throws a descriptive error (instead of a raw SyntaxError) when the JSON
// is genuinely truncated, so the real cause is obvious in your logs.
function safeParseResumeJSON(aiResponse: string, context: string): ResumeStructure {
  const cleaned = aiResponse
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as ResumeStructure;
  } catch (firstErr) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as ResumeStructure;
      } catch (secondErr: any) {
        console.error(`[${context}] AI response was not valid JSON, likely truncated.`);
        console.error(`[${context}] Response length: ${aiResponse.length} chars.`);
        console.error(`[${context}] Last 300 chars:`, aiResponse.slice(-300));
        throw new Error(
          `Failed to parse ${context} from AI response — it looks truncated ` +
          `(${aiResponse.length} chars received, response doesn't end with a closing brace). ` +
          `Try increasing maxOutputTokens in grokService.ts, or shortening the input resume.`
        );
      }
    }
    console.error(`[${context}] No JSON object found in AI response at all.`);
    console.error(`[${context}] Raw response:`, aiResponse.slice(0, 500));
    throw new Error(`Failed to parse ${context} from AI response — no JSON object found.`);
  }
}

export async function parseResumeText(rawText: string): Promise<ResumeStructure> {
  const systemPrompt = `You are a state-of-the-art Applicant Tracking System (ATS) parser.
Your task is to take the raw, unstructured text of a resume and extract it into a structured JSON object.
Ensure that you clean up formatting, standardize dates, and place values into the appropriate fields.
Do not lose any details; if a section isn't mentioned, return an empty array or empty string for that field.
Return ONLY the JSON object, with no markdown code fences and no commentary before or after it.

Return your response strictly as a JSON object with this structure:
{
  "personalInfo": {
    "fullName": "Name",
    "email": "Email",
    "phone": "Phone number",
    "location": "Location",
    "website": "Portfolio website URL",
    "linkedIn": "LinkedIn profile URL"
  },
  "summary": "Professional executive summary",
  "skills": ["Skill 1", "Skill 2"],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title/Role",
      "duration": "e.g. Jan 2020 - Present",
      "description": "Clean list or paragraph of achievements and responsibilities"
    }
  ],
  "education": [
    {
      "institution": "University/College",
      "degree": "Degree and Major",
      "duration": "e.g. 2016 - 2020",
      "details": "e.g. GPA, Honors"
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": "What was built, the impact, and your contribution",
      "techStack": ["React", "Node.js"],
      "link": "Github/live link"
    }
  ],
  "achievements": ["Achievement 1", "Achievement 2"],
  "certifications": ["Cert 1", "Cert 2"],
  "languages": ["English", "Spanish"],
  "interests": ["Interest 1"]
}`;

  const userPrompt = `Raw resume text to parse:\n\n${rawText}`;
  const aiResponse = await callAI(systemPrompt, userPrompt, true);
  return safeParseResumeJSON(aiResponse, 'structured resume');
}

export async function rewriteResume(
  currentResume: ResumeStructure,
  targetJD: string
): Promise<ResumeStructure> {
  const systemPrompt = `You are an elite executive resume writer.
Your task is to tailor the user's resume so that it is optimized for the provided Job Description (JD).
- Maximize keyword matching while keeping all info strictly truthful to the original resume.
- Rewrite professional summaries and bullet points in the STAR method (Situation, Task, Action, Result) with strong action verbs.
- Ensure the overall structure remains identical so the user can easily review the side-by-side comparison.
- Do not invent experience or credentials that the user does not possess. Only tailor the wording of existing items to align with the skills and keywords demanded by the job description.
Return ONLY the JSON object, with no markdown code fences and no commentary before or after it.

You must return the rewritten resume in the exact same JSON format:
{
  "personalInfo": {
    "fullName": "Name",
    "email": "Email",
    "phone": "Phone",
    "location": "Location",
    "website": "Portfolio",
    "linkedIn": "LinkedIn"
  },
  "summary": "Tailored Professional summary",
  "skills": ["Tailored/aligned skills list"],
  "experience": [
    {
      "company": "Company",
      "role": "Role",
      "duration": "Duration",
      "description": "STAR-aligned, impact-driven bullet points matching JD keywords"
    }
  ],
  "education": [
    {
      "institution": "Institution",
      "degree": "Degree",
      "duration": "Duration",
      "details": "Details"
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": "Aligned descriptions reflecting skills requested in JD",
      "techStack": ["Stack"],
      "link": "Link"
    }
  ],
  "achievements": ["Tailored achievements"],
  "certifications": ["Relevant certifications"],
  "languages": ["Languages"],
  "interests": ["Interests"]
}`;

  const userPrompt = `
CURRENT RESUME:
${JSON.stringify(currentResume, null, 2)}

TARGET JOB DESCRIPTION:
${targetJD}
`;

  const aiResponse = await callAI(systemPrompt, userPrompt, true);
  return safeParseResumeJSON(aiResponse, 'tailored resume');
}