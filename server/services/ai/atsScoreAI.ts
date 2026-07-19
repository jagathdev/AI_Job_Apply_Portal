import { callAI } from './grokService';

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
}

export async function generateATSReport(
  resumeText: string,
  jobDescription: string
): Promise<ATSReportResult> {
  const systemPrompt = `You are a high-end corporate applicant tracking system engine.
Analyze the provided resume against the target Job Description (JD).
Evaluate the match on multiple axes:
1. Skills Match Score (based on core technologies/methodologies mentioned vs needed)
2. Keyword Match Score (based on direct word frequency, hard skill overlap, and title synonym density)
3. Overall Score (weighted average + context adjustment)

Identify missing key terms (the gap), highlight important skills, provide concrete optimization suggestions, and return a checklist of individual, bite-sized "actionItems" that the candidate should complete to achieve a 95%+ match.

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

  const aiResponse = await callAI(systemPrompt, userPrompt, true);
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
