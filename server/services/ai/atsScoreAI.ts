import { callAI, CustomApiKeys } from './grokService';

export interface ATSReportResult {
  overallScore: number;
  skillsMatchScore: number;
  keywordMatchScore: number;
  missingKeywords: string[];
  importantSkills: string[];
  suggestions: string[];
  actionItems: Array<{
    task: string;
    completed: boolean;
  }>;
  bulletPointComparisons?: Array<{
    original: string;
    suggested: string;
    section: string;
    index: number;
    applied: boolean;
  }>;
}

export async function generateATSReport(
  resumeText: string,
  jobDescription: string,
  customApiKeys?: CustomApiKeys
): Promise<ATSReportResult> {
  const systemPrompt = `You are a high-end corporate applicant tracking system engine.
Analyze the provided resume against the target Job Description (JD).
Evaluate the match on multiple axes:
1. Skills Match Score (based on core technologies/methodologies mentioned vs needed)
2. Keyword Match Score (based on direct word frequency, hard skill overlap, and title synonym density)
3. Overall Score (weighted average + context adjustment)

Identify missing key terms (the gap), highlight important skills, provide concrete optimization suggestions, and return a checklist of individual, bite-sized "actionItems" that the candidate should complete to achieve a 95%+ match.
Crucially, you must also provide "bulletPointComparisons": analyze the experience bullet points in the resume, and provide 2-3 examples where the original phrasing is rewritten using the STAR method, heavily infused with the JD's keywords. Include the section ("experience" or "projects") and the zero-based index of where that bullet occurs.

Return your response strictly as a JSON object with this structure:
{
  "overallScore": 72,
  "skillsMatchScore": 68,
  "keywordMatchScore": 75,
  "missingKeywords": ["Redux", "Docker", "REST API", "System Design"],
  "importantSkills": ["React", "TypeScript", "Node.js", "Express", "NoSQL Databases"],
  "suggestions": [
    "Incorporate Docker and containerization under your skills and mention any basic project or familiarity.",
    "Rewrite your Senior Developer bullet points to focus on API throughput and latency optimization since they stress scalability.",
    "Add your experience with RESTful architecture in your Experience section rather than just in your skills cloud."
  ],
  "bulletPointComparisons": [
    {
      "original": "Built responsive UI for the dashboard using React.",
      "suggested": "Developed highly responsive, data-driven dashboard UIs using React and Redux, improving load speeds by 30% and aligning with enterprise REST API architecture.",
      "section": "experience",
      "index": 0,
      "applied": false
    },
    {
      "original": "Worked on backend microservices with Node.js.",
      "suggested": "Architected backend microservices in Node.js and Express, containerized via Docker to ensure highly scalable and available NoSQL database transactions.",
      "section": "projects",
      "index": 1,
      "applied": false
    }
  ],
  "actionItems": [
    { "task": "Add Redux and state management keywords to your React projects.", "completed": false },
    { "task": "Describe Docker containerization experience in your second project description.", "completed": false },
    { "task": "Integrate REST API keywords in at least two of your professional experience bullet points.", "completed": false }
  ]
}`;

  const userPrompt = `
RESUME TEXT:
${resumeText}

JOB DESCRIPTION:
${jobDescription}
`;

  const aiResponse = await callAI(systemPrompt, userPrompt, true, customApiKeys);
  try {
    return JSON.parse(aiResponse) as ATSReportResult;
  } catch (err) {
    const match = aiResponse.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as ATSReportResult;
    }
    throw new Error('Failed to parse ATS Report JSON.');
  }
}
